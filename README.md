# Expense Tracker

Expense Tracker is a full-stack web application for recording personal expenses, organizing spending by category, setting budgets, reviewing monthly spending, and exporting transaction data.

It is a containerized system with automated checks and an AWS EC2 deployment workflow. The application is deliberately simple. Its main purpose is to demonstrate maintainable architecture and practical DevOps: containers, a reverse proxy, a relational database, CI/CD, health checks, and documented deployment.

## Objectives

- Give each user a private record of expenses, categories, and budgets.
- Run the system as React, Nginx, Flask, and PostgreSQL 16 in Docker Compose.
- Check every change with automated tests, linting, migration checks, and image builds in GitHub Actions.
- Publish commit-tagged images and deploy them to AWS EC2 with explicit migration and health-check steps.
- Keep secrets out of Git, and document how to run, deploy, monitor, and troubleshoot the system.

## Features

- Registration and sign-in with JWT authentication and hashed passwords
- Create, view, edit, and delete personal expenses
- Filter transactions by month, date range, and category
- Manage expense categories. Categories are shared across users (see [limitations](#current-limitations))
- Set monthly budgets by category, and track budget use on the dashboard
- Monthly and category summaries, dashboard totals, charts, and recent transactions
- CSV export with spreadsheet-formula protection and UTF-8 output
- Profile settings: name, email, phone, and display currency
- Application and database health endpoints

Some preferences are stored but not yet active. See [limitations](#current-limitations).

## Architecture

![Expense Tracker system architecture](docs/Expense%20Platform%20System%20Architecture.png)

```text
Browser
  |
  v
Nginx (reverse proxy, port 80)
  |-- /        -> React frontend
  |-- /api/    -> Flask REST API -> PostgreSQL 16
```

- The browser talks only to Nginx. PostgreSQL is reachable only inside the Docker network.
- The Flask API connects with a restricted runtime database account. A separate bootstrap account runs initialization and migrations.
- In production, the application is intended to run on AWS EC2 (Ubuntu) behind Cloudflare DNS and proxy, with HTTPS certificates from Let's Encrypt and Certbot. See [deployment status](#deployment-status).

Component details are in [docs/architecture.md](docs/architecture.md). Containers, routing, and the database are described in [docs/docker.md](docs/docker.md), [docs/nginx.md](docs/nginx.md), and [database/README.md](database/README.md).

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Recharts, Lucide React |
| API | Python 3.12, Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Limiter, gunicorn |
| Database | PostgreSQL 16 with ordered SQL migrations |
| Web entry point | Nginx |
| Containers | Docker and Docker Compose |
| CI/CD | GitHub Actions, GitHub Container Registry (GHCR) |
| Target host | AWS EC2 (Ubuntu) |

## Repository layout

| Path | Contents |
|---|---|
| `frontend/` | React application, tests, Dockerfile, and Nginx configuration |
| `backend/` | Flask application, routes, models, tests, and Dockerfile |
| `database/migrations/` | Ordered PostgreSQL migrations. This is the only schema source |
| `database/README.md` | Database accounts, migration rules, and verification |
| `nginx/` | Reverse-proxy configuration |
| `scripts/` | Operational scripts, including the host health probe |
| `docs/` | Architecture, Docker, Nginx, security, CI/CD, AWS access, and monitoring |
| `QA/` | QA record: reading guide, findings register, test plan, and release checklist |
| `.github/workflows/` | CI and CD workflows |
| `docker-compose.yml` | Local and integration stack |

## Getting started

### Prerequisites

- Git
- Docker Engine or Docker Desktop, with the Compose plugin
- For work outside Docker: Python 3.12 and Node.js 20

### 1. Create the environment files

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Linux, macOS, or Git Bash:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit both files before starting the stack. Never commit real `.env` files. The variables are listed in [environment variables](#environment-variables).

### 2. Start the stack

```bash
docker compose up --build -d
docker compose ps
```

Open http://localhost/. Nginx publishes host port 80. If that port is in use, change the host-side mapping in `docker-compose.yml` and use the matching URL.

### 3. Check health

```bash
curl -i http://localhost/api/health      # application
curl -i http://localhost/api/health/db   # application-to-database connection
```

A healthy response does not prove that the complete user journey works. Test registration, sign-in, and expense entry in the browser.

### 4. Stop the stack

```bash
docker compose down
```

Database data lives in the `postgres_data` volume. **`docker compose down -v` deletes that volume and all local data.**

## Environment variables

| File | Variable | Required | Purpose |
|---|---|---|---|
| `.env` (root) | `POSTGRES_USER` | Yes | Bootstrap and migration account. Not passed to the backend |
| `.env` | `POSTGRES_PASSWORD` | Yes | Password for the bootstrap account |
| `.env` | `POSTGRES_DB` | Yes | Database name |
| `.env` | `POSTGRES_APP_USER` | Yes | Restricted runtime account used by the backend |
| `.env` | `POSTGRES_APP_PASSWORD` | Yes | Runtime password. At least 32 characters, not a placeholder |
| `backend/.env` | `SECRET_KEY` | Yes | Flask secret. At least 32 characters, not a placeholder |
| `backend/.env` | `JWT_SECRET` | Yes | JWT signing key. At least 32 characters, different from `SECRET_KEY` |
| `backend/.env` | `APP_ENV` | No | `development`, `testing`, or `production`. Defaults to `production`, which enforces strong keys and disables the debugger |
| `backend/.env` | `POSTGRES_PORT` | No | Database port for direct runs outside Compose. Default `5432` |

Compose overrides the `POSTGRES_*` values in `backend/.env` with the root runtime account, so the backend always uses the restricted account in Docker.

## Database and migrations

Migrations live in `database/migrations/` and are applied in filename order.

| Migration | Purpose |
|---|---|
| `001_initial_schema.sql` | Core tables: users, categories, expenses, budgets, monthly summaries |
| `002_user_settings.sql` | User preference settings |
| `003_budget_uniqueness.sql` | One general budget per user and month. Fails if legacy duplicates exist, so they can be reviewed first |
| `004_restrict_category_budget_delete.sql` | Prevents deleting a category that a budget still references |
| `005_user_phone.sql` | Optional phone number on the profile |
| `006_app_runtime_role.sql` | Creates or updates the restricted application role |

A new Compose volume runs the migrations automatically. Existing databases receive later migrations through the deployment workflow. Back up a populated database before applying migrations. See [database/README.md](database/README.md).

## Running tests

### Backend

```bash
cd backend
pip install -r requirements.txt
pip install flake8 pytest
pytest -v
flake8 . --count --show-source --statistics --exclude .venv,venv,migrations
```

Tests must point to a disposable database whose name identifies it as a test database. Never run them against a live database.

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm test
npm run build
```

Frontend tests are in `frontend/tests/`. They are unit tests and do not replace browser-based end-to-end tests.

## API overview

All endpoints are served under `/api` through Nginx. Protected endpoints require `Authorization: Bearer <token>`.

| Endpoint | Purpose |
|---|---|
| `GET /api/health`, `GET /api/health/db` | Public application and database health |
| `POST /api/auth/register` | Create an account |
| `POST /api/auth/login` | Sign in and receive a JWT |
| `GET /api/auth/me` | Current user and profile settings |
| `PUT /api/auth/me` | Update name, email, phone, currency, budget alert threshold, and notification flags |
| `/api/expenses` | Expense CRUD. Filters: `category_id`, `month` (`YYYY-MM`), `start_date`, `end_date` |
| `/api/expenses/export` | CSV export of the filtered expenses |
| `/api/categories` | Category CRUD |
| `/api/budgets` | Budget CRUD |
| `/api/summaries/...` | Monthly and category summaries |

The source code and the [test cases](QA/TEST_CASES.md) define the exact request fields and response formats.

## Deployment

The deployment target is **AWS EC2 (Ubuntu)** with Docker Compose, Cloudflare DNS and proxy, and HTTPS certificates managed by Let's Encrypt and Certbot.

The GitHub Actions CD workflow runs only after CI passes on `main`. When `DEPLOY_ENABLED` is `true`, it:

1. Publishes commit-tagged backend and frontend images to GHCR.
2. Connects to the EC2 host over SSH and checks out the CI-tested commit.
3. Pulls the matching images and builds Nginx from the same commit.
4. Starts PostgreSQL and waits until it is healthy.
5. Applies migrations `002` through `006`. If any migration fails, the running application is left unchanged.
6. Restarts the backend, frontend, and Nginx services.
7. Checks `/api/health` and `/api/health/db` on the public URL.

The full pipeline and the required GitHub configuration are in [docs/ci-cd.md](docs/ci-cd.md). The AWS identities, instance role, and network rules are in [docs/aws-iam.md](docs/aws-iam.md).

### Deployment status

The deployment workflow and its configuration are in this repository. The live environment's current state must be verified before a release is reported. Record the following for each release: the deployed commit or image digest, the result of both public health endpoints, and browser checks of the main user flows. A green CI run does not show that the latest commit is running.

## Monitoring

- **Health endpoints:** `/api/health` and `/api/health/db` through Nginx.
- **Container health:** every Compose service has a Docker health check. `docker compose ps` shows the state.
- **Host probe:** `scripts/healthcheck.sh` checks both public endpoints and the container states. Schedule it on the host. See [docs/monitoring.md](docs/monitoring.md).
- **Logs:** `docker compose logs -f <service>`. Each service keeps logs rotated at 10 MB, three files.

Scheduled alerting, external uptime monitoring, centralized logs, and host metrics are not yet configured. See [docs/monitoring.md](docs/monitoring.md) for each gap and how to close it.

## Security

- Keep real `.env` files, passwords, signing keys, and SSH keys out of Git. CI blocks tracked `.env` files and runs Gitleaks on every run.
- Use separate strong values for `SECRET_KEY` and `JWT_SECRET`. Production startup refuses weak or shared keys.
- Keep the bootstrap database credential separate from the runtime credential. The backend receives only the runtime credential.
- PostgreSQL is not published to the host. Nginx is the only public entry point.
- The backend container runs as a non-root user.
- Passwords are hashed. Register and sign-in endpoints are rate limited.
- See [docs/security.md](docs/security.md).

## Current limitations

- Settings saves notification preferences, but no notification delivery is implemented.
- The budget alert-threshold preference is stored but does not trigger alerts.
- The API supports whole-month budgets, but the browser form requires a category, so whole-month budgets cannot yet be created in the UI.
- The currency preference changes display formatting only. It does not convert historical amounts.
- Categories are shared across all users. Any signed-in user can rename or delete any category, and deletion is refused while any user's expense or budget uses it. Ownership is an open product decision.
- Rate-limit storage is in memory and is not shared across application instances.
- Nginx does not yet send a Content Security Policy.
- Automated database backup and restore are not defined in this repository.

Each limitation is recorded in the [QA findings register](QA/QA_FINDINGS.md).

## Troubleshooting

| Symptom | What to check |
|---|---|
| Compose fails to start | Both `.env` files exist, and every required variable has a valid value |
| Backend exits at startup | `SECRET_KEY` or `JWT_SECRET` is missing, too short, a placeholder, or equal to the other |
| PostgreSQL is unhealthy | `docker compose logs postgres`; bootstrap user, password, and database name |
| Backend cannot reach the database | Runtime variables match migration `006`; the backend host is `postgres` |
| `/api/health` fails | `docker compose logs nginx backend`; routes in `nginx/default.conf` |
| `/api/health/db` fails | Backend logs; database health; runtime credentials |
| Migration 003 fails | Duplicate legacy budgets. Back up, reconcile the data, then retry |
| Backend tests refuse to run | The test database name must identify it as a test database |
| Frontend build fails | Run `npm ci` in `frontend/`, then `npm run build` |

## Documentation

- [Architecture](docs/architecture.md)
- [CI/CD](docs/ci-cd.md)
- [Docker](docs/docker.md)
- [Nginx](docs/nginx.md)
- [Security](docs/security.md)
- [AWS IAM and access model](docs/aws-iam.md)
- [Monitoring](docs/monitoring.md)
- [Database](database/README.md)
- [Backend](backend/README.md)
- [QA documentation](QA/README.md)
- [Contributing](CONTRIBUTING.md)
