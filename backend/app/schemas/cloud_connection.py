from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CloudConnectionCreate(BaseModel):
    provider: str = Field(..., example="local_docker")  # local_docker, aws, gcp, azure
    connection_name: str = Field(..., example="Local Docker Daemon")
    region: str = Field("us-east-1", example="us-east-1")
    access_key: Optional[str] = Field(None, example="AKIAIOSFODNN7EXAMPLE")
    secret_key: Optional[str] = Field(None, example="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")


class CloudConnectionOut(BaseModel):
    id: str
    user_id: str
    provider: str
    connection_name: str
    is_connected: bool
    region: str
    credentials_preview: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
