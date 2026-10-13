# Expense Tracker

Expense Tracker is a full-stack web application for recording personal expenses, organizing spending by category, setting budgets, reviewing monthly spending, and exporting transaction data.

The project is built as a containerized system with automated checks and an AWS EC2 deployment workflow. It is designed to demonstrate maintainable application architecture and practical DevOps practice.

## Features

- Registration and sign-in with JWT authentication and hashed passwords
- Create, view, edit, and delete personal expenses
- Filter transactions by month, date range, and category
- Manage expense categories
- Set monthly budgets by category and track budget utilization on the dashboard
- Monthly and category summaries, dashboard totals, charts, and recent transactions
- CSV export with spreadsheet-formula protection and UTF-8 output
- Profile and preference settings, including a display currency
- Application and database health endpoints

Some settings are stored but not yet active. See [Current limitations](#current-limitations).

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
- The Flask API uses a restricted database role for runtime. A separate bootstrap account runs initialization and migrations.
- In production, the application runs on AWS EC2 behind Cloudflare DNS and proxy. See [Deployment](#deployment).

For component details, see [docs/architecture.md](docs/architecture.md).

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Recharts, Lucide React |
| API | Python 3.12, Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Limiter |
| Database | PostgreSQL 16 with ordered SQL migrations |
| Web entry point | Nginx |
| Containers | Docker and Docker Compose |
| CI/CD | GitHub Actions, GitHub Container Registry (GHCR) |
| Production host | AWS EC2 (Ubuntu) |

## Repository layout

| Path | Contents |
|---|---|
| `frontend/` | React application and frontend tests |
| `backend/` | Flask application, routes, models, and backend tests |
| `database/migrations/` | Ordered PostgreSQL migrations |
| `nginx/` | Reverse-proxy configuration |
| `docs/` | Architecture, Docker, Nginx, security, and CI/CD documentation |
| `QA/` | Test plan, test cases, findings, and release checklist |
| `.github/workflows/` | CI and CD workflows |
| `docker-compose.yml` | Local multi-container configuration |

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

Edit both files before starting the stack. Never commit real `.env` files.

- **Root `.env`:** set `POSTGRES_USER` and `POSTGRES_PASSWORD` (bootstrap account), `POSTGRES_DB`, and `POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD` (runtime account). The runtime password must be a random value of at least 32 characters.
- **`backend/.env`:** set `SECRET_KEY` and `JWT_SECRET`. Each must be at least 32 characters, must not be a placeholder, and must differ from the other.

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

A new Compose volume runs migration `001` automatically. Existing databases receive later migrations through the deployment workflow. Back up a populated database before applying migrations.

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

Unit tests cover budget calculations, budget search, and CSV formatting. They do not replace browser-based end-to-end tests.

## API overview

All endpoints are served under `/api` through Nginx. Protected endpoints require `Authorization: Bearer <token>`.

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Application health |
| `GET /api/health/db` | Database connectivity |
| `POST /api/auth/register` | Create an account |
| `POST /api/auth/login` | Sign in and receive a JWT |
| `/api/expenses` | Expense CRUD, with `category_id`, `month`, `start_date`, and `end_date` filters |
| `/api/expenses/export` | CSV export of the filtered expenses |
| `/api/categories` | Category management |
| `/api/budgets` | Budget management |
| `/api/summaries/...` | Monthly and category summaries |

The source code and [QA test cases](QA/TEST_CASES.md) define exact request fields and response formats.

## Deployment

Production runs on **AWS EC2 (Ubuntu)** with Docker Compose, Cloudflare DNS and proxy, and HTTPS certificates managed by Let's Encrypt and Certbot.

The GitHub Actions CD workflow runs only after CI passes on `main`. When `DEPLOY_ENABLED` is `true`, it:

1. Publishes commit-tagged backend and frontend images to GHCR.
2. Connects to the EC2 host over SSH and checks out the CI-tested commit.
3. Pulls the matching images and builds Nginx from the same commit.
4. Starts PostgreSQL and waits until it is healthy.
5. Applies migrations `002` through `006`. If any migration fails, the running application is left unchanged.
6. Restarts the backend, frontend, and Nginx services.
7. Checks `/api/health` and `/api/health/db` on the public URL.

See [docs/ci-cd.md](docs/ci-cd.md) for the full pipeline and required configuration.

### Deployment status

The deployment workflow and its configuration are implemented. Before reporting a release, record the following: the deployed commit or image, successful public health checks, and browser checks of the main user flows. A green CI run does not by itself prove that the latest commit is live.

## Security

- Keep real `.env` files, passwords, signing keys, and SSH keys out of Git. CI blocks tracked `.env` files and runs Gitleaks on every run.
- Use separate strong values for `SECRET_KEY` and `JWT_SECRET`.
- Keep the bootstrap database credential separate from the runtime credential. The backend receives only the runtime credential.
- PostgreSQL is not published to the host. Nginx is the only public entry point.
- Passwords are hashed. Register and sign-in endpoints are rate limited.
- See [docs/security.md](docs/security.md).

## Current limitations

- The Settings page saves notification preferences, but no notification delivery is implemented.
- The budget alert-threshold preference is stored but does not trigger alerts.
- The API supports whole-month budgets, but the browser form requires a category, so whole-month budgets cannot yet be created in the UI.
- The currency preference changes display formatting only. It does not convert historical amounts.
- Shared rate-limit storage for multiple application instances is not configured.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Compose fails to start | Both `.env` files exist, and every required variable has a valid value |
| PostgreSQL is unhealthy | `docker compose logs postgres`; bootstrap user, password, and database name |
| Backend cannot reach the database | Runtime variables match the role from migration `006`; backend host is `postgres` |
| `/api/health` fails | `docker compose logs nginx backend`; Nginx routes in `nginx/default.conf` |
| `/api/health/db` fails | Backend logs; database health; runtime credentials |
| Migration 003 fails | Duplicate legacy budgets. Back up, reconcile the data, then retry |
| Backend tests refuse to run | Test database name must identify it as a test database |
| Frontend build fails | Run `npm ci` in `frontend/`, then `npm run build` |

## Documentation

- [Architecture](docs/architecture.md)
- [CI/CD](docs/ci-cd.md)
- [Docker](docs/docker.md)
- [Nginx](docs/nginx.md)
- [Security](docs/security.md)
- [QA documentation](QA/README.md)
- [Contributing](CONTRIBUTING.md)
