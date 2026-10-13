# Database Documentation

The platform uses PostgreSQL 16 for persistent application data.

Docker service: expense-postgres.

## Configuration

| Setting | Value |
|---|---|
| Database | expense_db |
| User | expense_user |
| Host inside Compose | postgres |
| Port | 5432 |
| PostgreSQL | 16 |
| Volume | postgres_data |

PostgreSQL is not published directly to the host.

## Schema

Initial migration: database/migrations/001_initial_schema.sql.

Expected tables include users, expense_categories, expenses, budgets, and monthly_expense_summary.

## Persistence

The postgres_data volume preserves data across normal container recreation.

Initialization scripts run when PostgreSQL creates a new data directory and are not rerun on every restart.

## Development Reset

    docker compose down -v
    docker compose up -d

Warning: this deletes the current database volume and its data.

## Health

PostgreSQL uses pg_isready -U expense_user -d expense_db as its container health check.

The backend provides /health/db and Nginx exposes /api/health/db.

## Production

The current application runs on AWS EC2 using the same Docker Compose database service.

Public application: https://expense-tracker.live

Cloudflare and HTTPS are part of the surrounding production environment. PostgreSQL remains internal.
