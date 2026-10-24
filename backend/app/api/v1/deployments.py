from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.deployment import DeploymentJob, DeploymentLog
from app.schemas.deployment import DeploymentCreate, DeploymentJobOut, DeploymentLogOut
from app.deployment.engine import DeploymentEngine
from app.api.deps import get_current_user

router = APIRouter()


@router.post("", response_model=DeploymentJobOut, status_code=status.HTTP_201_CREATED)
def trigger_deployment(
    dep_in: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Initiate a deployment build pipeline for a project."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot trigger deployments")

    project = db.query(Project).filter(Project.id == dep_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target project not found")
    if current_user.role != "Admin" and project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Create job in database
    job = DeploymentJob(
        project_id=project.id,
        commit_hash=dep_in.commit_hash or "HEAD",
        branch=dep_in.branch or "main",
        status="queued",
        trigger_type="manual"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Execute pipeline
    executed_job = DeploymentEngine.execute_deployment(
        deployment_id=job.id,
        db=db,
        port=dep_in.port or 3000,
        cpu_limit=dep_in.cpu_limit or 0.5,
        memory_limit_mb=dep_in.memory_limit_mb or 512,
        env_vars=dep_in.env_vars
    )

    # Enrich with project_name
    job_dict = DeploymentJobOut.model_validate(executed_job).model_dump()
    job_dict["project_name"] = project.name
    return job_dict


@router.get("", response_model=List[DeploymentJobOut])
def list_deployments(
    project_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List deployment history."""
    query = db.query(DeploymentJob).join(Project)
    if current_user.role != "Admin":
        query = query.filter(Project.user_id == current_user.id)
    if project_id:
        query = query.filter(DeploymentJob.project_id == project_id)

    jobs = query.order_by(DeploymentJob.started_at.desc()).limit(50).all()
    results = []
    for j in jobs:
        d = DeploymentJobOut.model_validate(j).model_dump()
        d["project_name"] = j.project.name if j.project else "App"
        results.append(d)
    return results


@router.get("/{deployment_id}", response_model=DeploymentJobOut)
def get_deployment(
    deployment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve status details for a deployment."""
    job = db.query(DeploymentJob).filter(DeploymentJob.id == deployment_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    if current_user.role != "Admin" and job.project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    d = DeploymentJobOut.model_validate(job).model_dump()
    d["project_name"] = job.project.name if job.project else "App"
    return d


@router.get("/{deployment_id}/logs", response_model=List[DeploymentLogOut])
def get_deployment_logs(
    deployment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve live or historical logs for a deployment."""
    job = db.query(DeploymentJob).filter(DeploymentJob.id == deployment_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    if current_user.role != "Admin" and job.project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return db.query(DeploymentLog).filter(DeploymentLog.deployment_id == deployment_id).order_by(DeploymentLog.timestamp.asc()).all()


@router.post("/{deployment_id}/rollback", response_model=DeploymentJobOut)
def rollback_deployment(
    deployment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Execute an automated rollback to a previous working deployment."""
    if current_user.role == "Viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot trigger rollbacks")

    job = db.query(DeploymentJob).filter(DeploymentJob.id == deployment_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    if current_user.role != "Admin" and job.project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    rollback_job = DeploymentEngine.rollback(deployment_id, db)
    d = DeploymentJobOut.model_validate(rollback_job).model_dump()
    d["project_name"] = job.project.name if job.project else "App"
    return d
