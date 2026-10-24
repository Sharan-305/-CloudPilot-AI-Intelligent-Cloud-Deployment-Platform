from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.incident import Incident
from app.schemas.analytics import IncidentOut, IncidentUpdate
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[IncidentOut])
def list_incidents(
    project_id: str = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """List recorded outage and performance incidents."""
    query = db.query(Incident)
    if project_id:
        query = query.filter(Incident.project_id == project_id)
    return query.order_by(Incident.created_at.desc()).all()


@router.put("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: str,
    inc_in: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    """Update incident status or triage resolution."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    if inc_in.status:
        incident.status = inc_in.status
        if inc_in.status == "resolved" and not incident.resolved_at:
            incident.resolved_at = datetime.utcnow()
    if inc_in.root_cause:
        incident.root_cause = inc_in.root_cause

    db.commit()
    db.refresh(incident)
    return incident
