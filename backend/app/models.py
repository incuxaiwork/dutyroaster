from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Role(str, Enum):
    admin = "Admin"
    dsp = "DSP"
    ci = "CI"
    si = "SI"
    viewer = "Viewer"


class AvailabilityStatus(str, Enum):
    available = "Available"
    leave = "On Leave"
    training = "Training"
    suspended = "Suspended"
    special_assignment = "Special Assignment"


class ShiftType(str, Enum):
    morning = "Morning"
    evening = "Evening"
    night = "Night"
    custom = "Custom"


class PriorityLevel(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"


class DutyStatus(str, Enum):
    draft = "Draft"
    pending = "Pending Allocation"
    allocated = "Allocated"
    in_progress = "In Progress"
    completed = "Completed"
    cancelled = "Cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(SAEnum(Role), default=Role.viewer)
    station_scope: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Officer(Base):
    __tablename__ = "officers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(140), index=True)
    belt_number: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    rank: Mapped[str] = mapped_column(String(80), index=True)
    station: Mapped[str] = mapped_column(String(120), index=True)
    mobile_number: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    department_unit: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    joining_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        SAEnum(AvailabilityStatus), default=AvailabilityStatus.available, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    skills: Mapped[List["Skill"]] = relationship(
        secondary="officer_skills", back_populates="officers"
    )


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    officers: Mapped[List[Officer]] = relationship(
        secondary="officer_skills", back_populates="skills"
    )


class OfficerSkill(Base):
    __tablename__ = "officer_skills"

    officer_id: Mapped[int] = mapped_column(ForeignKey("officers.id"), primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), primary_key=True)


class Duty(Base):
    __tablename__ = "duties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    duty_name: Mapped[str] = mapped_column(String(160), index=True)
    duty_type: Mapped[str] = mapped_column(String(100))
    location: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    start_date: Mapped[datetime] = mapped_column(Date, index=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    start_time: Mapped[datetime] = mapped_column(Time)
    end_time: Mapped[datetime] = mapped_column(Time)
    shift_type: Mapped[ShiftType] = mapped_column(SAEnum(ShiftType), index=True)
    required_officers: Mapped[int] = mapped_column(Integer, default=1)
    required_rank: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    required_skills: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    priority_level: Mapped[PriorityLevel] = mapped_column(SAEnum(PriorityLevel))
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[DutyStatus] = mapped_column(SAEnum(DutyStatus), default=DutyStatus.pending)
    incharge_officer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    assignments: Mapped[List["DutyAssignment"]] = relationship(
        back_populates="duty", cascade="all, delete-orphan"
    )
    incharge_officer: Mapped[Optional["Officer"]] = relationship(foreign_keys=[incharge_officer_id])

    __table_args__ = (CheckConstraint("required_officers > 0"),)


class DutyRequirement(Base):
    __tablename__ = "duty_requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    duty_id: Mapped[int] = mapped_column(ForeignKey("duties.id", ondelete="CASCADE"))
    rank: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    skill: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    count: Mapped[int] = mapped_column(Integer, default=1)


class RosterBatch(Base):
    __tablename__ = "roster_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    roster_date: Mapped[datetime] = mapped_column(Date, index=True)
    station: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    shift_type: Mapped[Optional[ShiftType]] = mapped_column(SAEnum(ShiftType), nullable=True)
    generated_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    fairness_score: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DutyAssignment(Base):
    __tablename__ = "duty_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    duty_id: Mapped[int] = mapped_column(ForeignKey("duties.id", ondelete="CASCADE"), index=True)
    officer_id: Mapped[int] = mapped_column(ForeignKey("officers.id"), index=True)
    roster_batch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("roster_batches.id"), nullable=True)
    assignment_date: Mapped[datetime] = mapped_column(Date, index=True)
    start_time: Mapped[datetime] = mapped_column(Time)
    end_time: Mapped[datetime] = mapped_column(Time)
    shift_type: Mapped[ShiftType] = mapped_column(SAEnum(ShiftType), index=True)
    working_hours: Mapped[float] = mapped_column(Float)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    duty: Mapped[Duty] = relationship(back_populates="assignments")
    officer: Mapped[Officer] = relationship()

    __table_args__ = (
        UniqueConstraint("officer_id", "assignment_date", "shift_type", name="uq_officer_shift"),
        UniqueConstraint("officer_id", "duty_id", name="uq_officer_duty"),
    )


class OfficerAvailability(Base):
    __tablename__ = "officer_availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    officer_id: Mapped[int] = mapped_column(ForeignKey("officers.id", ondelete="CASCADE"))
    status: Mapped[AvailabilityStatus] = mapped_column(SAEnum(AvailabilityStatus))
    start_date: Mapped[datetime] = mapped_column(Date)
    end_date: Mapped[datetime] = mapped_column(Date)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)


class RosterHistory(Base):
    __tablename__ = "roster_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    roster_batch_id: Mapped[int] = mapped_column(ForeignKey("roster_batches.id"))
    action: Mapped[str] = mapped_column(String(80))
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(80))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
