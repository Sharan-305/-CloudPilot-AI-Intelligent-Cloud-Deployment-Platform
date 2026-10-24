from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogOut
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve audit history. Admins can view all logs; others see their own actions."""
    query = db.query(AuditLog)
    if current_user.role != "Admin":
        query = query.filter(AuditLog.user_id == current_user.id)
    return query.order_by(AuditLog.created_at.desc()).limit(100).all()
