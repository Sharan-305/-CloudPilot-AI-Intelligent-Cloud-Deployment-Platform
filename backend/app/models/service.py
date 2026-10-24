import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin


class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    deployment_id = Column(String(36), ForeignKey("deployment_jobs.id", ondelete="SET NULL"), nullable=True)
    container_id = Column(String(100), nullable=True)
    service_name = Column(String(100), nullable=False)
    port = Column(Integer, nullable=True)
    status = Column(String(50), default="stopped", nullable=False)  # running, stopped, restarting, degraded
    health_status = Column(String(50), default="unknown", nullable=False)  # healthy, degraded, unhealthy, unknown
    target_url = Column(String(255), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="services")
    deployment = relationship("DeploymentJob", back_populates="services")
    metric_samples = relationship("MetricSample", back_populates="service", cascade="all, delete-orphan", order_by="MetricSample.timestamp.desc()")
    anomalies = relationship("AnomalyEvent", back_populates="service", cascade="all, delete-orphan", order_by="AnomalyEvent.timestamp.desc()")
    incidents = relationship("Incident", back_populates="service", cascade="all, delete-orphan")
