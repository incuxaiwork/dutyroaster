from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DutyAssignment, RosterBatch, RosterHistory
from ..schemas import ReassignIn, RosterGenerateIn
from ..services.audit import audit
from ..services.roster import assignment_view, generate_roster

router = APIRouter(prefix="/api/rosters", tags=["rosters"])


@router.post("/generate")
def generate(payload: RosterGenerateIn, db: Session = Depends(get_db)):
    return generate_roster(db, payload)


@router.get("/daily")
def daily_roster(date: str, station: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DutyAssignment).filter(DutyAssignment.assignment_date == date)
    if station:
        query = query.join(DutyAssignment.officer).filter_by(station=station)
    return [assignment_view(item) for item in query.order_by(DutyAssignment.start_time).all()]


@router.get("/history")
def history(scope: str = "daily", db: Session = Depends(get_db)):
    return [
        {
            "id": batch.id,
            "date": batch.roster_date,
            "station": batch.station,
            "shift_type": batch.shift_type,
            "fairness_score": batch.fairness_score,
            "is_locked": batch.is_locked,
            "created_at": batch.created_at,
        }
        for batch in db.query(RosterBatch).order_by(RosterBatch.created_at.desc()).limit(100).all()
    ]


@router.post("/reassign")
def reassign(payload: ReassignIn, db: Session = Depends(get_db)):
    assignment = db.get(DutyAssignment, payload.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.is_locked:
        raise HTTPException(status_code=409, detail="Assignment is locked")
    old = assignment.officer_id
    assignment.officer_id = payload.officer_id
    audit(db, "reassign_officer", "assignment", assignment.id, f"{old} -> {payload.officer_id}", payload.actor_id)
    db.commit()
    db.refresh(assignment)
    return assignment_view(assignment)


@router.delete("/assignments/{assignment_id}")
def remove_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.get(DutyAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.is_locked:
        raise HTTPException(status_code=409, detail="Assignment is locked")
    db.delete(assignment)
    audit(db, "remove_assignment", "assignment", assignment_id, "")
    db.commit()
    return {"ok": True}


@router.post("/{batch_id}/lock")
def lock_roster(batch_id: int, actor_id: Optional[int] = None, db: Session = Depends(get_db)):
    batch = db.get(RosterBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Roster batch not found")
    batch.is_locked = True
    db.query(DutyAssignment).filter(DutyAssignment.roster_batch_id == batch_id).update({"is_locked": True})
    db.add(RosterHistory(roster_batch_id=batch_id, action="locked", details="Roster finalized"))
    audit(db, "lock_roster", "roster_batch", batch_id, "Roster finalized", actor_id)
    db.commit()
    return {"ok": True}
