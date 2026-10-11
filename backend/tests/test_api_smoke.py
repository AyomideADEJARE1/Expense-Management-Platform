import uuid

import pytest

from app import app


@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def test_health_endpoint_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_expenses_endpoint_requires_authentication(client):
    response = client.get("/api/expenses")

    assert response.status_code == 401
    assert response.get_json()["success"] is False


def test_registration_rejects_missing_required_fields(client):
    response = client.post(
        "/api/auth/register",
        json={"full_name": "QA Test User", "password": "TestPassword123!"},
    )

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_user_can_register_login_and_read_own_expenses(client):
    email = f"qa-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Test User",
            "email": email,
            "password": password,
        },
    )
    assert register_response.status_code == 201
    assert register_response.get_json()["success"] is True

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    token = login_response.get_json()["data"]["access_token"]

    expenses_response = client.get(
        "/api/expenses",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert expenses_response.status_code == 200
    assert expenses_response.get_json()["data"] == []
