"""Import 425 officers from CSV into the backend database."""

import csv
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text

from app.database import SessionLocal, engine, Base
from app.models import Officer


CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "officers.csv")


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # wipe existing
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(text(f"DELETE FROM {table.name}"))

        belt_counts: dict[str, int] = {}

        with open(CSV_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            officers = []
            for row in reader:
                nature = (row.get("Nature of duty") or "").strip()
                belt = row["G.No"].strip()
                if not belt or belt == "-":
                    belt = f"unknown-{row['S.No.'].strip()}"
                else:
                    count = belt_counts.get(belt, 0)
                    belt_counts[belt] = count + 1
                    if count > 0:
                        belt = f"{belt}-{count}"

                officers.append(Officer(
                    name=row["Name"].strip(),
                    belt_number=belt,
                    rank=row["Rank"].strip(),
                    station=nature if nature else "General",
                    mobile_number=(row.get("Cell No.") or "").strip() or None,
                    gender=None,
                    department_unit=nature or None,
                    joining_date=None,
                    availability_status="Available",
                    is_active=True,
                ))

            db.add_all(officers)
            db.commit()

        print(f"Imported {len(officers)} officers from CSV.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
