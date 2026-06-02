from __future__ import annotations

from io import BytesIO
from typing import Optional

import pandas as pd
from sqlalchemy.orm import Session

from ..models import Officer, Skill, UploadedFile


OFFICER_COLUMNS = [
    "Name",
    "Belt Number / Employee ID",
    "Rank",
    "Station",
    "Mobile Number",
    "Gender",
    "Department/Unit",
    "Joining Date",
    "Availability Status",
    "Skills",
]


def get_or_create_skill(db: Session, name: str) -> Skill:
    clean = name.strip()
    skill = db.query(Skill).filter(Skill.name.ilike(clean)).first()
    if skill:
        return skill
    skill = Skill(name=clean)
    db.add(skill)
    db.flush()
    return skill


def officer_template() -> BytesIO:
    out = BytesIO()
    sample = pd.DataFrame(
        [
            {"Name": "Asha Rao",       "Belt Number / Employee ID": "PC-1001",  "Rank": "Constable",     "Station": "Central", "Mobile Number": "9000000001", "Gender": "Female", "Department/Unit": "Traffic",        "Joining Date": "2022-01-15", "Availability Status": "Available", "Skills": "Traffic Control, First Aid"},
            {"Name": "Vikram Singh",   "Belt Number / Employee ID": "HC-2042",  "Rank": "Head Constable","Station": "Central", "Mobile Number": "9000000002", "Gender": "Male",   "Department/Unit": "Law and Order",  "Joining Date": "2018-07-03", "Availability Status": "Available", "Skills": "Crowd Control"},
            {"Name": "Meera Patel",    "Belt Number / Employee ID": "SI-3011",  "Rank": "SI",            "Station": "North",   "Mobile Number": "9000000003", "Gender": "Female", "Department/Unit": "Investigation",  "Joining Date": "2016-03-22", "Availability Status": "Available", "Skills": "VIP Security, Investigation"},
            {"Name": "Rahul Nair",     "Belt Number / Employee ID": "PC-1140",  "Rank": "Constable",     "Station": "North",   "Mobile Number": "9000000004", "Gender": "Male",   "Department/Unit": "Patrol",         "Joining Date": "2021-11-10", "Availability Status": "On Leave",  "Skills": "First Aid, Crowd Control"},
            {"Name": "Farhan Ali",     "Belt Number / Employee ID": "CI-5102",  "Rank": "CI",            "Station": "West",    "Mobile Number": "9000000005", "Gender": "Male",   "Department/Unit": "Operations",     "Joining Date": "2012-09-18", "Availability Status": "Available", "Skills": "Crowd Control, VIP Security"},
            {"Name": "Priya Sharma",   "Belt Number / Employee ID": "PC-1205",  "Rank": "Constable",     "Station": "South",   "Mobile Number": "9000000006", "Gender": "Female", "Department/Unit": "Patrol",         "Joining Date": "2023-03-01", "Availability Status": "Available", "Skills": "Traffic Control"},
            {"Name": "Suresh Kumar",   "Belt Number / Employee ID": "HC-2090",  "Rank": "Head Constable","Station": "West",    "Mobile Number": "9000000007", "Gender": "Male",   "Department/Unit": "Law and Order",  "Joining Date": "2019-06-15", "Availability Status": "Available", "Skills": "Crowd Control, First Aid"},
            {"Name": "Anita Desai",    "Belt Number / Employee ID": "SI-3045",  "Rank": "SI",            "Station": "South",   "Mobile Number": "9000000008", "Gender": "Female", "Department/Unit": "Investigation",  "Joining Date": "2017-08-20", "Availability Status": "Available", "Skills": "Investigation, First Aid"},
            {"Name": "Rajan Verma",    "Belt Number / Employee ID": "DSP-9001", "Rank": "DSP",           "Station": "Central", "Mobile Number": "9000000009", "Gender": "Male",   "Department/Unit": "Administration", "Joining Date": "2010-01-05", "Availability Status": "Available", "Skills": "VIP Security, Armed Guard"},
            {"Name": "Kavitha Reddy",  "Belt Number / Employee ID": "PC-1310",  "Rank": "Constable",     "Station": "North",   "Mobile Number": "9000000010", "Gender": "Female", "Department/Unit": "Traffic",        "Joining Date": "2024-01-10", "Availability Status": "Available", "Skills": "Traffic Control, First Aid"},
        ],
        columns=OFFICER_COLUMNS,
    )
    sample.to_excel(out, index=False)
    out.seek(0)
    return out


def import_officers(db: Session, filename: str, content: bytes, actor_id: Optional[int] = None) -> int:
    df = pd.read_excel(BytesIO(content)).fillna("")
    count = 0
    for _, row in df.iterrows():
        belt = str(row.get("Belt Number / Employee ID", "")).strip()
        if not belt:
            continue
        officer = db.query(Officer).filter(Officer.belt_number == belt).first()
        if not officer:
            officer = Officer(belt_number=belt, name="", rank="", station="")
            db.add(officer)
        officer.name = str(row.get("Name", "")).strip()
        officer.rank = str(row.get("Rank", "")).strip()
        officer.station = str(row.get("Station", "")).strip()
        officer.mobile_number = str(row.get("Mobile Number", "")).strip() or None
        officer.gender = str(row.get("Gender", "")).strip() or None
        officer.department_unit = str(row.get("Department/Unit", "")).strip() or None
        if str(row.get("Joining Date", "")).strip():
            officer.joining_date = pd.to_datetime(row.get("Joining Date")).date()
        if str(row.get("Availability Status", "")).strip():
            officer.availability_status = str(row.get("Availability Status")).strip()
        officer.skills = [
            get_or_create_skill(db, skill)
            for skill in str(row.get("Skills", "")).split(",")
            if skill.strip()
        ]
        count += 1
    db.add(UploadedFile(filename=filename, file_type="officers_excel", row_count=count, uploaded_by=actor_id))
    return count
