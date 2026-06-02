from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import analytics, audit, auth, duties, officers, reports, rosters, users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from .database import SessionLocal
    from .models import User, Role
    from passlib.context import CryptContext
    db = SessionLocal()
    try:
        if not db.query(User).first():
            pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
            db.add(User(name="Admin", email="admin@drms.local", password_hash=pwd.hash("admin"), role=Role.admin))
            db.commit()
    except Exception as exc:
        print(f"[init] {exc}")
    finally:
        db.close()
    yield


app = FastAPI(title="Police Duty Roster Management System", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=0,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(officers.router)
app.include_router(duties.router)
app.include_router(rosters.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(audit.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
