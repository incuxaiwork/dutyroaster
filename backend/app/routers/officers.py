from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DutyAssignment, Officer, Skill
from ..schemas import AvailabilityIn, OfficerIn
from ..services.audit import audit
from ..services.excel import get_or_create_skill, import_officers, officer_template

router = APIRouter(prefix="/api/officers", tags=["officers"])


def serialize(officer: Officer, weekly_hours: float = 0, monthly_hours: float = 0) -> dict:
    return {
        "id": officer.id,
        "name": officer.name,
        "belt_number": officer.belt_number,
        "rank": officer.rank,
        "station": officer.station,
        "mobile_number": officer.mobile_number,
        "gender": officer.gender,
        "department_unit": officer.department_unit,
        "joining_date": officer.joining_date,
        "availability_status": officer.availability_status,
        "is_active": officer.is_active,
        "skills": [skill.name for skill in officer.skills],
        "weekly_hours": round(weekly_hours, 1),
        "monthly_hours": round(monthly_hours, 1),
    }


@router.get("/skills")
def list_skills(db: Session = Depends(get_db)):
    return [skill.name for skill in db.query(Skill).order_by(Skill.name).all()]


@router.get("/template")
def download_template():
    return StreamingResponse(
        officer_template(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=officer_template.xlsx"},
    )


@router.post("/upload")
async def upload_officers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    count = import_officers(db, file.filename or "officers.xlsx", content)
    audit(db, "upload_officers", "uploaded_file", None, f"{count} officers imported")
    db.commit()
    return {"imported": count}


@router.post("/availability")
def set_availability(payload: AvailabilityIn, db: Session = Depends(get_db)):
    from ..models import OfficerAvailability

    officer = db.get(Officer, payload.officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    officer.availability_status = payload.status
    db.add(OfficerAvailability(**payload.model_dump()))
    audit(db, "set_availability", "officer", officer.id, payload.status)
    db.commit()
    return {"ok": True}


@router.get("")
def list_officers(
    search: Optional[str] = None,
    rank: Optional[str] = None,
    station: Optional[str] = None,
    availability: Optional[str] = None,
    skill: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Officer).filter(Officer.is_active.is_(True))
    if search:
        query = query.filter((Officer.name.ilike(f"%{search}%")) | (Officer.belt_number.ilike(f"%{search}%")))
    if rank:
        query = query.filter(Officer.rank == rank)
    if station:
        query = query.filter(Officer.station == station)
    if availability:
        query = query.filter(Officer.availability_status == availability)
    officers = query.order_by(Officer.rank, Officer.name).all()
    if skill:
        officers = [officer for officer in officers if skill.lower() in {s.name.lower() for s in officer.skills}]

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    weekly = dict(
        db.query(DutyAssignment.officer_id, func.coalesce(func.sum(DutyAssignment.working_hours), 0))
        .filter(DutyAssignment.assignment_date >= week_start)
        .group_by(DutyAssignment.officer_id)
        .all()
    )
    monthly = dict(
        db.query(DutyAssignment.officer_id, func.coalesce(func.sum(DutyAssignment.working_hours), 0))
        .filter(DutyAssignment.assignment_date >= month_start)
        .group_by(DutyAssignment.officer_id)
        .all()
    )

    return [serialize(officer, weekly.get(officer.id, 0), monthly.get(officer.id, 0)) for officer in officers]


@router.post("")
def create_officer(payload: OfficerIn, db: Session = Depends(get_db)):
    if db.query(Officer).filter(Officer.belt_number == payload.belt_number).first():
        raise HTTPException(status_code=409, detail="Belt number already exists")
    officer = Officer(**payload.model_dump(exclude={"skills"}))
    officer.skills = [get_or_create_skill(db, skill) for skill in payload.skills]
    db.add(officer)
    db.flush()
    audit(db, "create_officer", "officer", officer.id, officer.name)
    db.commit()
    db.refresh(officer)
    return serialize(officer, 0, 0)


@router.put("/{officer_id}")
def update_officer(officer_id: int, payload: OfficerIn, db: Session = Depends(get_db)):
    officer = db.get(Officer, officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    for key, value in payload.model_dump(exclude={"skills"}).items():
        setattr(officer, key, value)
    officer.skills = [get_or_create_skill(db, skill) for skill in payload.skills]
    audit(db, "edit_officer", "officer", officer.id, officer.name)
    db.commit()
    db.refresh(officer)
    return serialize(officer, 0, 0)


@router.delete("/{officer_id}")
def deactivate_officer(officer_id: int, db: Session = Depends(get_db)):
    officer = db.get(Officer, officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    officer.is_active = False
    audit(db, "deactivate_officer", "officer", officer.id, officer.name)
    db.commit()
    return {"ok": True}
