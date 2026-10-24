from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.repository import RepositoryOut


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="e-commerce-api")
    description: Optional[str] = Field(None, example="Microservice backend for product catalog")
    environment: str = Field("development", example="development")  # development, staging, production


class ProjectCreate(ProjectBase):
    repo_url: Optional[str] = Field(None, example="https://github.com/cloudpilot/sample-node-app")
    branch: Optional[str] = Field("main", example="main")


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    environment: Optional[str] = None


class ProjectOut(ProjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    repository: Optional[RepositoryOut] = None

    class Config:
        from_attributes = True


class ProjectDetailOut(ProjectOut):
    services_count: int = 0
    deployments_count: int = 0
    active_incidents_count: int = 0
