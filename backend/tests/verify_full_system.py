import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.database.base import Base
from app.database.session import engine
import app.models  # Register all 13 models
from app.main import app as fastapi_app


def test_full_system():
    print("=" * 70)
    print("CLOUDPILOT AI - FULL SYSTEM END-TO-END VALIDATION SUITE")
    print("=" * 70)

    # Initialize clean database schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    client = TestClient(fastapi_app)

    # 1. System Health Diagnostics
    print("\n[1] Testing System Health Diagnostics...")
    h_res = client.get("/health")
    assert h_res.status_code == 200
    h_data = h_res.json()
    assert h_data["status"] == "healthy"
    assert h_data["database"]["status"] == "healthy"
    print(f"  [OK] Platform Health: {h_data['status']}, Database: {h_data['database']['status']}")

    # 2. Authentication & RBAC
    print("\n[2] Testing Authentication & RBAC...")
    # Admin
    admin_reg = client.post("/api/v1/auth/register", json={
        "email": "admin@cloudpilot.ai",
        "password": "AdminPassword123!",
        "full_name": "Chief Architect",
        "role": "Admin"
    })
    assert admin_reg.status_code == 201
    admin_token = admin_reg.json()["access_token"]
    print("  [OK] Admin user registered and JWT issued")

    # Developer
    dev_reg = client.post("/api/v1/auth/register", json={
        "email": "dev@cloudpilot.ai",
        "password": "DevPassword123!",
        "full_name": "Senior DevOps",
        "role": "Developer"
    })
    assert dev_reg.status_code == 201
    dev_token = dev_reg.json()["access_token"]
    dev_headers = {"Authorization": f"Bearer {dev_token}"}
    print("  [OK] Developer user registered")

    # 3. Project Creation & Git Repo Connection
    print("\n[3] Testing Project Workspace & Repository Linking...")
    proj_res = client.post(
        "/api/v1/projects",
        headers=dev_headers,
        json={
            "name": "payment-api-gateway",
            "description": "Critical path checkout and payment transaction processor",
            "environment": "production",
            "repo_url": "https://github.com/cloudpilot/sample-node-app",
            "branch": "main"
        }
    )
    assert proj_res.status_code == 201, f"Project creation failed: {proj_res.text}"
    project = proj_res.json()
    project_id = project["id"]
    print(f"  [OK] Project created: ID={project_id}, Name={project['name']}")

    # 4. Trigger Deployment Pipeline
    print("\n[4] Testing Deployment Engine Pipeline (Clone -> Build -> Run -> Probe)...")
    dep_res = client.post(
        "/api/v1/deployments",
        headers=dev_headers,
        json={
            "project_id": project_id,
            "commit_hash": "a1b2c3d",
            "branch": "main",
            "port": 3000,
            "cpu_limit": 1.0,
            "memory_limit_mb": 512,
            "env_vars": {"NODE_ENV": "production", "PORT": "3000"}
        }
    )
    assert dep_res.status_code == 201, f"Deployment launch failed: {dep_res.text}"
    dep = dep_res.json()
    dep_id = dep["id"]
    assert dep["status"] == "succeeded"
    assert dep["duration_seconds"] is not None
    print(f"  [OK] Deployment {dep_id[:8]} completed in {dep['duration_seconds']}s with status '{dep['status']}'")

    # Verify logs
    logs_res = client.get(f"/api/v1/deployments/{dep_id}/logs", headers=dev_headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 5
    print(f"  [OK] Deployment generated {len(logs)} detailed log steps")

    # Verify Service Created
    services_res = client.get(f"/api/v1/services?project_id={project_id}", headers=dev_headers)
    assert services_res.status_code == 200
    services = services_res.json()
    assert len(services) > 0
    service = services[0]
    service_id = service["id"]
    assert service["status"] == "running"
    assert service["health_status"] == "healthy"
    print(f"  [OK] Service registered: ID={service_id}, URL={service['target_url']}, Health={service['health_status']}")

    # 5. Automated Rollback Verification
    print("\n[5] Testing Deployment Rollback Mechanism...")
    rollback_res = client.post(f"/api/v1/deployments/{dep_id}/rollback", headers=dev_headers)
    assert rollback_res.status_code == 200, f"Rollback failed: {rollback_res.text}"
    rollback_dep = rollback_res.json()
    assert rollback_dep["trigger_type"] == "rollback"
    assert rollback_dep["status"] == "succeeded"
    print(f"  [OK] Rollback deployment {rollback_dep['id'][:8]} executed successfully (Trigger: {rollback_dep['trigger_type']})")

    # 6. ML Telemetry Ingestion & Anomaly Detection (Isolation Forest)
    print("\n[6] Testing Telemetry Ingestion & Scikit-Learn Isolation Forest...")
    # Baseline normal telemetry samples
    for i in range(12):
        client.post(
            "/api/v1/metrics/samples",
            headers=dev_headers,
            json={
                "service_id": service_id,
                "cpu_percent": 24.0 + (i % 3),
                "memory_percent": 41.0,
                "response_time_ms": 45.0,
                "request_count": 120,
                "error_count": 0,
                "uptime_seconds": 1000 + i * 15
            }
        )

    # Ingest abnormal anomalous spike (CPU 96%, Latency 420ms, Error count 8)
    anomaly_spike_res = client.post(
        "/api/v1/metrics/samples",
        headers=dev_headers,
        json={
            "service_id": service_id,
            "cpu_percent": 96.5,
            "memory_percent": 88.0,
            "response_time_ms": 420.0,
            "request_count": 350,
            "error_count": 8,
            "uptime_seconds": 1200
        }
    )
    assert anomaly_spike_res.status_code == 201

    # Check that Isolation Forest flagged the anomaly
    anomalies_res = client.get("/api/v1/anomalies", headers=dev_headers)
    assert anomalies_res.status_code == 200
    anomalies = anomalies_res.json()
    assert len(anomalies) > 0
    top_anomaly = anomalies[0]
    print(f"  [OK] Isolation Forest flagged anomaly event: Score={top_anomaly['anomaly_score']}, Severity={top_anomaly['severity']}")
    print(f"       Diagnostic: {top_anomaly['description']}")

    # Check automated Incident was raised
    incidents_res = client.get("/api/v1/incidents", headers=dev_headers)
    assert incidents_res.status_code == 200
    incidents = incidents_res.json()
    assert len(incidents) > 0
    top_incident = incidents[0]
    print(f"  [OK] Incident auto-created: '{top_incident['title']}' (Severity: {top_incident['severity']})")

    # 7. AI Resource Optimization Recommendations
    print("\n[7] Testing AI Optimization Recommender Engine...")
    rec_res = client.post(f"/api/v1/recommendations/generate/{project_id}", headers=dev_headers)
    assert rec_res.status_code == 200
    recommendations = rec_res.json()
    assert len(recommendations) > 0
    rec = recommendations[0]
    print(f"  [OK] Recommendation generated: '{rec['title']}' (Savings: ${rec['estimated_savings_monthly']}/mo)")

    # Apply recommendation
    apply_res = client.post(f"/api/v1/recommendations/{rec['id']}/apply", headers=dev_headers)
    assert apply_res.status_code == 200
    assert apply_res.json()["is_applied"] is True
    print("  [OK] Recommendation marked applied")

    # 8. Cloud Cost Estimator API
    print("\n[8] Testing Cloud Cost Estimator...")
    cost_res = client.post(
        "/api/v1/costs",
        headers=dev_headers,
        json={
            "project_id": project_id,
            "cloud_provider": "aws",
            "monthly_cost": 64.80,
            "breakdown_json": '{"compute": 48.30, "alb": 16.50}'
        }
    )
    assert cost_res.status_code == 200
    print(f"  [OK] Cost snapshot recorded: ${cost_res.json()['monthly_cost']}/month for {cost_res.json()['cloud_provider']}")

    # 9. Audit Logs Verification
    print("\n[9] Testing Security Audit Trail...")
    audit_res = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    actions = [a["action"] for a in audit_logs]
    print(f"  [OK] Total recorded audit entries: {len(audit_logs)}")
    assert "user_registered" in actions
    assert "project_created" in actions
    assert "deployment_succeeded" in actions

    print("\n" + "=" * 70)
    print("FULL CLOUDPILOT AI SYSTEM VALIDATION PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    test_full_system()
