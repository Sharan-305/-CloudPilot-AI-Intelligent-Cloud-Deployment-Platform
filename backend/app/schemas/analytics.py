from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class MetricSampleCreate(BaseModel):
    service_id: str
    cpu_percent: float = Field(..., ge=0, le=100)
    memory_percent: float = Field(..., ge=0, le=100)
    response_time_ms: float = Field(..., ge=0)
    request_count: int = Field(0, ge=0)
    error_count: int = Field(0, ge=0)
    uptime_seconds: float = Field(0, ge=0)


class MetricSampleOut(BaseModel):
    id: str
    service_id: str
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    response_time_ms: float
    request_count: int
    error_count: int
    uptime_seconds: float

    class Config:
        from_attributes = True


class AnomalyEventOut(BaseModel):
    id: str
    service_id: str
    timestamp: datetime
    metric_name: str
    metric_value: float
    anomaly_score: float
    severity: str
    description: str
    status: str

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: str
    project_id: str
    title: str
    category: str
    impact: str
    estimated_savings_monthly: float
    details: str
    is_applied: bool
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentOut(BaseModel):
    id: str
    project_id: str
    service_id: str
    title: str
    severity: str
    status: str
    root_cause: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    root_cause: Optional[str] = None
    resolved_at: Optional[datetime] = None


class CostEstimateCreate(BaseModel):
    project_id: Optional[str] = None
    cloud_provider: str = "aws"
    monthly_cost: float
    breakdown_json: str


class CostEstimateOut(BaseModel):
    id: str
    project_id: Optional[str] = None
    cloud_provider: str
    monthly_cost: float
    breakdown_json: str
    created_at: datetime

    class Config:
        from_attributes = True
