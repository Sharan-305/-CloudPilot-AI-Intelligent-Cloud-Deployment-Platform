from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.service import Service
from app.models.project import Project
from app.schemas.deployment import ServiceOut
from app.api.deps import get_current_user, log_audit_event

router = APIRouter()


@router.get("", response_model=List[ServiceOut])
def list_services(
    project_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List running or deployed services."""
    query = db.query(Service).join(Project)
    if current_user.role != "Admin":
        query = query.filter(Project.user_id == current_user.id)
    if project_id:
        query = query.filter(Service.project_id == project_id)
    return query.all()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get service status and network endpoint."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    if current_user.role != "Admin" and service.project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return service


@router.post("/{service_id}/restart", response_model=ServiceOut)
def restart_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Restart a running container service."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot restart services")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    if current_user.role != "Admin" and service.project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service.status = "running"
    service.health_status = "healthy"
    db.commit()
    db.refresh(service)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="service_restarted",
        resource_type="service",
        resource_id=service.id,
        details={"service_name": service.service_name}
    )

    return service


@router.post("/{service_id}/stop", response_model=ServiceOut)
def stop_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Stop a container service."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot stop services")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    if current_user.role != "Admin" and service.project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service.status = "stopped"
    service.health_status = "unknown"
    db.commit()
    db.refresh(service)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="service_stopped",
        resource_type="service",
        resource_id=service.id,
        details={"service_name": service.service_name}
    )

    return service
