from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AvailabilityStatus, Duty, DutyAssignment, DutyStatus, Officer

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    total = db.query(func.count(Officer.id)).filter(Officer.is_active.is_(True)).scalar() or 0
    available = db.query(func.count(Officer.id)).filter(Officer.availability_status == AvailabilityStatus.available, Officer.is_active.is_(True)).scalar() or 0
    on_leave = db.query(func.count(Officer.id)).filter(Officer.availability_status == AvailabilityStatus.leave, Officer.is_active.is_(True)).scalar() or 0
    duties_today = db.query(func.count(Duty.id)).filter(Duty.start_date == today).scalar() or 0
    pending = db.query(func.count(Duty.id)).filter(Duty.status == DutyStatus.pending).scalar() or 0
    allocated = db.query(func.count(Duty.id)).filter(Duty.status == DutyStatus.allocated).scalar() or 0
    completed = db.query(func.count(Duty.id)).filter(Duty.status == DutyStatus.completed).scalar() or 0

    week_start = today - timedelta(days=today.weekday())
    weekly = (
        db.query(Officer.name, func.coalesce(func.sum(DutyAssignment.working_hours), 0).label("hours"))
        .join(DutyAssignment, DutyAssignment.officer_id == Officer.id, isouter=True)
        .filter((DutyAssignment.assignment_date >= week_start) | (DutyAssignment.id.is_(None)))
        .group_by(Officer.id)
        .order_by(func.coalesce(func.sum(DutyAssignment.working_hours), 0).desc())
        .limit(10)
        .all()
    )
    shift = db.query(DutyAssignment.shift_type, func.sum(DutyAssignment.working_hours)).group_by(DutyAssignment.shift_type).all()
    station = db.query(Officer.station, func.count(DutyAssignment.id)).join(DutyAssignment, DutyAssignment.officer_id == Officer.id).group_by(Officer.station).all()
    rank = db.query(Officer.rank, func.count(DutyAssignment.id)).join(DutyAssignment, DutyAssignment.officer_id == Officer.id).group_by(Officer.rank).all()
    duty_count = db.query(func.count(Duty.id)).scalar() or 0
    covered = db.query(func.count(Duty.id)).filter(Duty.status.in_([DutyStatus.allocated, DutyStatus.completed])).scalar() or 0
    hours = [row.hours for row in weekly if row.hours > 0]
    fairness = max(0, round(100 - (max(hours) - min(hours) if len(hours) > 1 else 0), 2)) if hours else 0

    return {
        "cards": {
            "total_officers": total,
            "available_officers": available,
            "officers_on_leave": on_leave,
            "total_duties_today": duties_today,
            "pending_duties": pending,
            "allocated_duties": allocated,
            "completed_duties": completed,
            "fairness_score": fairness,
            "duty_coverage_percentage": round((covered / duty_count) * 100, 2) if duty_count else 0,
        },
        "weekly_hours": [{"name": name, "hours": hours} for name, hours in weekly],
        "monthly_hours": [{"name": name, "hours": round(hours * 4, 2)} for name, hours in weekly],
        "shift_breakdown": [{"name": str(name.value if hasattr(name, "value") else name), "hours": hours or 0} for name, hours in shift],
        "station_deployment": [{"name": name, "count": count} for name, count in station],
        "rank_deployment": [{"name": name, "count": count} for name, count in rank],
        "most_utilized": [{"name": name, "hours": hours} for name, hours in weekly[:5]],
        "least_utilized": [{"name": name, "hours": hours} for name, hours in list(reversed(weekly[-5:]))],
        "overtime": [{"name": name, "hours": hours} for name, hours in weekly if hours > 48],
        "under_utilization": [{"name": name, "hours": hours} for name, hours in weekly if hours < 8],
    }
