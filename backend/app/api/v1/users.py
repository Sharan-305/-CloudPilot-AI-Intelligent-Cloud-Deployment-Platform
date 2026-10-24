from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.core.security import hash_password
from app.api.deps import get_current_user, get_current_active_admin, log_audit_event

router = APIRouter()


@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin)
) -> Any:
    """List all registered users (Admin only)."""
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve user by ID (Self or Admin)."""
    if current_user.id != user_id and current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user profile"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update user information."""
    if current_user.id != user_id and current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this user"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.password:
        user.hashed_password = hash_password(user_in.password)
    
    # Role or status changes require Admin rights
    if user_in.role is not None:
        if current_user.role != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can change user roles"
            )
        user.role = user_in.role

    if user_in.is_active is not None:
        if current_user.role != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can modify account active status"
            )
        user.is_active = user_in.is_active

    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="user_updated",
        resource_type="user",
        resource_id=user.id,
        details={"updated_fields": user_in.model_dump(exclude_unset=True, exclude={"password"})}
    )

    return user
