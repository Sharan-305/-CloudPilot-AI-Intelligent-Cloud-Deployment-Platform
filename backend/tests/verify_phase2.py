import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.database.base import Base
from app.database.session import engine
import app.models  # Register all models
from app.main import app as fastapi_app


def test_phase2():
    print("=" * 60)
    print("CLOUDPILOT AI - PHASE 2 VERIFICATION SUITE")
    print("=" * 60)

    # Reset tables for clean test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    client = TestClient(fastapi_app)

    # 1. Register First User (Admin)
    print("\n[1] Testing User Registration (First user auto-admin)...")
    res_admin = client.post("/api/v1/auth/register", json={
        "email": "admin@cloudpilot.ai",
        "password": "AdminPassword123!",
        "full_name": "Admin Leader",
        "role": "Admin"
    })
    assert res_admin.status_code == 201, f"Admin register failed: {res_admin.text}"
    admin_data = res_admin.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "Admin"
    print(f"  [OK] Admin registered: {admin_data['user']['email']} (Role: {admin_data['user']['role']})")

    # 2. Register Second User (Developer)
    print("\n[2] Testing Developer Registration...")
    res_dev = client.post("/api/v1/auth/register", json={
        "email": "dev@cloudpilot.ai",
        "password": "DevPassword123!",
        "full_name": "Alex Developer",
        "role": "Developer"
    })
    assert res_dev.status_code == 201, f"Dev register failed: {res_dev.text}"
    dev_data = res_dev.json()
    dev_token = dev_data["access_token"]
    assert dev_data["user"]["role"] == "Developer"
    print(f"  [OK] Developer registered: {dev_data['user']['email']} (Role: {dev_data['user']['role']})")

    # 3. Register Third User (Viewer)
    print("\n[3] Testing Viewer Registration...")
    res_viewer = client.post("/api/v1/auth/register", json={
        "email": "viewer@cloudpilot.ai",
        "password": "ViewerPassword123!",
        "full_name": "Sam Viewer",
        "role": "Viewer"
    })
    assert res_viewer.status_code == 201, f"Viewer register failed: {res_viewer.text}"
    viewer_data = res_viewer.json()
    viewer_token = viewer_data["access_token"]
    assert viewer_data["user"]["role"] == "Viewer"
    print(f"  [OK] Viewer registered: {viewer_data['user']['email']} (Role: {viewer_data['user']['role']})")

    # 4. Test Login
    print("\n[4] Testing Authentication & Token Handling...")
    # Invalid password
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "dev@cloudpilot.ai",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401, "Expected 401 on bad password"
    print("  [OK] Invalid password correctly rejected with 401")

    # Valid login
    good_login = client.post("/api/v1/auth/login", json={
        "email": "dev@cloudpilot.ai",
        "password": "DevPassword123!"
    })
    assert good_login.status_code == 200, f"Valid login failed: {good_login.text}"
    assert "access_token" in good_login.json()
    print("  [OK] Valid login returned signed JWT")

    # 5. Protected Endpoint /me
    print("\n[5] Testing Protected Route (/api/v1/auth/me)...")
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {dev_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "dev@cloudpilot.ai"
    print(f"  [OK] Profile retrieved for authenticated user: {me_res.json()['email']}")

    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401
    print("  [OK] Missing token correctly rejected with 401")

    # 6. Project Creation by Developer
    print("\n[6] Testing Project Creation & Repository Linking...")
    proj_res = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {dev_token}"},
        json={
            "name": "payment-gateway-service",
            "description": "High-throughput payment processing container",
            "environment": "production",
            "repo_url": "https://github.com/cloudpilot/sample-node-app",
            "branch": "main"
        }
    )
    assert proj_res.status_code == 201, f"Project creation failed: {proj_res.text}"
    proj_data = proj_res.json()
    proj_id = proj_data["id"]
    assert proj_data["name"] == "payment-gateway-service"
    assert proj_data["repository"] is not None
    assert proj_data["repository"]["repo_url"] == "https://github.com/cloudpilot/sample-node-app"
    print(f"  [OK] Project created: ID={proj_id}, Repo={proj_data['repository']['repo_url']}")

    # 7. Role-Based Permissions (Viewer cannot create project)
    print("\n[7] Testing RBAC: Viewer restricted from creating project...")
    viewer_proj_res = client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={
            "name": "unauthorized-viewer-project",
            "description": "Should fail",
            "environment": "development"
        }
    )
    assert viewer_proj_res.status_code == 403, f"Expected 403 for viewer project creation, got: {viewer_proj_res.status_code}"
    print("  [OK] Viewer prohibited from creating project with 403 Forbidden")

    # 8. Project Details & Counts
    print("\n[8] Testing Project Details & Related Entities...")
    detail_res = client.get(
        f"/api/v1/projects/{proj_id}",
        headers={"Authorization": f"Bearer {dev_token}"}
    )
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["services_count"] == 0
    assert detail["deployments_count"] == 0
    assert detail["active_incidents_count"] == 0
    print(f"  [OK] Project detail verified: Services={detail['services_count']}, Incidents={detail['active_incidents_count']}")

    # 9. Cloud Connections API
    print("\n[9] Testing Cloud Connections...")
    conn_res = client.post(
        "/api/v1/cloud-connections",
        headers={"Authorization": f"Bearer {dev_token}"},
        json={
            "provider": "local_docker",
            "connection_name": "Local Development Daemon",
            "region": "local"
        }
    )
    assert conn_res.status_code == 201
    conn_data = conn_res.json()
    assert conn_data["is_connected"] is True
    print(f"  [OK] Cloud connection registered: Provider={conn_data['provider']}, Preview={conn_data['credentials_preview']}")

    # 10. Audit Logs
    print("\n[10] Testing Audit Logs Trail...")
    audit_res = client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert audit_res.status_code == 200
    logs = audit_res.json()
    actions = [l["action"] for l in logs]
    print(f"  [OK] Audit logs recorded actions: {actions}")
    assert "user_registered" in actions
    assert "user_logged_in" in actions
    assert "project_created" in actions

    print("\n" + "=" * 60)
    print("ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_phase2()
