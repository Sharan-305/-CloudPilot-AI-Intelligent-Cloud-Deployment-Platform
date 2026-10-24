import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import inspect
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
import app.models  # Register all models
from app.main import app as fastapi_app


def test_phase1():
    print("=" * 60)
    print("CLOUDPILOT AI - PHASE 1 VERIFICATION SUITE")
    print("=" * 60)

    # 1. Verify Configuration
    print("\n[1] Verifying Configuration Settings...")
    assert settings.APP_NAME == "CloudPilot AI"
    assert settings.API_V1_STR == "/api/v1"
    print(f"  [OK] App Name: {settings.APP_NAME}")
    print(f"  [OK] Environment: {settings.ENVIRONMENT}")
    print(f"  [OK] Database URL: {settings.DATABASE_URL}")

    # 2. Verify Database Connection and Table Creation
    print("\n[2] Verifying Database Schema & Table Creation...")
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    
    expected_tables = {
        "users",
        "projects",
        "connected_repositories",
        "cloud_connections",
        "deployment_jobs",
        "deployment_logs",
        "services",
        "metric_samples",
        "anomaly_events",
        "recommendations",
        "incidents",
        "cost_estimates",
        "audit_logs"
    }

    print(f"  Detected tables in DB: {sorted(list(existing_tables))}")
    for table in expected_tables:
        assert table in existing_tables, f"Missing table: {table}"
        print(f"  [OK] Table verified: {table}")
    
    # 3. Test API Endpoints using TestClient
    print("\n[3] Testing API Endpoints via TestClient...")
    with TestClient(fastapi_app) as client:
        # Root endpoint
        root_res = client.get("/")
        assert root_res.status_code == 200, f"Root endpoint failed: {root_res.text}"
        root_data = root_res.json()
        print(f"  [OK] Root response: {root_data}")
        assert "Welcome to CloudPilot AI" in root_data["message"]

        # /health endpoint
        health_res = client.get("/health")
        assert health_res.status_code == 200, f"/health endpoint failed: {health_res.text}"
        health_data = health_res.json()
        print(f"  [OK] /health response: {health_data}")
        assert health_data["status"] == "healthy"
        assert health_data["database"]["status"] == "healthy"

        # /api/v1/health endpoint
        v1_health_res = client.get("/api/v1/health")
        assert v1_health_res.status_code == 200, f"/api/v1/health endpoint failed: {v1_health_res.text}"
        v1_data = v1_health_res.json()
        print(f"  [OK] /api/v1/health response: {v1_data}")
        assert v1_data["status"] == "healthy"
        assert v1_data["database"]["status"] == "healthy"

    print("\n" + "=" * 60)
    print("ALL PHASE 1 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_phase1()
