import sys
from pathlib import Path

BACKEND_DIR = str(Path(__file__).resolve().parents[1])
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


import pytest
from sqlalchemy.engine import make_url


def is_test_database(database_name):
    """Return True only when the configured database name identifies a test DB."""
    if not isinstance(database_name, str):
        return False
    normalized = database_name.lower()
    return "test" in normalized or "testing" in normalized


@pytest.fixture(scope="session", autouse=True)
def refuse_non_test_database():
    """Fail closed rather than letting API tests target a normal database."""
    from app import app

    configured_url = app.config.get("SQLALCHEMY_DATABASE_URI")
    try:
        database_name = make_url(str(configured_url)).database
    except Exception:
        database_name = None

    if not is_test_database(database_name):
        pytest.fail(
            "Refusing to run API tests: configure POSTGRES_DB with a test-only "
            "database name (for example expense_management_test).",
            pytrace=False,
        )
