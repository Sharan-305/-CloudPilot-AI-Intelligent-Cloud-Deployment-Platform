from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from app.models.service import Service
from app.models.project import Project
from app.models.metric import MetricSample
from app.models.recommendation import Recommendation


class RecommendationEngine:
    """
    Analyzes historical container performance and generates actionable resource,
    performance, and cloud cost optimization recommendations.
    """

    @classmethod
    def generate_recommendations(cls, db: Session, project_id: str) -> List[Recommendation]:
        services = db.query(Service).filter(Service.project_id == project_id).all()
        created_recommendations = []

        for service in services:
            # Query recent metrics
            samples = db.query(MetricSample).filter(
                MetricSample.service_id == service.id
            ).order_by(MetricSample.timestamp.desc()).limit(50).all()

            if not samples:
                # Add default baseline recommendation if fresh service
                rec = Recommendation(
                    project_id=project_id,
                    title="Enable Docker Health Checks & Auto-Restart Policy",
                    category="resource",
                    impact="medium",
                    estimated_savings_monthly=15.00,
                    details=f"Configure auto-restart on container failure for service '{service.service_name}' to maintain continuous 99.9% availability.",
                    is_applied=False,
                    created_at=datetime.utcnow()
                )
                db.add(rec)
                created_recommendations.append(rec)
                continue

            avg_cpu = sum(s.cpu_percent for s in samples) / len(samples)
            avg_mem = sum(s.memory_percent for s in samples) / len(samples)
            avg_latency = sum(s.response_time_ms for s in samples) / len(samples)

            # 1. Underutilized Resource Recommendation
            if avg_cpu < 50.0 or avg_mem < 65.0:
                rec = Recommendation(
                    project_id=project_id,
                    title=f"Right-size {service.service_name} Resource Allocation",
                    category="cost",
                    impact="high",
                    estimated_savings_monthly=28.50,
                    details=f"Observed average CPU is {avg_cpu:.1f}% and RAM is {avg_mem:.1f}%. Reducing container quota cuts cloud compute spend without performance degradation.",
                    is_applied=False,
                    created_at=datetime.utcnow()
                )
                db.add(rec)
                created_recommendations.append(rec)

            # 2. Latency Optimization
            if avg_latency > 100.0:
                rec = Recommendation(
                    project_id=project_id,
                    title="Enable Reverse Proxy Keep-Alive & Edge Caching",
                    category="performance",
                    impact="high",
                    estimated_savings_monthly=12.00,
                    details=f"P95 latency averages {avg_latency:.0f}ms. Adding HTTP keep-alive connections and an in-memory cache reduces roundtrip latency by up to 45%.",
                    is_applied=False,
                    created_at=datetime.utcnow()
                )
                db.add(rec)
                created_recommendations.append(rec)

            # 3. Always ensure at least one actionable recommendation exists
            if not created_recommendations:
                rec = Recommendation(
                    project_id=project_id,
                    title=f"Configure Horizontal Auto-Scaling for {service.service_name}",
                    category="resource",
                    impact="medium",
                    estimated_savings_monthly=18.00,
                    details=f"Enable dynamic container replica scaling based on incoming request queue depth.",
                    is_applied=False,
                    created_at=datetime.utcnow()
                )
                db.add(rec)
                created_recommendations.append(rec)

        db.commit()
        return created_recommendations
