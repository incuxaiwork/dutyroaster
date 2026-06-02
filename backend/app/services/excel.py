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


COLUMN_ALIASES = {
    "name": ["Name", "name"],
    "belt": ["Belt Number / Employee ID", "belt_number", "G.No", "G.No.", "gno", "Employee ID"],
    "rank": ["Rank", "rank"],
    "station": ["Station", "station", "Nature of duty"],
    "mobile": ["Mobile Number", "mobile_number", "Cell No.", "Cell No", "cellNo"],
    "gender": ["Gender", "gender"],
    "department": ["Department/Unit", "department_unit", "Nature of duty"],
    "joining_date": ["Joining Date", "joining_date"],
    "availability": ["Availability Status", "availability_status"],
    "skills": ["Skills", "skills"],
}


def _col(row: dict, aliases: list[str]) -> str:
    for a in aliases:
        val = row.get(a)
        if val is not None and str(val).strip():
            return str(val).strip()
    return ""


KNOWN_HEADERS = {"s.no.", "rank", "g.no", "name", "belt number", "belt"}


def _find_header_row(df_raw: pd.DataFrame) -> int:
    for i in range(min(10, len(df_raw))):
        row_vals = [str(v).strip().lower() for v in df_raw.iloc[i].values if pd.notna(v)]
        match_count = sum(1 for h in KNOWN_HEADERS if h in row_vals)
        if match_count >= 2:
            return i
    return 0


def import_officers(db: Session, filename: str, content: bytes, actor_id: Optional[int] = None) -> int:
    if filename and filename.lower().endswith(".csv"):
        df = pd.read_csv(BytesIO(content)).fillna("")
    else:
        buf = BytesIO(content)
        df_raw = pd.read_excel(buf, engine="openpyxl", header=None)
        header_row = _find_header_row(df_raw)
        df = pd.read_excel(BytesIO(content), engine="openpyxl", header=header_row).fillna("")
    df.columns = [str(c).strip() for c in df.columns]
    rows = df.to_dict(orient="records")
    count = 0
    belt_counts: dict[str, int] = {}
    for row in rows:
        belt = _col(row, COLUMN_ALIASES["belt"])
        if not belt or belt == "-":
            serial = _col(row, ["S.No.", "S.No", "s_no", "serial", "Serial No."])
            belt = f"unknown-{serial}" if serial else ""
        if not belt:
            continue
        dup = belt_counts.get(belt, 0)
        if dup > 0:
            belt = f"{belt}-{dup}"
        belt_counts[belt] = dup + 1
        officer = db.query(Officer).filter(Officer.belt_number == belt).first()
        if not officer:
            officer = Officer(belt_number=belt, name="", rank="", station="")
            db.add(officer)
        officer.name = _col(row, COLUMN_ALIASES["name"])
        officer.rank = _col(row, COLUMN_ALIASES["rank"])
        officer.station = _col(row, COLUMN_ALIASES["station"])
        officer.mobile_number = _col(row, COLUMN_ALIASES["mobile"]) or None
        officer.gender = _col(row, COLUMN_ALIASES["gender"]) or None
        officer.department_unit = _col(row, COLUMN_ALIASES["department"]) or None
        jd = _col(row, COLUMN_ALIASES["joining_date"])
        if jd:
            officer.joining_date = pd.to_datetime(jd).date()
        av = _col(row, COLUMN_ALIASES["availability"])
        if av:
            officer.availability_status = av
        skills_str = _col(row, COLUMN_ALIASES["skills"])
        officer.skills = [
            get_or_create_skill(db, skill)
            for skill in skills_str.split(",")
            if skill.strip()
        ]
        count += 1
    db.add(UploadedFile(filename=filename, file_type="officers_excel", row_count=count, uploaded_by=actor_id))
    return count
