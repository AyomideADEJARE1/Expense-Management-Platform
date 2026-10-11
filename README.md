# Expense Management Platform

A full-stack personal expense management application built with React, Flask, PostgreSQL, Docker Compose, and Nginx. GitHub Actions provides repository validation and a prepared image-publishing/deployment workflow.

## Current architecture

![Expense Platform System Architecture](docs/Expense%20Platform%20System%20Architecture.png)

Browser → Nginx → React frontend / Flask REST API → PostgreSQL

Nginx is the public entry point. The frontend calls the Flask API through the `/api` prefix; the browser must not connect directly to PostgreSQL.

## Implemented application areas

- User registration and login using JWT authentication and hashed passwords.
- Expense creation, listing, editing, deletion, month/category API filtering, and an authenticated CSV export endpoint.
- Category management, budgets, monthly summaries, and category summaries.
- Dashboard totals, monthly/category charts, recent transactions, and reports.
- Docker Compose services for frontend, backend, PostgreSQL, and Nginx, including container health checks.
- GitHub Actions checks for secret scanning, database migration/schema checks, backend lint/test command, frontend lint/build, and Docker image builds.

Implementation presence is not proof that every flow has passed runtime QA. See the `QA/` directory for the test plan, test cases, traceability matrix, findings, and release checklist.

## Repository layout

- `frontend/` — Vite/React application served by its container.
- `backend/` — Flask API, routes, SQLAlchemy models, and dependencies.
- `database/migrations/` — PostgreSQL initialization SQL.
- `nginx/` — reverse proxy configuration.
- `docker-compose.yml` — local multi-container stack.
- `.github/workflows/` — CI and prepared CD workflows.
- `QA/` — QA evidence and open findings.

The root-level `src/` and root `package.json` are legacy/duplicate frontend assets. The Docker Compose frontend service builds from `frontend/`; use that directory as the frontend entry point unless the team deliberately consolidates the duplicate structure.

## Local prerequisites

Install Docker Engine/Desktop with the Docker Compose plugin. From a clean checkout:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit both environment files before starting the app. In `backend/.env`, set separate strong values for `SECRET_KEY` and `JWT_SECRET`. In the root `.env`, replace the PostgreSQL password placeholder with a unique strong password. Keep both `.env` files out of version control. Compose now requires these database variables instead of embedding a fixed password in the YAML.

Start the application from the repository root:

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=100
```

Open the application at `http://localhost/` when port 80 is available. If port 80 is occupied, change the host-side port mapping in Compose deliberately and update the URL accordingly.

Stop the services without deleting stored development data:

```bash
docker compose down
```

The PostgreSQL data is held in a named Docker volume. **Do not run `docker compose down -v` unless you intend to delete the local database volume and its data.**

## Health checks and useful diagnostics

The public Nginx health route is:

```text
GET /api/health
```

The backend also defines `/health/db`; the routed database health path should be verified against the current Nginx configuration before relying on it externally.

Useful commands:

```bash
docker compose ps
docker compose logs nginx
docker compose logs frontend
docker compose logs backend
docker compose logs postgres
curl -i http://localhost/api/health
```

A healthy container does not, by itself, prove that registration, expense ownership, budgets, reports, filters, or CSV downloads work correctly. Run the corresponding QA test cases and retain evidence.

## CI/CD and deployment status

The upstream `main` documentation currently identifies the live application URL as **https://expense-tracker.live** and describes the live host as AWS EC2 Ubuntu. Availability and current end-to-end functionality must be verified before using this URL as submission evidence.

The project tutor has approved AWS as an alternative deployment target, as reported by the QA owner. AWS EC2 is the target for this capstone audit and the live environment documented by the project. Retain the tutor's approval with submission records. The public URL alone does not prove that the latest reviewed commit is deployed; capture workflow, instance/container, health-check, and browser evidence for the submitted version.

The CI workflow runs backend pytest checks, frontend lint/build checks, and an optional frontend test command. The frontend package currently has no test script, so CI can skip frontend tests while still passing. A green CI result must not be interpreted as complete functional or browser test coverage. This is recorded as an open QA finding.

The CD workflow publishes container images and can deploy to AWS EC2 when DEPLOY_ENABLED=true and the required AWS secrets/variables are configured. The deployment workflow uses AWS_EC2_HOST, AWS_EC2_USER, and AWS_EC2_SSH_KEY. Do not describe the latest code as deployed or production-ready until the deployed commit/image, public routing, health checks, and end-to-end user journeys have been verified.

## Security notes

- Never commit `.env` files, access tokens, passwords, or private keys.
- Use strong secrets from the deployment environment for production.
- Restrict public network access to the required application entry point and administrative access.
- Category mutation routes and test coverage are under QA review; consult `QA/QA_FINDINGS.md` before treating the system as release-ready.

## QA documentation

- `QA/TEST_PLAN.md` — scope, environment, evidence rules, and release criteria.
- `QA/TEST_CASES.md` — functional, API, security, infrastructure, CI/CD, and documentation tests.
- `QA/REQUIREMENTS_TRACEABILITY.md` — requirement-to-test mapping.
- `QA/QA_FINDINGS.md` — findings, observations, blockers, and retests.
- `QA/RELEASE_CHECKLIST.md` — final release gate.

A test may be marked PASS only when it was actually executed and supporting evidence was recorded. Source inspection alone should be recorded as a code-review finding, not as a successful runtime test.
