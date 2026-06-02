"""
Creates all database tables.
Run via:  cd backend && python -m app.seed
"""
from .database import Base, engine


def run() -> None:
    Base.metadata.create_all(bind=engine)
    print("[seed] All tables created.")


if __name__ == "__main__":
    run()
