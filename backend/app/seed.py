"""
Rich seed – wipes and repopulates every table so the UI has meaningful data.
Run via:  cd backend && python -m app.seed
Or automatically on server startup (main.py lifespan).
"""
from datetime import date, time, timedelta

from passlib.context import CryptContext
from sqlalchemy import text

from .database import Base, SessionLocal, engine
from .models import (
    AuditLog,
    Duty,
    DutyAssignment,
    DutyStatus,
    Officer,
    PriorityLevel,
    Role,
    RosterBatch,
    RosterHistory,
    ShiftType,
    Skill,
    User,
)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── helpers ──────────────────────────────────────────────────────────────────

def _day(offset: int = 0) -> date:
    return date.today() - timedelta(days=offset)


def _hours(start: time, end: time) -> float:
    from datetime import datetime
    s = datetime.combine(date.today(), start)
    e = datetime.combine(date.today(), end)
    if e <= s:
        from datetime import timedelta as td
        e += td(days=1)
    return round((e - s).total_seconds() / 3600, 2)


# ── main ─────────────────────────────────────────────────────────────────────

def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── wipe existing data (reverse FK order) ────────────────────────────
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(text(f"DELETE FROM {table.name}"))
        db.commit()

        # ── users ────────────────────────────────────────────────────────────
        users = [
            User(name="District Admin",   email="admin@drms.local",      password_hash=pwd.hash("Admin123!"),    role=Role.admin),
            User(name="DSP North",        email="dsp@drms.local",         password_hash=pwd.hash("Dsp12345!"),    role=Role.dsp,    station_scope="North"),
            User(name="CI West",          email="ci.west@drms.local",     password_hash=pwd.hash("CiWest12!"),    role=Role.ci,     station_scope="West"),
            User(name="SI Central",       email="si.central@drms.local",  password_hash=pwd.hash("SiCent12!"),    role=Role.si,     station_scope="Central"),
            User(name="Station Viewer",   email="viewer@drms.local",      password_hash=pwd.hash("Viewer123!"),   role=Role.viewer),
        ]
        db.add_all(users)
        db.flush()
        admin_id = users[0].id

        # ── skills ───────────────────────────────────────────────────────────
        skill_names = ["Traffic Control", "First Aid", "Crowd Control", "VIP Security", "Investigation", "Armed Guard"]
        skills_map: dict[str, Skill] = {}
        for name in skill_names:
            s = Skill(name=name)
            db.add(s)
            skills_map[name] = s
        db.flush()

        def sk(*names: str) -> list[Skill]:
            return [skills_map[n] for n in names]

        # ── officers ─────────────────────────────────────────────────────────
        officers_data = [
            dict(name="Asha Rao",       belt_number="PC-1001",  rank="Constable",     station="Central", gender="Female", department_unit="Traffic",        joining_date=date(2022, 1, 15),  availability_status="Available",        skills=sk("Traffic Control", "First Aid")),
            dict(name="Vikram Singh",    belt_number="HC-2042",  rank="Head Constable",station="Central", gender="Male",   department_unit="Law and Order",   joining_date=date(2018, 7, 3),   availability_status="Available",        skills=sk("Crowd Control", "Armed Guard")),
            dict(name="Meera Patel",    belt_number="SI-3011",  rank="SI",            station="North",   gender="Female", department_unit="Investigation",   joining_date=date(2016, 3, 22),  availability_status="Available",        skills=sk("VIP Security", "Investigation")),
            dict(name="Rahul Nair",     belt_number="PC-1140",  rank="Constable",     station="North",   gender="Male",   department_unit="Patrol",          joining_date=date(2021, 11, 10), availability_status="On Leave",         skills=sk("First Aid", "Crowd Control")),
            dict(name="Farhan Ali",     belt_number="CI-5102",  rank="CI",            station="West",    gender="Male",   department_unit="Operations",      joining_date=date(2012, 9, 18),  availability_status="Available",        skills=sk("Crowd Control", "VIP Security")),
            dict(name="Priya Sharma",   belt_number="PC-1205",  rank="Constable",     station="South",   gender="Female", department_unit="Patrol",          joining_date=date(2023, 3, 1),   availability_status="Available",        skills=sk("Traffic Control")),
            dict(name="Suresh Kumar",   belt_number="HC-2090",  rank="Head Constable",station="West",    gender="Male",   department_unit="Law and Order",   joining_date=date(2019, 6, 15),  availability_status="Available",        skills=sk("Crowd Control", "First Aid")),
            dict(name="Anita Desai",    belt_number="SI-3045",  rank="SI",            station="South",   gender="Female", department_unit="Investigation",   joining_date=date(2017, 8, 20),  availability_status="Available",        skills=sk("Investigation", "First Aid")),
            dict(name="Rajan Verma",    belt_number="DSP-9001", rank="DSP",           station="Central", gender="Male",   department_unit="Administration",  joining_date=date(2010, 1, 5),   availability_status="Available",        skills=sk("VIP Security", "Armed Guard")),
            dict(name="Kavitha Reddy",  belt_number="PC-1310",  rank="Constable",     station="North",   gender="Female", department_unit="Traffic",         joining_date=date(2024, 1, 10),  availability_status="Available",        skills=sk("Traffic Control", "First Aid")),
            dict(name="Mohan Das",      belt_number="HC-2155",  rank="Head Constable",station="South",   gender="Male",   department_unit="Patrol",          joining_date=date(2015, 5, 12),  availability_status="Training",         skills=sk("Crowd Control")),
            dict(name="Lakshmi Iyer",   belt_number="PC-1420",  rank="Constable",     station="West",    gender="Female", department_unit="Traffic",         joining_date=date(2023, 8, 5),   availability_status="Available",        skills=sk("Traffic Control", "First Aid")),
        ]
        officers = []
        for d in officers_data:
            o = Officer(**{k: v for k, v in d.items() if k != "skills"})
            o.skills = d["skills"]
            db.add(o)
            officers.append(o)
        db.flush()

        # index by name for easy reference
        off = {o.name: o for o in officers}

        # ── duties ───────────────────────────────────────────────────────────
        duties_data = [
            # today
            dict(duty_name="Market Patrol",          duty_type="Patrol",       location="Central Market",       date=_day(0), start_time=time(8),  end_time=time(14), shift_type=ShiftType.morning, required_officers=2, required_rank="Constable",     required_skills="Traffic Control", priority_level=PriorityLevel.high,     status=DutyStatus.allocated,  created_by=admin_id),
            dict(duty_name="VIP Route Security",     duty_type="VIP",          location="North Avenue",         date=_day(0), start_time=time(16), end_time=time(22), shift_type=ShiftType.evening, required_officers=1, required_rank="SI",            required_skills="VIP Security",    priority_level=PriorityLevel.critical, status=DutyStatus.allocated,  created_by=admin_id),
            dict(duty_name="Night Checkpost",        duty_type="Checkpost",    location="West Bypass",          date=_day(0), start_time=time(22), end_time=time(6),  shift_type=ShiftType.night,   required_officers=2, required_rank="Head Constable",required_skills="Crowd Control",   priority_level=PriorityLevel.medium,   status=DutyStatus.allocated,  created_by=admin_id),
            dict(duty_name="School Zone Traffic",    duty_type="Traffic",      location="South School Road",    date=_day(0), start_time=time(8),  end_time=time(13), shift_type=ShiftType.morning, required_officers=1, required_rank="Constable",     required_skills="Traffic Control", priority_level=PriorityLevel.medium,   status=DutyStatus.allocated,  created_by=admin_id),
            dict(duty_name="Festival Ground Security",duty_type="Event",       location="Central Ground",       date=_day(0), start_time=time(14), end_time=time(22), shift_type=ShiftType.evening, required_officers=3, required_rank=None,            required_skills="Crowd Control",   priority_level=PriorityLevel.high,     status=DutyStatus.pending,    created_by=admin_id),
            dict(duty_name="Railway Station Watch",  duty_type="Surveillance", location="Central Rly Station",  date=_day(0), start_time=time(6),  end_time=time(14), shift_type=ShiftType.morning, required_officers=2, required_rank="Head Constable",required_skills="",                priority_level=PriorityLevel.high,     status=DutyStatus.allocated,  created_by=admin_id),
            # yesterday
            dict(duty_name="Market Patrol",          duty_type="Patrol",       location="Central Market",       date=_day(1), start_time=time(8),  end_time=time(14), shift_type=ShiftType.morning, required_officers=2, required_rank="Constable",     required_skills="Traffic Control", priority_level=PriorityLevel.high,     status=DutyStatus.completed,  created_by=admin_id),
            dict(duty_name="VIP Escort",             duty_type="VIP",          location="Airport Road",         date=_day(1), start_time=time(10), end_time=time(16), shift_type=ShiftType.morning, required_officers=2, required_rank="SI",            required_skills="VIP Security",    priority_level=PriorityLevel.critical, status=DutyStatus.completed,  created_by=admin_id),
            dict(duty_name="Night Patrol",           duty_type="Patrol",       location="North Sector",         date=_day(1), start_time=time(22), end_time=time(6),  shift_type=ShiftType.night,   required_officers=2, required_rank=None,            required_skills="",                priority_level=PriorityLevel.medium,   status=DutyStatus.completed,  created_by=admin_id),
            # 2 days ago
            dict(duty_name="Sports Event Security",  duty_type="Event",        location="City Stadium",         date=_day(2), start_time=time(14), end_time=time(20), shift_type=ShiftType.evening, required_officers=4, required_rank=None,            required_skills="Crowd Control",   priority_level=PriorityLevel.high,     status=DutyStatus.completed,  created_by=admin_id),
            dict(duty_name="Morning Traffic",        duty_type="Traffic",      location="MG Road Junction",     date=_day(2), start_time=time(7),  end_time=time(11), shift_type=ShiftType.morning, required_officers=2, required_rank="Constable",     required_skills="Traffic Control", priority_level=PriorityLevel.medium,   status=DutyStatus.completed,  created_by=admin_id),
        ]
        duties = []
        for d in duties_data:
            duty = Duty(**d)
            db.add(duty)
            duties.append(duty)
        db.flush()

        # name+date index
        def duty(name: str, offset: int) -> Duty:
            target = _day(offset)
            return next(d for d in duties if d.duty_name == name and d.date == target)

        # ── roster batches ───────────────────────────────────────────────────
        b_today     = RosterBatch(roster_date=_day(0), station=None, shift_type=None,           generated_by=admin_id, is_locked=False, fairness_score=88.5)
        b_yesterday = RosterBatch(roster_date=_day(1), station=None, shift_type=None,           generated_by=admin_id, is_locked=True,  fairness_score=92.0)
        b_2ago      = RosterBatch(roster_date=_day(2), station=None, shift_type=None,           generated_by=admin_id, is_locked=True,  fairness_score=85.0)
        b_central   = RosterBatch(roster_date=_day(3), station="Central", shift_type=ShiftType.morning, generated_by=admin_id, is_locked=True, fairness_score=94.0)
        db.add_all([b_today, b_yesterday, b_2ago, b_central])
        db.flush()

        db.add_all([
            RosterHistory(roster_batch_id=b_yesterday.id, action="generated", details="7 assignments created"),
            RosterHistory(roster_batch_id=b_yesterday.id, action="locked",    details="Roster finalized"),
            RosterHistory(roster_batch_id=b_2ago.id,      action="generated", details="6 assignments created"),
            RosterHistory(roster_batch_id=b_2ago.id,      action="locked",    details="Roster finalized"),
            RosterHistory(roster_batch_id=b_today.id,     action="generated", details="5 assignments created"),
        ])

        # ── duty assignments ─────────────────────────────────────────────────
        # (officer, duty_obj, batch, date_offset)
        assignments_spec = [
            # TODAY
            (off["Asha Rao"],      duty("Market Patrol",          0), b_today,     0, time(8),  time(14), ShiftType.morning),
            (off["Kavitha Reddy"], duty("Market Patrol",          0), b_today,     0, time(8),  time(14), ShiftType.morning),
            (off["Meera Patel"],   duty("VIP Route Security",     0), b_today,     0, time(16), time(22), ShiftType.evening),
            (off["Vikram Singh"],  duty("Night Checkpost",        0), b_today,     0, time(22), time(6),  ShiftType.night),
            (off["Suresh Kumar"],  duty("Night Checkpost",        0), b_today,     0, time(22), time(6),  ShiftType.night),
            (off["Priya Sharma"],  duty("School Zone Traffic",    0), b_today,     0, time(8),  time(13), ShiftType.morning),
            (off["Rajan Verma"],   duty("Railway Station Watch",  0), b_today,     0, time(6),  time(14), ShiftType.morning),
            # YESTERDAY
            (off["Asha Rao"],      duty("Market Patrol",          1), b_yesterday, 1, time(8),  time(14), ShiftType.morning),
            (off["Kavitha Reddy"], duty("Market Patrol",          1), b_yesterday, 1, time(8),  time(14), ShiftType.morning),
            (off["Meera Patel"],   duty("VIP Escort",             1), b_yesterday, 1, time(10), time(16), ShiftType.morning),
            (off["Rajan Verma"],   duty("VIP Escort",             1), b_yesterday, 1, time(10), time(16), ShiftType.morning),
            (off["Vikram Singh"],  duty("Night Patrol",           1), b_yesterday, 1, time(22), time(6),  ShiftType.night),
            (off["Suresh Kumar"],  duty("Night Patrol",           1), b_yesterday, 1, time(22), time(6),  ShiftType.night),
            (off["Farhan Ali"],    duty("Market Patrol",          1), b_yesterday, 1, time(8),  time(14), ShiftType.morning),
            # 2 DAYS AGO
            (off["Farhan Ali"],    duty("Sports Event Security",  2), b_2ago,      2, time(14), time(20), ShiftType.evening),
            (off["Suresh Kumar"],  duty("Sports Event Security",  2), b_2ago,      2, time(14), time(20), ShiftType.evening),
            (off["Vikram Singh"],  duty("Sports Event Security",  2), b_2ago,      2, time(14), time(20), ShiftType.evening),
            (off["Priya Sharma"],  duty("Sports Event Security",  2), b_2ago,      2, time(14), time(20), ShiftType.evening),
            (off["Asha Rao"],      duty("Morning Traffic",        2), b_2ago,      2, time(7),  time(11), ShiftType.morning),
            (off["Kavitha Reddy"], duty("Morning Traffic",        2), b_2ago,      2, time(7),  time(11), ShiftType.morning),
        ]

        created_assignments = []
        seen_pairs: set[tuple] = set()
        for officer, d, batch, day_off, st, et, shift in assignments_spec:
            pair = (officer.id, d.id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            a = DutyAssignment(
                duty_id=d.id,
                officer_id=officer.id,
                roster_batch_id=batch.id,
                assignment_date=_day(day_off),
                start_time=st,
                end_time=et,
                shift_type=shift,
                working_hours=_hours(st, et),
                is_locked=batch.is_locked,
            )
            db.add(a)
            created_assignments.append(a)

        # ── audit logs ───────────────────────────────────────────────────────
        from datetime import datetime
        def _dt(day_off: int, hour: int, minute: int = 0) -> datetime:
            d = _day(day_off)
            return datetime(d.year, d.month, d.day, hour, minute)

        audit_entries = [
            AuditLog(actor_id=admin_id, action="create_officer",   entity_type="officer",       details="Asha Rao (PC-1001)",        created_at=_dt(7, 9, 0)),
            AuditLog(actor_id=admin_id, action="create_officer",   entity_type="officer",       details="Vikram Singh (HC-2042)",     created_at=_dt(7, 9, 5)),
            AuditLog(actor_id=admin_id, action="create_officer",   entity_type="officer",       details="Meera Patel (SI-3011)",      created_at=_dt(6, 10, 0)),
            AuditLog(actor_id=admin_id, action="create_officer",   entity_type="officer",       details="Kavitha Reddy (PC-1310)",    created_at=_dt(3, 11, 0)),
            AuditLog(actor_id=admin_id, action="set_availability", entity_type="officer",       details="Rahul Nair → On Leave",      created_at=_dt(2, 8, 30)),
            AuditLog(actor_id=admin_id, action="create_duty",      entity_type="duty",          details="Market Patrol",              created_at=_dt(2, 7, 0)),
            AuditLog(actor_id=admin_id, action="create_duty",      entity_type="duty",          details="VIP Route Security",         created_at=_dt(2, 7, 5)),
            AuditLog(actor_id=admin_id, action="generate_roster",  entity_type="roster_batch",  details="6 assignments created",      created_at=_dt(2, 8, 0)),
            AuditLog(actor_id=admin_id, action="lock_roster",      entity_type="roster_batch",  details="2-day-ago batch finalized",  created_at=_dt(2, 8, 45)),
            AuditLog(actor_id=admin_id, action="generate_roster",  entity_type="roster_batch",  details="7 assignments created",      created_at=_dt(1, 8, 0)),
            AuditLog(actor_id=admin_id, action="lock_roster",      entity_type="roster_batch",  details="Yesterday batch finalized",  created_at=_dt(1, 8, 50)),
            AuditLog(actor_id=admin_id, action="create_duty",      entity_type="duty",          details="Festival Ground Security",   created_at=_dt(0, 7, 30)),
            AuditLog(actor_id=admin_id, action="generate_roster",  entity_type="roster_batch",  details="5 assignments created",      created_at=_dt(0, 8, 15)),
        ]
        db.add_all(audit_entries)

        db.commit()
        print(f"[seed] done: {len(officers)} officers, {len(duties)} duties, {len(created_assignments)} assignments, {len(audit_entries)} audit logs")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    run()
