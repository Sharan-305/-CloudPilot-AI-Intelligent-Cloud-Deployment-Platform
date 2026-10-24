"""
API v1 Router Package.
Registers and aggregates all sub-module API endpoints.
"""
from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.projects import router as projects_router
from app.api.v1.cloud_connections import router as cloud_connections_router
from app.api.v1.audit import router as audit_router
from app.api.v1.deployments import router as deployments_router
from app.api.v1.services import router as services_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.anomalies import router as anomalies_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.costs import router as costs_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health & Diagnostics"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["User Management"])
api_router.include_router(projects_router, prefix="/projects", tags=["Projects & Repositories"])
api_router.include_router(deployments_router, prefix="/deployments", tags=["Deployments"])
api_router.include_router(services_router, prefix="/services", tags=["Services"])
api_router.include_router(metrics_router, prefix="/metrics", tags=["Telemetry & Metrics"])
api_router.include_router(anomalies_router, prefix="/anomalies", tags=["ML Anomalies"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["AI Recommendations"])
api_router.include_router(incidents_router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(costs_router, prefix="/costs", tags=["Cost Estimator"])
api_router.include_router(cloud_connections_router, prefix="/cloud-connections", tags=["Cloud Connections"])
api_router.include_router(audit_router, prefix="/audit-logs", tags=["Audit Logs"])

__all__ = ["api_router"]
