import uuid
from types import SimpleNamespace

import pytest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import app, validate_secret_configuration
from extensions import db, limiter
from routes.expenses import safe_csv_cell
from routes.budgets import _is_budget_uniqueness_violation


@pytest.fixture()
def client():
    app.config.update(TESTING=True, RATELIMIT_ENABLED=False)
    limiter.reset()
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

    non_object_body = client.post(
        "/api/expenses",
        headers={"Authorization": f"Bearer {token}"},
        json=["not", "an", "object"],
    )
    assert non_object_body.status_code == 400

    invalid_category = client.post(
        "/api/expenses",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "category_id": [],
            "amount": 10,
            "description": "Invalid category ID test",
            "expense_date": "2026-10-11",
        },
    )
    assert invalid_category.status_code == 400

    for amount in ["NaN", "Infinity", "-Infinity", "10000000000"]:
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

    non_object_body = client.post(
        "/api/budgets",
        headers={"Authorization": f"Bearer {token}"},
        json=["not", "an", "object"],
    )
    assert non_object_body.status_code == 400

    invalid_category = client.post(
        "/api/budgets",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 100, "month": "2026-10-01", "category_id": []},
    )
    assert invalid_category.status_code == 400

    headers = {"Authorization": f"Bearer {token}"}
    for amount in ["NaN", "Infinity", "-Infinity", "10000000000"]:
        response = client.post(
            "/api/budgets",
            headers=headers,
            json={"amount": amount, "month": "2026-10-01"},
        )
        assert response.status_code == 400

    created = client.post(
        "/api/budgets",
        headers=headers,
        json={"amount": 100, "month": "2026-10-01"},
    )
    assert created.status_code == 201
    budget_id = created.get_json()["data"]["id"]

    compact_create = client.post(
        "/api/budgets",
        headers=headers,
        json={"amount": 100, "month": "20261101"},
    )
    assert compact_create.status_code == 400

    compact_update = client.put(
        f"/api/budgets/{budget_id}",
        headers=headers,
        json={"month": "20261101"},
    )
    assert compact_update.status_code == 400

    unchanged = client.get(f"/api/budgets/{budget_id}", headers=headers)
    assert unchanged.status_code == 200
    assert unchanged.get_json()["data"]["month"] == "2026-10-01"


def test_registration_rejects_invalid_email_and_oversized_name(client):
    invalid_payloads = [
        {
            "full_name": "QA User",
            "email": "not-an-email",
            "password": "TestPassword123!",
        },
        {
            "full_name": "N" * 101,
            "email": f"qa-long-name-{uuid.uuid4().hex}@example.test",
            "password": "TestPassword123!",
        },
    ]

    for payload in invalid_payloads:
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 400


