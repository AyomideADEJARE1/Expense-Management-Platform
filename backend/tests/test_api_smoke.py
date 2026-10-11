import uuid

import pytest

from app import app
from routes.expenses import safe_csv_cell


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


@pytest.mark.parametrize(
    "value",
    [
        "=1+1",
        "+SUM(A1:A2)",
        "-2+3",
        "@SUM(A1:A2)",
        "  =1+1",
        "\t=1+1",
    ],
)
def test_csv_text_cells_neutralize_spreadsheet_formulas(value):
    assert safe_csv_cell(value) == "'" + value


@pytest.mark.parametrize(
    "value",
    [
        "Groceries",
        "Ordinary description",
        "",
        None,
    ],
)
def test_csv_text_cells_preserve_ordinary_values(value):
    assert safe_csv_cell(value) == ("" if value is None else value)


def test_category_rejects_non_string_name(client):
    response = client.post(
        "/api/categories",
        json={"name": 123},
    )

    assert response.status_code == 400


def test_category_rejects_non_string_description(client):
    response = client.post(
        "/api/categories",
        json={"name": "QA category type test", "description": ["invalid"]},
    )

    assert response.status_code == 400


def test_non_finite_expense_amount_is_rejected(client):
    email = f"qa-amount-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Amount Test",
            "email": email,
            "password": password,
        },
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.get_json()["data"]["access_token"]

    category_name = f"QA amount category {uuid.uuid4().hex}"
    category_response = client.post(
        "/api/categories",
        json={"name": category_name},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    for amount in ["NaN", "Infinity", "-Infinity"]:
        response = client.post(
            "/api/expenses",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "category_id": category_id,
                "amount": amount,
                "description": "Invalid amount test",
                "expense_date": "2026-10-11",
            },
        )
        assert response.status_code == 400


@pytest.mark.parametrize(
    "payload",
    [
        {"full_name": 123, "email": "qa@example.test", "password": "secret"},
        {
            "full_name": "QA User",
            "email": {"bad": "type"},
            "password": "secret",
        },
        {
            "full_name": "QA User",
            "email": "qa@example.test",
            "password": ["bad"],
        },
    ],
)
def test_registration_rejects_non_string_fields(client, payload):
    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 400


def test_login_rejects_non_string_fields(client):
    response = client.post(
        "/api/auth/login",
        json={"email": 123, "password": ["not-a-string"]},
    )

    assert response.status_code == 400


def test_profile_update_rejects_non_string_name_and_currency(client):
    email = f"qa-profile-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Profile Test",
            "email": email,
            "password": password,
        },
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    bad_name = client.put(
        "/api/auth/me",
        headers=headers,
        json={"first_name": 123, "last_name": "Tester"},
    )
    assert bad_name.status_code == 400

    bad_currency = client.put(
        "/api/auth/me",
        headers=headers,
        json={"currency": ["NGN (₦)"]},
    )
    assert bad_currency.status_code == 400


def test_non_finite_budget_amount_is_rejected(client):
    email = f"qa-budget-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Budget Test",
            "email": email,
            "password": password,
        },
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.get_json()["data"]["access_token"]

    for amount in ["NaN", "Infinity", "-Infinity", "10000000000"]:
        response = client.post(
            "/api/budgets",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": amount, "month": "2026-10-01"},
        )
        assert response.status_code == 400
