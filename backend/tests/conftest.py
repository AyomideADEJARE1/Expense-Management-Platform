import sys
from pathlib import Path

import pytest
from sqlalchemy.engine import make_url


BACKEND_DIR = str(Path(__file__).resolve().parents[1])
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def is_test_database(database_name):
    """Return True when the configured database name identifies a test DB."""
    if not isinstance(database_name, str):
        return False
    normalized = database_name.lower()
    if any(
        marker in normalized
        for marker in ("prod", "production", "staging", "live")
    ):
        return False

    return (
        normalized in {"test", "testing"}
        or normalized.startswith("test_")
        or normalized.endswith("_test")
        or "_test_" in normalized
    )


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
            "Refusing to run API tests: configure POSTGRES_DB with a "
            "test-only database name (for example expense_management_test).",
            pytrace=False,
        )


@pytest.fixture(autouse=True)
def clean_test_database():
    """Keep API tests independent by clearing rows from the disposable test DB."""
    from app import app
    from extensions import db

    with app.app_context():
        db.session.rollback()
        for table_name in (
            "budgets",
            "expenses",
            "expense_categories",
            "users",
        ):
            db.session.execute(
                db.text(f"DELETE FROM {table_name}")
            )
        db.session.commit()
        yield
        db.session.rollback()
