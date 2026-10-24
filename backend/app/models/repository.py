import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class ConnectedRepository(Base):
    __tablename__ = "connected_repositories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    repo_url = Column(String(500), nullable=False)
    branch = Column(String(100), default="main", nullable=False)
    auth_type = Column(String(50), default="none", nullable=False)  # none, token, ssh_key
    is_connected = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="repository")
