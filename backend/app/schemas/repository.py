from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RepositoryConnect(BaseModel):
    repo_url: str = Field(..., example="https://github.com/cloudpilot/sample-node-app")
    branch: str = Field("main", example="main")
    auth_type: str = Field("none", example="none")  # none, token, ssh_key
    access_token: Optional[str] = Field(None, example="ghp_xxxxxxxxxxxx")


class RepositoryOut(BaseModel):
    id: str
    project_id: str
    repo_url: str
    branch: str
    auth_type: str
    is_connected: bool
    last_synced_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