def test_expense_date_range_filters_and_validation(client):
    email = f"qa-date-range-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Date Range Test",
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

    category_response = client.post(
        "/api/categories",
        json={"name": f"QA date range {uuid.uuid4().hex}"},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    for expense_date in ["2026-10-01", "2026-10-10"]:
        response = client.post(
            "/api/expenses",
            headers=headers,
            json={
                "category_id": category_id,
                "amount": 10,
                "description": "Date range test",
                "expense_date": expense_date,
            },
        )
        assert response.status_code == 201

    filtered = client.get(
        "/api/expenses?start_date=2026-10-05&end_date=2026-10-31",
        headers=headers,
    )
    assert filtered.status_code == 200
    assert len(filtered.get_json()["data"]) == 1
    assert filtered.get_json()["data"][0]["expense_date"] == "2026-10-10"

    invalid_date = client.get(
        "/api/expenses?start_date=2026-10-31&end_date=2026-10-05",
        headers=headers,
    )
    assert invalid_date.status_code == 400

    malformed_date = client.get(
        "/api/expenses?start_date=10-05-2026",
        headers=headers,
    )
    assert malformed_date.status_code == 400

    noncanonical_create = client.post(
        "/api/expenses",
        headers=headers,
        json={
            "category_id": category_id,
            "amount": 10,
            "description": "Noncanonical date test",
            "expense_date": "20261011",
        },
    )
    assert noncanonical_create.status_code == 400

    expense_id = filtered.get_json()["data"][0]["id"]
    noncanonical_update = client.put(
        f"/api/expenses/{expense_id}",
        headers=headers,
        json={"expense_date": "20261012"},
    )
    assert noncanonical_update.status_code == 400

    unchanged = client.get(
        f"/api/expenses/{expense_id}",
        headers=headers,
    )
    assert unchanged.status_code == 200
    assert unchanged.get_json()["data"]["expense_date"] == "2026-10-10"


def test_non_object_json_bodies_are_rejected(client):
    for endpoint in (
        "/api/auth/register",
        "/api/auth/login",
        "/api/categories",
    ):
        response = client.post(endpoint, json=["not", "an", "object"])
        assert response.status_code == 400


def test_expenses_and_csv_export_are_isolated_between_users(client):
    """A user's list and CSV export must not expose another user's expense."""
    password = "TestPassword123!"

    def register_and_login(label):
        email = f"qa-isolation-{label}-{uuid.uuid4().hex}@example.test"
        registration = client.post(
            "/api/auth/register",
            json={
                "full_name": f"QA Isolation {label}",
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
        return {"Authorization": f"Bearer {token}"}

    owner_headers = register_and_login("Owner")
    other_headers = register_and_login("Other")

    category_name = f"QA isolation category {uuid.uuid4().hex}"
    category_response = client.post(
        "/api/categories",
        json={"name": category_name},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    private_description = f"private-expense-{uuid.uuid4().hex}"
    create_response = client.post(
        "/api/expenses",
        headers=owner_headers,
        json={
            "category_id": category_id,
            "amount": 42.50,
            "description": private_description,
            "expense_date": "2026-10-11",
        },
    )
    assert create_response.status_code == 201

    owner_list = client.get("/api/expenses", headers=owner_headers)
    assert owner_list.status_code == 200
    assert any(
        item["description"] == private_description
        for item in owner_list.get_json()["data"]
    )

    other_list = client.get("/api/expenses", headers=other_headers)
    assert other_list.status_code == 200
    assert all(
        item["description"] != private_description
        for item in other_list.get_json()["data"]
    )

    other_export = client.get(
        "/api/expenses/export",
        headers=other_headers,
    )
    assert other_export.status_code == 200
    assert private_description not in other_export.get_data(as_text=True)


def test_budget_uniqueness_indexes_exist():
    with app.app_context():
        indexes = db.session.execute(
            db.text(
                "SELECT indexname FROM pg_indexes "
                "WHERE schemaname = 'public' AND tablename = 'budgets'"
            )
        ).scalars().all()

    assert "uq_budgets_user_month_category" in indexes
    assert "uq_budgets_user_month_no_category" in indexes


def test_duplicate_general_budget_returns_conflict(client):
    email = f"qa-budget-duplicate-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Duplicate Budget Test",
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
    payload = {"amount": 150, "month": "2026-10-01"}

    first = client.post("/api/budgets", headers=headers, json=payload)
    second = client.post("/api/budgets", headers=headers, json=payload)

    assert first.status_code == 201
    assert second.status_code == 409

    listed = client.get("/api/budgets", headers=headers)
    assert listed.status_code == 200
    assert len(listed.get_json()["data"]) == 1


def test_unexpected_budget_commit_failure_rolls_back_and_session_recovers(
    client, monkeypatch
):
    email = f"qa-budget-rollback-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Budget Rollback Test",
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
    payload = {"amount": 200, "month": "2026-11-01"}

    def fail_commit(self):
        raise RuntimeError("simulated database failure")

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_commit)
        failed = client.post("/api/budgets", headers=headers, json=payload)

    assert failed.status_code == 500
    assert "simulated database failure" not in failed.get_data(as_text=True)
    assert "password" not in failed.get_data(as_text=True).lower()

    recovered = client.post("/api/budgets", headers=headers, json=payload)
    assert recovered.status_code == 201

    listed = client.get("/api/budgets", headers=headers)
    assert listed.status_code == 200
    assert len(listed.get_json()["data"]) == 1


def test_only_budget_unique_index_violations_map_to_conflict():
    known_unique_violation = SimpleNamespace(
        orig=SimpleNamespace(
            diag=SimpleNamespace(
                constraint_name="uq_budgets_user_month_no_category"
            )
        )
    )
    unrelated_integrity_violation = SimpleNamespace(
        orig=SimpleNamespace(
            diag=SimpleNamespace(
                constraint_name="chk_budget_amount"
            )
        )
    )

    assert _is_budget_uniqueness_violation(known_unique_violation) is True
    assert (
        _is_budget_uniqueness_violation(unrelated_integrity_violation)
        is False
    )


def test_delete_category_in_use_returns_conflict(client):
    email = f"qa-category-delete-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Category Delete Test",
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

    category_response = client.post(
        "/api/categories",
        json={"name": f"QA delete category {uuid.uuid4().hex}"},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    expense_response = client.post(
        "/api/expenses",
        headers=headers,
        json={
            "category_id": category_id,
            "amount": 25,
            "description": "Category delete protection test",
            "expense_date": "2026-10-11",
        },
    )
    assert expense_response.status_code == 201

    deletion = client.delete(f"/api/categories/{category_id}")
    assert deletion.status_code == 409

    still_exists = client.get(f"/api/categories/{category_id}")
    assert still_exists.status_code == 200


def test_unexpected_category_delete_failure_returns_500_and_recovers(
    client, monkeypatch
):
    category_response = client.post(
        "/api/categories",
        json={"name": f"QA delete failure {uuid.uuid4().hex}"},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    def fail_commit(self):
        raise RuntimeError("simulated database failure")

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_commit)
        failed = client.delete(f"/api/categories/{category_id}")

    assert failed.status_code == 500
    assert "simulated database failure" not in failed.get_data(as_text=True)

    still_exists = client.get(f"/api/categories/{category_id}")
    assert still_exists.status_code == 200

    recovered = client.delete(f"/api/categories/{category_id}")
    assert recovered.status_code == 200


def test_category_with_budget_cannot_be_deleted_or_reclassified(client):
    email = f"qa-category-budget-{uuid.uuid4().hex}@example.test"
    password = "TestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Category Budget Test",
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

    category_response = client.post(
        "/api/categories",
        json={"name": f"QA budget category {uuid.uuid4().hex}"},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    budget_response = client.post(
        "/api/budgets",
        headers=headers,
        json={
            "amount": 250,
            "month": "2026-10-01",
            "category_id": category_id,
        },
    )
    assert budget_response.status_code == 201

    deletion = client.delete(f"/api/categories/{category_id}")
    assert deletion.status_code == 409
    assert "assigned to a budget" in deletion.get_json()["message"]

    budgets = client.get("/api/budgets", headers=headers)
    assert budgets.status_code == 200
    matching = [
        item for item in budgets.get_json()["data"]
        if item["id"] == budget_response.get_json()["data"]["id"]
    ]
    assert len(matching) == 1
    assert matching[0]["category_id"] == category_id


def test_budget_category_foreign_key_restricts_deletion():
    with app.app_context():
        constraint = db.session.execute(
            db.text(
                "SELECT rc.delete_rule "
                "FROM information_schema.referential_constraints AS rc "
                "JOIN information_schema.table_constraints AS tc "
                "ON tc.constraint_catalog = rc.constraint_catalog "
                "AND tc.constraint_schema = rc.constraint_schema "
                "AND tc.constraint_name = rc.constraint_name "
                "WHERE tc.table_schema = 'public' "
                "AND tc.table_name = 'budgets' "
                "AND tc.constraint_name = 'fk_budgets_category'"
            )
        ).scalar_one()

    assert constraint == "RESTRICT"


def test_category_name_constraint_conflict_returns_409_for_create_and_update(
    client, monkeypatch
):
    def fail_unique_commit(self):
        raise IntegrityError(
            "category name insert/update",
            {},
            SimpleNamespace(
                diag=SimpleNamespace(
                    constraint_name="uq_expense_category_name"
                )
            ),
        )

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_unique_commit)
        create_response = client.post(
            "/api/categories",
            json={"name": f"QA category race {uuid.uuid4().hex}"},
        )

    assert create_response.status_code == 409
    assert "already exists" in create_response.get_json()["message"]

    original_name = f"QA category update {uuid.uuid4().hex}"
    category_response = client.post(
        "/api/categories",
        json={"name": original_name},
    )
    assert category_response.status_code == 201
    category_id = category_response.get_json()["data"]["id"]

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_unique_commit)
        update_response = client.put(
            f"/api/categories/{category_id}",
            json={"name": f"QA category renamed {uuid.uuid4().hex}"},
        )

    assert update_response.status_code == 409
    stored = client.get(f"/api/categories/{category_id}")
    assert stored.status_code == 200
    assert stored.get_json()["data"]["name"] == original_name


def test_category_create_unexpected_commit_failure_rolls_back_and_recovers(
    client, monkeypatch
):
    def fail_commit(self):
        raise RuntimeError("simulated category database failure")

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_commit)
        failed = client.post(
            "/api/categories",
            json={"name": f"QA category failure {uuid.uuid4().hex}"},
        )

    assert failed.status_code == 500
    assert "simulated category database failure" not in failed.get_data(
        as_text=True
    )

    recovered = client.post(
        "/api/categories",
        json={"name": f"QA category recovery {uuid.uuid4().hex}"},
    )
    assert recovered.status_code == 201


def test_email_constraint_race_returns_conflict_for_register_and_profile(
    client, monkeypatch
):
    def fail_email_unique_commit(self):
        raise IntegrityError(
            "user email insert/update",
            {},
            SimpleNamespace(
                diag=SimpleNamespace(
                    constraint_name="users_email_key"
                )
            ),
        )

    email = f"qa-email-race-{uuid.uuid4().hex}@example.test"
    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_email_unique_commit)
        registration = client.post(
            "/api/auth/register",
            json={
                "full_name": "QA Email Race",
                "email": email,
                "password": "TestPassword123!",
            },
        )

    assert registration.status_code == 409

    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "QA Email Race",
            "email": email,
            "password": "TestPassword123!",
        },
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "TestPassword123!"},
    )
    assert login.status_code == 200
    token = login.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_email_unique_commit)
        profile_update = client.put(
            "/api/auth/me",
            headers=headers,
            json={"email": f"qa-email-new-{uuid.uuid4().hex}@example.test"},
        )

    assert profile_update.status_code == 409
    current_profile = client.get("/api/auth/me", headers=headers)
    assert current_profile.status_code == 200
    assert current_profile.get_json()["data"]["email"] == email


