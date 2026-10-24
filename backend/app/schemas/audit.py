from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
