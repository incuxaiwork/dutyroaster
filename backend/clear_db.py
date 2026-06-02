"""
Clears all data from the database except the admin user.
Run:  cd backend && python clear_db.py
"""
from app.database import SessionLocal
from app.models import AuditLog, Duty, DutyAssignment, DutyRequirement, Officer, OfficerAvailability, OfficerSkill, RosterBatch, RosterHistory, Skill, UploadedFile
from sqlalchemy import text

TABLES = [
    DutyAssignment, RosterHistory, OfficerAvailability, OfficerSkill,
    DutyRequirement, Duty, RosterBatch, UploadedFile, AuditLog,
    Officer, Skill,
]

db = SessionLocal()
try:
    for table in TABLES:
        db.execute(text(f"DELETE FROM {table.__tablename__}"))
    db.commit()
    count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
    print(f"Done. All data cleared. {count} user(s) kept.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
