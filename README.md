# Expense Tracker
## Enhanced Personal Expense Management Platform

Expense Tracker is a full-stack web application for recording personal expenses, organizing spending by category, setting budgets, reviewing monthly spending, and exporting transaction data for further analysis.

The project combines application development with practical DevOps work: containerized services, a relational database, reverse-proxy routing, automated checks, and an AWS EC2 deployment workflow.

## Project purpose

People often record expenses in scattered notes or spreadsheets, making it difficult to understand where money goes or whether spending is within a budget. Expense Tracker provides one place to record transactions, categorize them, review summaries, and compare spending with budget limits.

The goal is to make personal spending easier to record and review while demonstrating a maintainable, testable, and deployable web application architecture.

## Submission information

| Item | Status |
|---|---|
| Production domain | `https://expense-tracker.live` (recorded in the previous main-branch README; verify DNS, HTTPS, and health checks before final submission). |
| Architecture diagram | `docs/Expense Platform System Architecture.png` (already present in the repository; compare it with the deployed AWS environment before final presentation). |
| Project code | Available in this repository |
| Local setup instructions | Included below |
| Automated checks | GitHub Actions CI |
| Deployment target | AWS EC2, as approved for this project |
| Release verification | CI is available; final live-environment and end-to-end evidence must be recorded separately |

The listed domain and diagram are repository evidence, not proof that the latest commit is deployed. Record the deployed commit/image and successful public health checks before claiming release verification.

## Main features

- User registration and login using JWT authentication and hashed passwords.
- Create, view, edit, and delete personal expenses.
- Filter transactions by month, date range, and category.
- Manage expense categories.
- Set monthly spending limits by category and review budget utilization in the dashboard.
- View monthly summaries, category summaries, dashboard totals, charts, and recent transactions.
- Export transaction and report data to CSV, with spreadsheet-formula protection and UTF-8 handling.
- Update available profile settings and preferences, including preferred currency and notification preference flags. These flags are saved, but notification delivery is not implemented or verified.
- Check application and database health through dedicated endpoints.

Access control, budget rules, exports, and database behavior are covered by automated tests and the QA documents. A passing CI run demonstrates the checks executed by CI; it does not by itself prove that the latest version is deployed or that every browser flow has been tested.

## Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, Vite, JavaScript, Tailwind CSS, Recharts | User interface, forms, dashboard, charts, and downloads |
| API | Python, Flask, Flask-JWT-Extended, SQLAlchemy | Authentication, input validation, application rules, and JSON responses |
| Database | PostgreSQL 16 | Persistent users, expenses, categories, budgets, and related settings |
| Web entry point | Nginx | Serves the frontend and routes API/health requests to the backend |
| Containers | Docker and Docker Compose | Runs the frontend, backend, database, and Nginx consistently |
| CI | GitHub Actions | Runs secret scanning, migration checks, backend tests/lint, frontend tests/lint/build, and Docker builds |
| Deployment target | AWS EC2 | Host target for the configurable container deployment workflow |
| Container registry | GitHub Container Registry (GHCR) | Stores commit-tagged frontend and backend images |

## Architecture

![Expense Tracker system architecture](docs/Expense%20Platform%20System%20Architecture.png)

The existing diagram is embedded here. Confirm it matches the actual AWS topology before using it as final deployment evidence.

**Request flow**

```text
User's browser
      |
      v
Public application endpoint / HTTPS
      |
      v
Nginx reverse proxy
      |--------------------------|
      v                          v
React frontend              Flask REST API
                                  |
                                  v
                         Restricted PostgreSQL
                         application account

GitHub repository -> CI checks -> commit-tagged container images -> AWS EC2 deployment workflow
```

The browser communicates with Nginx. The React application calls the Flask API through the `/api` prefix. The browser must never connect directly to PostgreSQL. The backend uses a restricted database runtime account; the separate bootstrap account is reserved for database initialization and controlled migrations.

## Repository structure

- `frontend/` — React/Vite application and frontend tests.
- `backend/` — Flask application, API routes, SQLAlchemy models, and backend tests.
- `database/migrations/` — ordered PostgreSQL migrations.
- `nginx/` — reverse-proxy configuration.
- `docker-compose.yml` — local multi-container configuration.
- `.github/workflows/ci.yml` — automated validation.
- `.github/workflows/cd.yml` — GHCR publishing and configurable AWS EC2 deployment.
- `docs/` — architecture, security, Docker, Nginx, and CI/CD documentation.
- `QA/` — test plan, test cases, findings, requirements traceability, runtime checks, and release checklist.

