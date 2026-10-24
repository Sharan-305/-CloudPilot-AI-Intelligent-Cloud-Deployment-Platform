from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class DeploymentCreate(BaseModel):
    project_id: str
    commit_hash: Optional[str] = "HEAD"
    branch: Optional[str] = "main"
    port: Optional[int] = 3000
    cpu_limit: Optional[float] = 0.5
    memory_limit_mb: Optional[int] = 512
    env_vars: Optional[Dict[str, str]] = None


class DeploymentLogOut(BaseModel):
    id: str
    deployment_id: str
    timestamp: datetime
    level: str
    message: str
    step: str

    class Config:
        from_attributes = True


class DeploymentJobOut(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    commit_hash: str
    branch: str
    status: str
    trigger_type: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    rollback_from_id: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceOut(BaseModel):
    id: str
    project_id: str
    deployment_id: Optional[str] = None
    container_id: Optional[str] = None
    service_name: str
    port: Optional[int] = None
    status: str
    health_status: str
    target_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
