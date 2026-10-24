from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.api.deps import get_current_user, log_audit_event

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user account and return an authentication token.
    The first registered user is automatically granted Admin role; subsequent users receive the specified role.
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    # Auto-assign Admin role to the very first user in the database
    user_count = db.query(User).count()
    assigned_role = "Admin" if user_count == 0 else (user_in.role or "Developer")

    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=assigned_role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Record Audit Log
    log_audit_event(
        db=db,
        user_id=new_user.id,
        action="user_registered",
        resource_type="user",
        resource_id=new_user.id,
        details={"email": new_user.email, "role": new_user.role}
    )

    access_token = create_access_token(subject=new_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/login", response_model=Token)
def login_json(credentials: UserLogin, db: Session = Depends(get_db)) -> Any:
    """
    Authenticate user using JSON payload (email & password) and return JWT access token.
    """
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    log_audit_event(
        db=db,
        user_id=user.id,
        action="user_logged_in",
        resource_type="user",
        resource_id=user.id,
        details={"email": user.email}
    )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Any:
    """
    OAuth2 standard password request form endpoint for Swagger UI documentation authorization.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> Any:
    """
    Retrieve profile details of currently authenticated user.
    """
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Any:
    """
    Log out the current user session and record audit trail.
    """
    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="user_logged_out",
        resource_type="user",
        resource_id=current_user.id
    )
    return {"message": "Successfully logged out"}
