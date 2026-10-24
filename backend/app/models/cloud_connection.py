import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class CloudConnection(Base):
    __tablename__ = "cloud_connections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # local_docker, aws, gcp, azure
    connection_name = Column(String(100), nullable=False)
    is_connected = Column(Boolean, default=True, nullable=False)
    region = Column(String(50), default="us-east-1", nullable=False)
    credentials_preview = Column(String(255), nullable=True)  # e.g. "AKIA****1234"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="cloud_connections")
