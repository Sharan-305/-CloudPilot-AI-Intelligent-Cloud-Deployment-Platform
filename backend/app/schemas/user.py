from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    email: str = Field(..., example="developer@cloudpilot.ai")
    full_name: Optional[str] = Field(None, example="Alex Rivera")
    role: Optional[str] = Field("Developer", example="Developer")  # Admin, Developer, Viewer


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, example="SecurePassword123!")


class UserLogin(BaseModel):
    email: str = Field(..., example="developer@cloudpilot.ai")
    password: str = Field(..., example="SecurePassword123!")


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
