# Backend Troubleshooting

## Check the Stack

    docker compose ps

Services:

    expense-frontend
    expense-backend
    expense-postgres
    expense-nginx

Logs:

    docker compose logs -f backend
    docker compose logs -f postgres
    docker compose logs -f nginx

## Health

Backend inside its container:

    docker exec expense-backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:5000/health').read().decode())"

Through Nginx:

    curl http://localhost/api/health
    curl http://localhost/api/health/db

Expected application health: {"status":"ok"}.

## PostgreSQL

Connection: postgres:5432, database expense_db, user expense_user.

Initial schema: database/migrations/001_initial_schema.sql.

For a fresh development database only:

    docker compose down -v
    docker compose up -d

down -v deletes the database volume.

## Docker Networking

Inside a container, localhost means that same container. Backend-to-database uses postgres:5432. Nginx uses frontend:80 and backend:5000.

## Authentication

Main routes:

    POST /api/auth/register
    POST /api/auth/login
    GET /api/auth/me

Common failures include missing/invalid/expired JWTs, incorrect credentials, and unauthorized resource access.

## User Data Isolation

User-owned queries must use the authenticated user's identity. Changing a resource ID must not allow access to another user's financial records.

## Validation and Transactions

The backend validates registration, authentication, amounts, dates, categories, budgets, and other request fields.

Failed database transactions should roll back the SQLAlchemy session before reuse.

## Rate Limiting

Authentication-related endpoints are rate limited. Excessive requests may return HTTP 429 Too Many Requests.

## Rebuild

Backend only:

    docker compose build backend
    docker compose up -d backend

Full application:

    docker compose up -d --build

Then:

    docker compose ps
    curl http://localhost/api/health

## Production

Current production is AWS EC2, not Azure.

Typical application update:

    cd ~/Expense-Management-Platform
    git pull --ff-only
    docker compose build
    docker compose up -d
    docker compose ps
    curl http://localhost/api/health

Then verify https://expense-tracker.live.

## CI/CD

CI covers repository checks, migrations, backend/frontend validation, secret scanning, and Docker builds.

The CD workflow can publish images and contains a legacy/configurable Azure deployment job. That Azure job is not the current production deployment.
