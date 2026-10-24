import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


class MetricSample(Base):
    __tablename__ = "metric_samples"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id = Column(String(36), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    cpu_percent = Column(Float, default=0.0, nullable=False)
    memory_percent = Column(Float, default=0.0, nullable=False)
    response_time_ms = Column(Float, default=0.0, nullable=False)
    request_count = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    uptime_seconds = Column(Float, default=0.0, nullable=False)

    # Relationships
    service = relationship("Service", back_populates="metric_samples")


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id = Column(String(36), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)  # cpu, memory, response_time, error_rate
    metric_value = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)  # e.g. -0.45 or normalized deviation
    severity = Column(String(50), default="low", nullable=False)  # low, medium, high, critical
    description = Column(Text, nullable=False)
    status = Column(String(50), default="open", nullable=False)  # open, acknowledged, resolved

    # Relationships
    service = relationship("Service", back_populates="anomalies")
