from __future__ import annotations

from datetime import date, datetime, time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .models import AvailabilityStatus, DutyStatus, PriorityLevel, Role, ShiftType


class UserCreate(BaseModel):
    name: str
    email: str
    password: str = "ChangeMe123!"
    role: Role = Role.viewer
    station_scope: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: Role
    station_scope: Optional[str]
    is_active: bool


class OfficerIn(BaseModel):
    name: str
    belt_number: str
    rank: str
    station: str
    mobile_number: Optional[str] = None
    gender: Optional[str] = None
    department_unit: Optional[str] = None
    joining_date: Optional[date] = None
    availability_status: AvailabilityStatus = AvailabilityStatus.available
    skills: List[str] = Field(default_factory=list)


class OfficerOut(OfficerIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool


class DutyIn(BaseModel):
    duty_name: str
    duty_type: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    start_time: time
    end_time: time
    shift_type: ShiftType
    required_officers: int = 1
    required_rank: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    priority_level: PriorityLevel = PriorityLevel.medium
    special_instructions: Optional[str] = None
    status: DutyStatus = DutyStatus.pending
    incharge_officer_id: Optional[int] = None


class DutyOut(DutyIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class AvailabilityIn(BaseModel):
    officer_id: int
    status: AvailabilityStatus
    start_date: date
    end_date: date
    reason: Optional[str] = None


class RosterGenerateIn(BaseModel):
    date: date
    station: Optional[str] = None
    shift: Optional[ShiftType] = None
    duty_ids: Optional[List[int]] = None
    generated_by: Optional[int] = None


class AssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    duty_id: int
    officer_id: int
    roster_batch_id: Optional[int]
    assignment_date: date
    start_time: time
    end_time: time
    shift_type: ShiftType
    working_hours: float
    is_locked: bool
    officer_name: Optional[str] = None
    belt_number: Optional[str] = None
    duty_name: Optional[str] = None
    location: Optional[str] = None


class RosterGenerateOut(BaseModel):
    batch_id: int
    fairness_score: float
    assigned_count: int
    unfilled: List[Dict[str, Any]]
    assignments: List[AssignmentOut]


class ReassignIn(BaseModel):
    assignment_id: int
    officer_id: int
    actor_id: Optional[int] = None


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[str]
    created_at: datetime
