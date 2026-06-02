from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from ..models import AuditLog


def audit(db: Session, action: str, entity_type: str, entity_id: Optional[int], details: str = "", actor_id: Optional[int] = None):
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    return entry
