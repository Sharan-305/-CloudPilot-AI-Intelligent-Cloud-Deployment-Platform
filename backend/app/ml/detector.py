import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.models.metric import MetricSample, AnomalyEvent
from app.models.incident import Incident
from app.models.service import Service


class AnomalyDetector:
    """
    Real machine learning anomaly detection engine using Scikit-Learn Isolation Forest.
    Analyzes multi-dimensional container telemetry:
    [cpu_percent, memory_percent, response_time_ms, error_count].
    """

    def __init__(self, contamination: float = 0.05):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.is_fitted = False

    def train_or_baseline(self, historical_samples: List[MetricSample]):
        """Fit Isolation Forest on historical baseline metric samples."""
        if len(historical_samples) < 10:
            # Generate synthetic baseline around typical steady operating point
            # [cpu ~25%, mem ~40%, latency ~45ms, errors ~0]
            synthetic = np.array([
                [
                    np.random.normal(25, 5),
                    np.random.normal(40, 4),
                    np.random.normal(45, 8),
                    0 if np.random.random() > 0.02 else 1
                ]
                for _ in range(60)
            ])
            self.model.fit(synthetic)
        else:
            X = np.array([
                [s.cpu_percent, s.memory_percent, s.response_time_ms, s.error_count]
                for s in historical_samples
            ])
            self.model.fit(X)

        self.is_fitted = True

    def evaluate_sample(
        self,
        db: Session,
        service: Service,
        sample: MetricSample
    ) -> Optional[AnomalyEvent]:
        """
        Evaluate a single incoming metric sample against the trained model.
        If flagged as anomalous, records an AnomalyEvent and raises an Incident if severe.
        """
        if not self.is_fitted:
            # Fetch past samples for this service to train
            history = db.query(MetricSample).filter(
                MetricSample.service_id == service.id
            ).order_by(MetricSample.timestamp.desc()).limit(100).all()
            self.train_or_baseline(history)

        features = np.array([[
            sample.cpu_percent,
            sample.memory_percent,
            sample.response_time_ms,
            sample.error_count
        ]])

        prediction = self.model.predict(features)[0]  # -1 for anomaly, 1 for inlier
        decision_score = float(self.model.decision_function(features)[0])

        # Anomaly detected when prediction == -1 or score is sufficiently negative
        if prediction == -1 or decision_score < -0.15 or sample.cpu_percent > 85 or sample.error_count > 5:
            # Determine metric driving the anomaly and severity
            primary_metric = "cpu"
            severity = "low"
            explanations = []

            if sample.cpu_percent > 85:
                primary_metric = "cpu_percent"
                severity = "critical" if sample.cpu_percent > 92 else "high"
                explanations.append(f"CPU utilization spiked to {sample.cpu_percent:.1f}%")

            if sample.memory_percent > 85:
                primary_metric = "memory_percent"
                severity = "critical"
                explanations.append(f"Memory exhaustion threshold reached ({sample.memory_percent:.1f}%)")

            if sample.response_time_ms > 300:
                if severity not in ["critical", "high"]:
                    primary_metric = "response_time_ms"
                    severity = "high"
                explanations.append(f"Response latency degraded to {sample.response_time_ms:.0f}ms")

            if sample.error_count > 0:
                primary_metric = "error_count"
                severity = "critical" if sample.error_count >= 5 else "high"
                explanations.append(f"Elevated 5xx HTTP error count: {sample.error_count} errors/min")

            if not explanations:
                explanations.append("Multi-dimensional multivariate deviation detected by Isolation Forest")
                severity = "medium"

            description = " | ".join(explanations)

            anomaly_event = AnomalyEvent(
                service_id=service.id,
                timestamp=datetime.utcnow(),
                metric_name=primary_metric,
                metric_value=float(getattr(sample, primary_metric, sample.cpu_percent)),
                anomaly_score=round(decision_score, 4),
                severity=severity,
                description=description,
                status="open"
            )
            db.add(anomaly_event)

            # Auto-create incident if high or critical
            if severity in ["high", "critical"]:
                incident = Incident(
                    project_id=service.project_id,
                    service_id=service.id,
                    title=f"Automated Alert: {description}",
                    severity=severity,
                    status="open",
                    root_cause=f"Isolation Forest identified abnormal telemetry signature (Score: {decision_score:.3f}). Primary deviation: {primary_metric}."
                )
                db.add(incident)

            db.commit()
            db.refresh(anomaly_event)
            return anomaly_event

        return None


# Global singleton detector
detector = AnomalyDetector()
