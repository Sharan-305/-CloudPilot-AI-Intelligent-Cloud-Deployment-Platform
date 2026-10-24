from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.repository import ConnectedRepository
from app.models.service import Service
from app.models.deployment import DeploymentJob
from app.models.incident import Incident
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectDetailOut
from app.schemas.repository import RepositoryConnect, RepositoryOut
from app.api.deps import get_current_user, log_audit_event

router = APIRouter()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new deployment project and optionally attach a Git repository."""
    if current_user.role == "Viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot create projects"
        )
    
    # Check duplicate name for this user
    existing = db.query(Project).filter(
        Project.user_id == current_user.id,
        Project.name == project_in.name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A project named '{project_in.name}' already exists in your account"
        )
    
    project = Project(
        name=project_in.name,
        description=project_in.description,
        environment=project_in.environment,
        user_id=current_user.id
    )
    db.add(project)
    db.flush()  # assign project.id

    if project_in.repo_url:
        repo = ConnectedRepository(
            project_id=project.id,
            repo_url=project_in.repo_url,
            branch=project_in.branch or "main",
            auth_type="none",
            is_connected=True,
            last_synced_at=datetime.utcnow()
        )
        db.add(repo)
    
    db.commit()
    db.refresh(project)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="project_created",
        resource_type="project",
        resource_id=project.id,
        details={"name": project.name, "environment": project.environment}
    )

    return project


@router.get("", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List all projects accessible to the current user (Admins can view all)."""
    if current_user.role == "Admin":
        return db.query(Project).order_by(Project.created_at.desc()).all()
    return db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()


@router.get("/{project_id}", response_model=ProjectDetailOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve detailed project configuration, attached repo, and service/deployment counts."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if current_user.role != "Admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    services_count = db.query(Service).filter(Service.project_id == project_id).count()
    deployments_count = db.query(DeploymentJob).filter(DeploymentJob.project_id == project_id).count()
    active_incidents = db.query(Incident).filter(
        Incident.project_id == project_id,
        Incident.status != "resolved"
    ).count()

    return ProjectDetailOut(
        id=project.id,
        name=project.name,
        description=project.description,
        environment=project.environment,
        user_id=project.user_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        repository=project.repository,
        services_count=services_count,
        deployments_count=deployments_count,
        active_incidents_count=active_incidents
    )


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update project metadata."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot edit projects")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if current_user.role != "Admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.environment is not None:
        project.environment = project_in.environment

    db.commit()
    db.refresh(project)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="project_updated",
        resource_type="project",
        resource_id=project.id,
        details={"name": project.name}
    )

    return project


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a project and its associated services, deployments, and logs."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot delete projects")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if current_user.role != "Admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    name = project.name
    db.delete(project)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="project_deleted",
        resource_type="project",
        resource_id=project_id,
        details={"name": name}
    )

    return {"message": f"Project '{name}' successfully deleted"}


@router.post("/{project_id}/repository", response_model=RepositoryOut)
def connect_repository(
    project_id: str,
    repo_in: RepositoryConnect,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Connect or update the Git repository linked to this project."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot modify repositories")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if current_user.role != "Admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    repo = db.query(ConnectedRepository).filter(ConnectedRepository.project_id == project_id).first()
    if repo:
        repo.repo_url = repo_in.repo_url
        repo.branch = repo_in.branch
        repo.auth_type = repo_in.auth_type
        repo.is_connected = True
        repo.last_synced_at = datetime.utcnow()
    else:
        repo = ConnectedRepository(
            project_id=project_id,
            repo_url=repo_in.repo_url,
            branch=repo_in.branch,
            auth_type=repo_in.auth_type,
            is_connected=True,
            last_synced_at=datetime.utcnow()
        )
        db.add(repo)
    
    db.commit()
    db.refresh(repo)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="repository_connected",
        resource_type="repository",
        resource_id=repo.id,
        details={"repo_url": repo.repo_url, "branch": repo.branch}
    )

    return repo


@router.delete("/{project_id}/repository")
def disconnect_repository(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Disconnect the Git repository from this project."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot modify repositories")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if current_user.role != "Admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    repo = db.query(ConnectedRepository).filter(ConnectedRepository.project_id == project_id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No repository attached")

    db.delete(repo)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="repository_disconnected",
        resource_type="repository",
        resource_id=project_id
    )

    return {"message": "Repository successfully disconnected"}
