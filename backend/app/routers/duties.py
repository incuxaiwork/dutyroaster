from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Duty, DutyStatus
from pydantic import BaseModel

from ..schemas import DutyIn
from ..services.audit import audit


class StatusUpdate(BaseModel):
    status: str

router = APIRouter(prefix="/api/duties", tags=["duties"])


def serialize(duty: Duty) -> dict:
    return {
        "id": duty.id,
        "duty_name": duty.duty_name,
        "duty_type": duty.duty_type,
        "location": duty.location,
        "start_date": duty.start_date,
        "end_date": duty.end_date,
        "start_time": duty.start_time,
        "end_time": duty.end_time,
        "shift_type": duty.shift_type,
        "required_officers": duty.required_officers,
        "required_rank": duty.required_rank,
        "required_skills": [s.strip() for s in (duty.required_skills or "").split(",") if s.strip()],
        "priority_level": duty.priority_level,
        "special_instructions": duty.special_instructions,
        "status": duty.status,
        "incharge_officer_id": duty.incharge_officer_id,
        "incharge_officer_name": duty.incharge_officer.name if duty.incharge_officer else None,
        "created_at": duty.created_at,
    }


@router.get("")
def list_duties(date: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Duty)
    if date:
        query = query.filter(Duty.start_date == date)
    if status:
        query = query.filter(Duty.status == status)
    return [serialize(duty) for duty in query.order_by(Duty.start_date.desc(), Duty.start_time).all()]


@router.post("")
def create_duty(payload: DutyIn, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["required_skills"] = ", ".join(payload.required_skills)
    duty = Duty(**data)
    db.add(duty)
    db.flush()
    audit(db, "create_duty", "duty", duty.id, duty.duty_name)
    db.commit()
    db.refresh(duty)
    return serialize(duty)


@router.put("/{duty_id}")
def update_duty(duty_id: int, payload: DutyIn, db: Session = Depends(get_db)):
    duty = db.get(Duty, duty_id)
    if not duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    data = payload.model_dump()
    data["required_skills"] = ", ".join(payload.required_skills)
    for key, value in data.items():
        setattr(duty, key, value)
    audit(db, "edit_duty", "duty", duty.id, duty.duty_name)
    db.commit()
    db.refresh(duty)
    return serialize(duty)


@router.patch("/{duty_id}/status")
def update_duty_status(duty_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    duty = db.get(Duty, duty_id)
    if not duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    old_status = duty.status
    duty.status = payload.status
    audit(db, "change_status", "duty", duty.id, f"{old_status} → {payload.status}")
    db.commit()
    db.refresh(duty)
    return serialize(duty)


@router.delete("/{duty_id}")
def cancel_duty(duty_id: int, db: Session = Depends(get_db)):
    duty = db.get(Duty, duty_id)
    if not duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    duty.status = DutyStatus.cancelled
    audit(db, "cancel_duty", "duty", duty.id, duty.duty_name)
    db.commit()
    return {"ok": True}
