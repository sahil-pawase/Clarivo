"""
Test the main FastAPI application
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    import pytest
except Exception:
    pytest = None
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Clarivo API is running"}

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "clarivo-api"

def test_api_v1():
    """Test the API v1 endpoint"""
    response = client.get("/api/v1/")
    assert response.status_code == 200
    data = response.json()
    assert "Clarivo" in data["message"]
    assert "architecture" in data

def test_enterprise_security_headers_and_tracing():
    """Test that enterprise correlation IDs and security headers are injected"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Correlation-ID" in response.headers
    assert "X-Response-Time-Ms" in response.headers
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "SAMEORIGIN"

def test_system_health_and_diagnostics():
    """Test enterprise system health endpoint"""
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "ai_engine" in data
    assert "metrics" in data

def test_audit_logs_endpoint():
    """Test enterprise audit logs endpoint"""
    response = client.get("/api/v1/audit/logs")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert isinstance(data["logs"], list)


if __name__ == "__main__":
    print("Running Clarivo Enterprise test suite...")
    test_root()
    print("[PASS] test_root")
    test_health_check()
    print("[PASS] test_health_check")
    test_api_v1()
    print("[PASS] test_api_v1")
    test_enterprise_security_headers_and_tracing()
    print("[PASS] test_enterprise_security_headers_and_tracing")
    test_system_health_and_diagnostics()
    print("[PASS] test_system_health_and_diagnostics")
    test_audit_logs_endpoint()
    print("[PASS] test_audit_logs_endpoint")
    print("\nALL 6 TEST SUITES PASSED SUCCESSFULLY! 100% OPERATIONAL.")