def test_registration_unexpected_commit_failure_rolls_back_and_recovers(
    client, monkeypatch
):
    def fail_commit(self):
        raise RuntimeError("simulated registration database failure")

    email = f"qa-register-recovery-{uuid.uuid4().hex}@example.test"
    payload = {
        "full_name": "QA Registration Recovery",
        "email": email,
        "password": "TestPassword123!",
    }

    with monkeypatch.context() as patcher:
        patcher.setattr(Session, "commit", fail_commit)
        failed = client.post("/api/auth/register", json=payload)

    assert failed.status_code == 500
    assert "simulated registration database failure" not in failed.get_data(
        as_text=True
    )

    recovered = client.post("/api/auth/register", json=payload)
    assert recovered.status_code == 201


@pytest.mark.parametrize(
    ("secret_key", "jwt_secret"),
    [
        (None, "jwt-test-secret-that-is-long-enough-123456"),
        (
            "replace-with-a-strong-random-flask-secret",
            "jwt-test-secret-that-is-long-enough-123456",
        ),
        ("flask-test-secret-that-is-long-enough-123456", None),
        (
            "flask-test-secret-that-is-long-enough-123456",
            "replace-with-a-different-strong-random-jwt-secret",
        ),
        ("short", "jwt-test-secret-that-is-long-enough-123456"),
        (
            "flask-test-secret-that-is-long-enough-123456",
            "flask-test-secret-that-is-long-enough-123456",
        ),
    ],
)
def test_production_secret_validation_rejects_unsafe_signing_keys(
    secret_key, jwt_secret
):
    with pytest.raises(RuntimeError):
        validate_secret_configuration(
            secret_key, jwt_secret, "production"
        )


def test_production_secret_validation_accepts_distinct_strong_keys():
    validate_secret_configuration(
        "flask-production-secret-with-enough-length-123456",
        "jwt-production-secret-with-enough-length-654321",
        "production",
    )


def test_nonproduction_secret_validation_allows_local_test_configuration():
    validate_secret_configuration("short-local-secret", None, "testing")
