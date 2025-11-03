import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_version_endpoint():
    """Test the version endpoint."""
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "name" in data


def test_ai_complete_endpoint():
    """Test the AI completion endpoint."""
    response = client.post(
        "/api/ai/complete",
        json={"message": "Hello, test!", "model": "gpt-3.5-turbo"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "model" in data
    assert "usage" in data
    assert data["model"] == "gpt-3.5-turbo"
    assert isinstance(data["usage"], dict)


def test_ai_models_endpoint():
    """Test the AI models endpoint."""
    response = client.get("/api/ai/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "default" in data
    assert isinstance(data["models"], list)
    assert len(data["models"]) > 0


def test_ai_complete_endpoint_with_conversation():
    """Test the AI completion endpoint with conversation ID."""
    response = client.post(
        "/api/ai/complete",
        json={
            "message": "Hello, test!",
            "conversation_id": "test-conversation-123",
            "model": "gpt-4"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == "test-conversation-123"
    assert data["model"] == "gpt-4"


def test_ai_complete_endpoint_invalid_request():
    """Test the AI completion endpoint with invalid request."""
    response = client.post(
        "/api/ai/complete",
        json={"invalid_field": "test"}
    )
    # Should still work since we only validate the message field
    assert response.status_code == 422


def test_cors_headers():
    """Test that CORS headers are properly set."""
    response = client.options("/health")
    assert response.status_code == 200
    # CORS headers should be present
    headers = response.headers
    assert "access-control-allow-origin" in headers or "Access-Control-Allow-Origin" in headers