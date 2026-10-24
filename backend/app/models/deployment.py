import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class DeploymentJob(Base):
    __tablename__ = "deployment_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    commit_hash = Column(String(40), default="HEAD", nullable=False)
    branch = Column(String(100), default="main", nullable=False)
    status = Column(String(50), default="queued", nullable=False)  # queued, cloning, building, running, succeeded, failed, rolled_back
    trigger_type = Column(String(50), default="manual", nullable=False)  # manual, webhook, rollback
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    rollback_from_id = Column(String(36), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="deployments")
    logs = relationship("DeploymentLog", back_populates="deployment", cascade="all, delete-orphan", order_by="DeploymentLog.timestamp")
    services = relationship("Service", back_populates="deployment")


class DeploymentLog(Base):
    __tablename__ = "deployment_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    deployment_id = Column(String(36), ForeignKey("deployment_jobs.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    level = Column(String(20), default="INFO", nullable=False)  # INFO, WARNING, ERROR, SUCCESS
    message = Column(Text, nullable=False)
    step = Column(String(50), default="pipeline", nullable=False)  # clone, build, run, healthcheck, complete

    # Relationships
    deployment = relationship("DeploymentJob", back_populates="logs")
