from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.service import Service
from app.models.metric import MetricSample
from app.schemas.analytics import MetricSampleCreate, MetricSampleOut
from app.ml.detector import detector
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/samples", response_model=MetricSampleOut, status_code=status.HTTP_201_CREATED)
def record_metric_sample(
    sample_in: MetricSampleCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """
    Ingest a new telemetry sample for a service.
    Evaluates against Isolation Forest anomaly detection engine automatically.
    """
    service = db.query(Service).filter(Service.id == sample_in.service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    sample = MetricSample(
        service_id=service.id,
        timestamp=datetime.utcnow(),
        cpu_percent=sample_in.cpu_percent,
        memory_percent=sample_in.memory_percent,
        response_time_ms=sample_in.response_time_ms,
        request_count=sample_in.request_count,
        error_count=sample_in.error_count,
        uptime_seconds=sample_in.uptime_seconds
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)

    # ML Anomaly Detection Evaluation
    detector.evaluate_sample(db=db, service=service, sample=sample)

    return sample


@router.get("/samples", response_model=List[MetricSampleOut])
def get_service_metrics(
    service_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Retrieve historical telemetry samples for a given service."""
    return db.query(MetricSample).filter(
        MetricSample.service_id == service_id
    ).order_by(MetricSample.timestamp.desc()).limit(limit).all()
