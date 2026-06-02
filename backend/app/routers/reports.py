from __future__ import annotations

from io import BytesIO
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session, contains_eager

from ..database import get_db
from ..models import Duty, DutyAssignment

router = APIRouter(prefix="/api/reports", tags=["reports"])


COLUMNS = ["Date", "Duty", "Duty Type", "Location", "Officer", "Belt Number", "Rank", "Station", "Shift", "Start", "End", "Hours", "Duty End Date"]


def assignment_rows(db: Session, date: Optional[str] = None):
    query = (
        db.query(DutyAssignment)
        .join(DutyAssignment.duty)
        .options(contains_eager(DutyAssignment.duty))
    )
    if date:
        query = query.filter(DutyAssignment.assignment_date == date)

    assignments = query.order_by(
        DutyAssignment.assignment_date.desc(),
        Duty.duty_name,
        DutyAssignment.start_time,
    ).all()

    rows = []
    prev_date = None
    prev_duty = None

    for item in assignments:
        duty_name = item.duty.duty_name

        if prev_date is not None and (item.assignment_date != prev_date or duty_name != prev_duty):
            rows.append({c: "" for c in COLUMNS})

        rows.append({
            "Date": item.assignment_date,
            "Duty": duty_name,
            "Duty Type": item.duty.duty_type,
            "Location": item.duty.location,
            "Officer": item.officer.name,
            "Belt Number": item.officer.belt_number,
            "Rank": item.officer.rank,
            "Station": item.officer.station,
            "Shift": item.shift_type.value,
            "Start": item.start_time,
            "End": item.end_time,
            "Hours": item.working_hours,
            "Duty End Date": item.duty.end_date,
        })

        prev_date = item.assignment_date
        prev_duty = duty_name

    return rows


@router.get("/roster.xlsx")
def roster_excel(date: Optional[str] = None, db: Session = Depends(get_db)):
    out = BytesIO()
    pd.DataFrame(assignment_rows(db, date)).to_excel(out, index=False)
    out.seek(0)
    return StreamingResponse(
        out,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=roster.xlsx"},
    )


@router.get("/roster.pdf")
def roster_pdf(date: Optional[str] = None, db: Session = Depends(get_db)):
    out = BytesIO()
    pdf = canvas.Canvas(out, pagesize=A4)
    width, height = A4
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, height - 40, "Police Duty Roster")
    y = height - 70
    pdf.setFont("Helvetica", 9)

    for row in assignment_rows(db, date):
        if not any(row.values()):
            pdf.setStrokeColorRGB(0.7, 0.7, 0.7)
            pdf.line(40, y + 8, width - 40, y + 8)
            pdf.setStrokeColorRGB(0, 0, 0)
            y -= 4
            continue

        line = f"{row['Date']} | {row['Shift']} | {row['Duty']} | {row['Officer']} ({row['Belt Number']}) | {row['Location']}"
        pdf.drawString(40, y, line[:120])
        y -= 16
        if y < 40:
            pdf.showPage()
            y = height - 40
            pdf.setFont("Helvetica", 9)
    pdf.save()
    out.seek(0)
    return StreamingResponse(out, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=roster.pdf"})
