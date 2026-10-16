# Database Architecture and Operations

PostgreSQL 16 is the persistent data store for Expense Tracker. The database is reachable by the application containers over the internal Docker Compose network and is not published directly to the host.

## Database accounts

The deployment uses two distinct database accounts:

| Account | Configuration | Purpose |
|---|---|---|
| Bootstrap/migration account | Root `.env`: `POSTGRES_USER` and `POSTGRES_PASSWORD` | Initializes PostgreSQL and applies controlled schema migrations |
| Application runtime account | Root `.env`: `POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD` | Used by Flask to read and modify application records |

The backend must not receive the bootstrap password. Migration 006 creates or updates the runtime role as a non-superuser, without database-creation or role-creation privileges, and grants only the table and sequence permissions needed for normal application CRUD. It also configures default privileges for future objects created by the bootstrap account.

Use unique strong passwords. The runtime password must be at least 32 characters and must not be a placeholder. Never commit real environment files or passwords.

## Database tables and relationships

The database includes:

- `users` — user accounts and preferences.
- `expense_categories` — category labels.
- `expenses` — individual expense records linked to a user and category.
- `budgets` — category-specific or whole-month budget records.
- `monthly_expense_summary` — stored monthly summary data where used by the application.

Conceptual relationships:

```text
users
  ├──< expenses >── expense_categories
  ├──< budgets >─── expense_categories (optional category)
  └──< monthly_expense_summary
```

The browser and React frontend do not connect directly to PostgreSQL. The backend accesses it through SQLAlchemy and Psycopg.

## Ordered migrations

Migration files live in `database/migrations/`:

1. `001_initial_schema.sql` — initial tables and constraints.
2. `002_user_settings.sql` — user preferences and related constraints.
3. `003_budget_uniqueness.sql` — database-enforced budget uniqueness.
4. `004_restrict_category_budget_delete.sql` — prevents deleting a category that is still referenced by a budget.
5. `005_user_phone.sql` — optional profile phone field.
6. `006_app_runtime_role.sql` — creates/configures the restricted application account and grants required data permissions.

On a fresh volume, PostgreSQL executes the mounted initialization scripts in order. PostgreSQL does **not** rerun those scripts merely because a container restarts or a file changes. The AWS CD workflow therefore applies migrations 002–006 explicitly to an existing database before restarting application services.

Migration 003 intentionally stops if legacy duplicate budgets need manual review. Back up the database and review the migration output before resolving any legacy data conflicts. If any migration fails, the deployment must stop before the new backend starts.

## Start and inspect the database

From the repository root, after both environment files have been created and configured:

```bash
docker compose up -d postgres
docker compose ps postgres
docker compose logs postgres
```

The health check uses the bootstrap account only to check that PostgreSQL is accepting connections. The backend itself must connect using the restricted runtime account.

## Recreate a local development database

The following commands destroy the local database volume and all data stored in it:

```bash
docker compose down -v
docker compose up --build -d
```

Only do this when the local data can be discarded. For any shared or production database, do not remove volumes or apply migrations without a backup and an agreed recovery plan.

## Verification checklist

- Confirm the backend container receives `POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD`, not the bootstrap credentials.
- Confirm the runtime role can perform the application's required CRUD operations.
- Confirm it cannot create roles, create databases, or create/alter schema objects.
- Confirm the migration role can apply migrations 002–006.
- Test both a fresh database and a disposable populated database.
- Preserve sanitized migration logs and privilege-test output; never include passwords or real user financial data.

## Connection path

```text
Browser -> Nginx -> Flask API -> SQLAlchemy/Psycopg -> PostgreSQL 16
```