The repository also contains legacy root-level frontend assets. The Docker Compose frontend service builds from `frontend/`; that is the maintained frontend entry point for the containerized application.

## Prerequisites

Install the following before running the application locally:

- Git
- Docker Engine or Docker Desktop
- Docker Compose plugin
- A terminal capable of running the commands below

For development outside Docker, also install Python 3.12 and Node.js 20.

## Local setup

Run these commands from the repository root.

### 1. Create the environment files

**PowerShell:**

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

**Linux, macOS, or Git Bash:**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit both files before starting the application. Do not commit either real `.env` file.

In the root `.env`, set:
- `POSTGRES_USER` and `POSTGRES_PASSWORD`: the database bootstrap account used for initialization and migrations.
- `POSTGRES_DB`: the database name.
- `POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD`: a separate restricted account used by the Flask application. The app password must be a unique random value of at least 32 characters.

In `backend/.env`, set separate strong values for `SECRET_KEY` and `JWT_SECRET`. Each must be at least 32 characters, must not be a placeholder, and must differ from the other. Do not reuse database passwords as application signing keys.

The Compose configuration passes the restricted application credentials to the backend. It does not pass the bootstrap database password into the backend container. Migration 006 creates or updates the restricted role and grants the data/sequence permissions the application needs. On an existing AWS database, the team must add the new `POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD` values to the server's protected environment file before deploying the change.

### 2. Start the services

```bash
docker compose up --build -d
docker compose ps
```

Open the local application at:

```text
http://localhost/
```

Nginx uses host port 80 by default. If that port is already in use, deliberately change the host-side mapping in `docker-compose.yml` and use the matching local URL.

### 3. Review logs and health

```bash
docker compose logs --tail=100
curl -i http://localhost/api/health
curl -i http://localhost/api/health/db
```

The first health endpoint checks application availability. The second checks whether the backend can reach PostgreSQL. A healthy container does not prove that registration, expense ownership, budgets, reports, filters, or CSV downloads work end to end.

### 4. Stop the services

```bash
docker compose down
```

PostgreSQL data is stored in a named volume. **Do not use `docker compose down -v` unless you intentionally want to delete the local database volume and its data.**

## Database and migrations

Migration files are ordered in `database/migrations/`. On a fresh PostgreSQL volume, the PostgreSQL container runs the mounted initialization files in order. Initialization scripts do not run again just because a container restarts or the repository is updated.

For an existing database, the CD workflow applies follow-up migrations explicitly before restarting the application services. The workflow stops if a migration fails. Before using this workflow against a populated database, the team must review migration output, preserve a backup, and confirm a recovery plan.

Migration 003 enforces budget uniqueness and intentionally stops if legacy duplicate budgets must be reviewed. Migration 004 prevents deleting a category while a budget still references it. Migration 005 adds the optional profile phone field. Migration 006 separates the restricted application database account from the bootstrap/migration account.

## Running tests

### Backend

From the repository root:

```bash
cd backend
pip install -r requirements.txt
pip install flake8 pytest
pytest -v
flake8 . --count --show-source --statistics --exclude .venv,venv,migrations
```

The test environment must point to a disposable database whose name clearly identifies it as a test database. The test configuration is designed to refuse normal production/staging database names. Do not point tests at a live database.

### Frontend

From the repository root:

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

The frontend test command uses Node's built-in test runner. Tests cover budget-spending calculations, budget search, and CSV safety/formatting. These unit tests do not replace browser-based end-to-end testing.

## API and health endpoints

The application exposes its API through Nginx under `/api`.

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Public application health check |
| `GET /api/health/db` | Public backend-to-database health check |
| `POST /api/auth/register` | Register an account |
| `POST /api/auth/login` | Authenticate and obtain a JWT |
| `/api/expenses` | Authenticated expense operations and filters |
| `/api/budgets` | Budget operations |
| `/api/categories` | Category operations |
| `/api/expenses/export` | Authenticated transaction CSV export |

Use the source routes and QA test cases for the exact request fields, supported methods, and response formats. Nginx routing must be verified through the public endpoint; source configuration alone is not runtime evidence.

## CI/CD and AWS deployment

The CI workflow runs on pull requests and configured branch pushes. It checks for committed environment files/secrets, applies and verifies database migrations, runs backend lint/tests, runs frontend tests/lint/build, builds the Docker images, and reports an aggregate `ci-success` result.

