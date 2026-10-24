from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.cloud_connection import CloudConnection
from app.schemas.cloud_connection import CloudConnectionCreate, CloudConnectionOut
from app.api.deps import get_current_user, log_audit_event

router = APIRouter()


@router.post("", response_model=CloudConnectionOut, status_code=status.HTTP_201_CREATED)
def create_cloud_connection(
    conn_in: CloudConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Register a new cloud provider connection or Docker host."""
    # Mask credentials for display
    preview = None
    if conn_in.access_key:
        if len(conn_in.access_key) > 6:
            preview = f"{conn_in.access_key[:4]}****{conn_in.access_key[-2:]}"
        else:
            preview = "****"
    elif conn_in.provider == "local_docker":
        preview = "unix:///var/run/docker.sock"

    connection = CloudConnection(
        user_id=current_user.id,
        provider=conn_in.provider,
        connection_name=conn_in.connection_name,
        region=conn_in.region,
        credentials_preview=preview,
        is_connected=True
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="cloud_connection_created",
        resource_type="cloud_connection",
        resource_id=connection.id,
        details={"provider": connection.provider, "name": connection.connection_name}
    )

    return connection


@router.get("", response_model=List[CloudConnectionOut])
def list_cloud_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List all configured cloud connections for the current user."""
    return db.query(CloudConnection).filter(CloudConnection.user_id == current_user.id).all()


@router.delete("/{connection_id}")
def delete_cloud_connection(
    connection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a cloud connection."""
    conn = db.query(CloudConnection).filter(CloudConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cloud connection not found")
    if current_user.role != "Admin" and conn.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(conn)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="cloud_connection_deleted",
        resource_type="cloud_connection",
        resource_id=connection_id
    )

    return {"message": "Cloud connection successfully removed"}
