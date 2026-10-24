import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


class CostEstimate(Base):
    __tablename__ = "cost_estimates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    cloud_provider = Column(String(50), default="aws", nullable=False)  # aws, docker_local, gcp, azure
    monthly_cost = Column(Float, default=0.0, nullable=False)
    breakdown_json = Column(Text, nullable=False)  # JSON formatted cost details
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="cost_estimates")