The CD workflow can publish commit-tagged frontend and backend images to GHCR and deploy to AWS EC2. Deployment is intentionally disabled unless the repository variable `DEPLOY_ENABLED` is set to `true` and the required production configuration is present.

The deployment uses these repository secrets:

- `AWS_EC2_HOST` — AWS instance IP or hostname.
- `AWS_EC2_USER` — SSH user on the instance.
- `AWS_EC2_SSH_KEY` — private SSH key for deployment.
- `GHCR_READ_USERNAME` — account used by the AWS host to pull images from GHCR.
- `GHCR_READ_TOKEN` — a protected, read-only package token for GHCR image pulls; never print or commit it.

It uses these repository variables:

- `DEPLOY_ENABLED` — enables deployment when set to `true`.
- `APP_URL` — verified public URL used by post-deployment health checks.
- `DEPLOY_PATH` — application directory on the instance; otherwise the documented default is used.

The workflow checks out the commit associated with the successful CI run, authenticates the AWS host to GHCR using the read-only registry credentials, uses commit-tagged images, waits for PostgreSQL, applies migrations before restarting application services, and checks both public health endpoints. The SSH deployment step logs out of GHCR after the pull. A commit-specific tag is traceable but is not inherently immutable; recording image digests or enforcing registry tag immutability provides stronger release integrity.

**Deployment status:** The production domain is recorded in the submission section, but its current DNS/HTTPS, deployed version, and health responses still require team-lead verification. Do not claim the latest commit is live until the team has captured the deployed commit/image, successful health checks, and end-to-end browser results.

## Security considerations

- Keep real `.env` files, passwords, signing keys, and SSH private keys out of Git.
- Use different strong Flask and JWT signing keys.
- Keep the PostgreSQL bootstrap credential separate from the backend runtime credential.
- Give the backend database role only the required table and sequence privileges.
- Keep PostgreSQL off the public network; expose the application through Nginx.
- Keep production deployment disabled until AWS secrets, variables, access controls, and the recovery plan are reviewed.
- Review the QA findings and release checklist before describing the application as release-ready.

## Troubleshooting

| Problem | Checks |
|---|---|
| Compose refuses to start | Confirm both environment files exist and all required variables have been replaced with valid values. |
| PostgreSQL does not become healthy | Review `docker compose logs postgres`; check the bootstrap username/password and database name. |
| Backend cannot connect to PostgreSQL | Confirm the app-role variables match the role created by migration 006 and that the backend uses the Compose hostname `postgres`. |
| Migration 003 fails | Review the diagnostic for duplicate legacy budgets; back up and reconcile data before retrying. |
| Migration 006 fails | Check that app and bootstrap usernames differ and the app password is a non-placeholder random value of at least 32 characters. |
| Nginx health check fails | Inspect Nginx, frontend, and backend logs and test both health endpoints locally. |
| Backend tests refuse to run | Confirm the test database name clearly identifies it as a test database and is not a production/staging database. |
| Frontend tests/build fail | Run `npm ci`, `npm test`, `npm run lint`, and `npm run build` inside `frontend/`. |
| CD skips AWS deployment | Check that CI passed on the expected main-branch push, `DEPLOY_ENABLED=true`, and required AWS secrets/variables are configured. |
| AWS health check fails | Check the deployed commit/image, instance access, Nginx routes, application logs, and the configured `APP_URL`. |

## QA and release evidence

The `QA/` directory records test cases, findings, requirements traceability, runtime verification steps, and release criteria. Findings distinguish source-level corrections and CI results from checks that require a running AWS environment or a browser.

Before final submission, capture:
1. The verified AWS architecture diagram.
2. The live application URL and successful public health checks.
3. The deployed commit or image digest.
4. Browser evidence for registration/login, expense CRUD and ownership, filtering, budgets, dashboard/report totals, and both CSV exports.
5. Migration results for a fresh database and a disposable populated database.
6. Evidence that the application runtime database role is restricted and that the bootstrap credential is not passed to the backend.
7. The required presentation covering the problem, objectives, architecture, stack, CI/CD, deployment, challenges, solutions, outcomes, future improvements, and demonstration screenshots.

Before final submission, verify that the recorded production domain resolves to the intended AWS deployment and that both public health endpoints respond successfully. Update the diagram only if the actual AWS topology differs.
