from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.metric import AnomalyEvent
from app.schemas.analytics import AnomalyEventOut
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[AnomalyEventOut])
def list_anomalies(
    service_id: str = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Retrieve detected ML anomalies."""
    query = db.query(AnomalyEvent)
    if service_id:
        query = query.filter(AnomalyEvent.service_id == service_id)
    return query.order_by(AnomalyEvent.timestamp.desc()).limit(100).all()


@router.post("/{anomaly_id}/acknowledge", response_model=AnomalyEventOut)
def acknowledge_anomaly(
    anomaly_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Acknowledge an anomaly event."""
    anomaly = db.query(AnomalyEvent).filter(AnomalyEvent.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomaly event not found")
    anomaly.status = "acknowledged"
    db.commit()
    db.refresh(anomaly)
    return anomaly


@router.post("/{anomaly_id}/resolve", response_model=AnomalyEventOut)
def resolve_anomaly(
    anomaly_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Mark an anomaly event as resolved."""
    anomaly = db.query(AnomalyEvent).filter(AnomalyEvent.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomaly event not found")
    anomaly.status = "resolved"
    db.commit()
    db.refresh(anomaly)
    return anomaly
