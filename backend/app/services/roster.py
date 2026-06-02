from __future__ import annotations

from datetime import date, datetime, time, timedelta
from random import random

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..models import (
    AvailabilityStatus,
    Duty,
    DutyAssignment,
    DutyStatus,
    Officer,
    OfficerAvailability,
    RosterBatch,
    RosterHistory,
)
from ..schemas import RosterGenerateIn
from .audit import audit


def duty_hours(start: time, end: time) -> float:
    today = date.today()
    start_dt = datetime.combine(today, start)
    end_dt = datetime.combine(today, end)
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)
    return round((end_dt - start_dt).total_seconds() / 3600, 2)


def overlaps(a_start: time, a_end: time, b_start: time, b_end: time) -> bool:
    today = date.today()
    a1, a2 = datetime.combine(today, a_start), datetime.combine(today, a_end)
    b1, b2 = datetime.combine(today, b_start), datetime.combine(today, b_end)
    if a2 <= a1:
        a2 += timedelta(days=1)
    if b2 <= b1:
        b2 += timedelta(days=1)
    return a1 < b2 and b1 < a2


def assignment_view(assignment: DutyAssignment) -> dict:
    return {
        "id": assignment.id,
        "duty_id": assignment.duty_id,
        "officer_id": assignment.officer_id,
        "roster_batch_id": assignment.roster_batch_id,
        "assignment_date": assignment.assignment_date,
        "start_time": assignment.start_time,
        "end_time": assignment.end_time,
        "shift_type": assignment.shift_type,
        "working_hours": assignment.working_hours,
        "is_locked": assignment.is_locked,
        "officer_name": assignment.officer.name if assignment.officer else None,
        "belt_number": assignment.officer.belt_number if assignment.officer else None,
        "duty_name": assignment.duty.duty_name if assignment.duty else None,
        "location": assignment.duty.location if assignment.duty else None,
    }


def generate_roster(db: Session, request: RosterGenerateIn) -> dict:
    duties_query = db.query(Duty).filter(Duty.start_date == request.date, Duty.status != DutyStatus.cancelled)
    if request.station:
        duties_query = duties_query.filter(Duty.location.ilike(f"%{request.station}%"))
    if request.shift:
        duties_query = duties_query.filter(Duty.shift_type == request.shift)
    if request.duty_ids:
        duties_query = duties_query.filter(Duty.id.in_(request.duty_ids))
    duties = duties_query.order_by(Duty.priority_level, Duty.start_time).all()

    batch = RosterBatch(roster_date=request.date, station=request.station, shift_type=request.shift, generated_by=request.generated_by)
    db.add(batch)
    db.flush()

    week_start = request.date - timedelta(days=request.date.weekday())
    weekly_hours = dict(
        db.query(DutyAssignment.officer_id, func.coalesce(func.sum(DutyAssignment.working_hours), 0))
        .filter(DutyAssignment.assignment_date >= week_start, DutyAssignment.assignment_date <= request.date)
        .group_by(DutyAssignment.officer_id)
        .all()
    )
    unavailable_ids = {
        row[0]
        for row in db.query(OfficerAvailability.officer_id)
        .filter(
            OfficerAvailability.start_date <= request.date,
            OfficerAvailability.end_date >= request.date,
            OfficerAvailability.status != AvailabilityStatus.available,
        )
        .all()
    }
    existing = db.query(DutyAssignment).filter(DutyAssignment.assignment_date == request.date).all()
    assigned_count = 0
    unfilled: list[dict] = []
    created: list[DutyAssignment] = []

    for duty in duties:
        required_skills = {s.strip().lower() for s in (duty.required_skills or "").split(",") if s.strip()}
        candidates = db.query(Officer).filter(
            Officer.is_active.is_(True),
            Officer.availability_status == AvailabilityStatus.available,
            ~Officer.id.in_(unavailable_ids or {0}),
        )
        if request.station:
            candidates = candidates.filter(Officer.station == request.station)
        if duty.required_rank:
            candidates = candidates.filter(Officer.rank == duty.required_rank)

        eligible = []
        for officer in candidates.all():
            skill_names = {skill.name.lower() for skill in officer.skills}
            if required_skills and not required_skills.issubset(skill_names):
                continue
            officer_assignments = [a for a in existing + created if a.officer_id == officer.id]
            if any(a.shift_type == duty.shift_type for a in officer_assignments):
                continue
            if any(overlaps(a.start_time, a.end_time, duty.start_time, duty.end_time) for a in officer_assignments):
                continue
            eligible.append(officer)

        eligible.sort(key=lambda officer: (weekly_hours.get(officer.id, 0), random()))
        selected = eligible[: duty.required_officers]
        for officer in selected:
            assignment = DutyAssignment(
                duty_id=duty.id,
                officer_id=officer.id,
                roster_batch_id=batch.id,
                assignment_date=request.date,
                start_time=duty.start_time,
                end_time=duty.end_time,
                shift_type=duty.shift_type,
                working_hours=duty_hours(duty.start_time, duty.end_time),
            )
            db.add(assignment)
            db.flush()
            created.append(assignment)
            weekly_hours[officer.id] = weekly_hours.get(officer.id, 0) + assignment.working_hours
            assigned_count += 1
        duty.status = DutyStatus.allocated if len(selected) == duty.required_officers else DutyStatus.pending
        if len(selected) < duty.required_officers:
            unfilled.append({"duty_id": duty.id, "duty_name": duty.duty_name, "missing": duty.required_officers - len(selected)})

    hours = list(weekly_hours.values())
    fairness = round(100 - (max(hours) - min(hours) if len(hours) > 1 else 0), 2) if hours else 100
    batch.fairness_score = max(0, fairness)
    db.add(RosterHistory(roster_batch_id=batch.id, action="generated", details=f"{assigned_count} assignments created"))
    audit(db, "generate_roster", "roster_batch", batch.id, f"Generated {assigned_count} assignments", request.generated_by)
    db.commit()
    for assignment in created:
        db.refresh(assignment)
    return {
        "batch_id": batch.id,
        "fairness_score": batch.fairness_score,
        "assigned_count": assigned_count,
        "unfilled": unfilled,
        "assignments": [assignment_view(a) for a in created],
    }
