from __future__ import annotations

import os
from typing import Any

from fastapi.testclient import TestClient
from jose import jwt

# Ensure configuration is populated before application import
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("PROJECT_NAME", "Workplace Tools API")
os.environ.setdefault("API_VERSION", "0.1.0")
os.environ.setdefault("RATE_LIMIT", "100/minute")

from app.main import app  # noqa: E402  # isort:skip

client = TestClient(app)


def generate_token(claims: dict[str, Any]) -> str:
    secret = os.environ["SUPABASE_JWT_SECRET"]
    return jwt.encode(claims, secret, algorithm="HS256")


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "timestamp" in body


def test_version_endpoint_returns_service_metadata() -> None:
    response = client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Workplace Tools API"
    assert body["version"] == "0.1.0"


def test_auth_me_requires_authentication() -> None:
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_auth_me_returns_claims_when_authenticated() -> None:
    token = generate_token({
        "sub": "user-123",
        "email": "user@example.com",
    })
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == "user-123"
    assert body["email"] == "user@example.com"
