import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String(50), default="development", nullable=False)  # development, staging, production

    # Relationships
    user = relationship("User", back_populates="projects")
    repository = relationship("ConnectedRepository", back_populates="project", uselist=False, cascade="all, delete-orphan")
    deployments = relationship("DeploymentJob", back_populates="project", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="project", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="project", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="project", cascade="all, delete-orphan")
    cost_estimates = relationship("CostEstimate", back_populates="project", cascade="all, delete-orphan")
