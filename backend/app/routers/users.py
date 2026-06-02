from __future__ import annotations

from fastapi import APIRouter, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.role, User.name).all()


@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=pwd_context.hash(payload.password),
        role=payload.role,
        station_scope=payload.station_scope,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
