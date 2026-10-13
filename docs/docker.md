# Docker

This document describes the Docker Compose configuration used for local development and integration testing, and how the same images are built and published.

```text
Browser
   |
   v
Nginx :80 (only published port)
   |-- /api/* -> backend:5000 (Flask, gunicorn) -> postgres:5432
   |-- /*     -> frontend:80 (React, served by nginx)
```

## Services

| Service | Build source | Container port | Published to host | Purpose |
|---|---|---:|---|---|
| `nginx` | `./nginx` (`nginx:alpine`) | 80 | **Yes, 80** | Single entry point and reverse proxy |
| `frontend` | `./frontend` (`node:22-alpine` build, `nginx:alpine` runtime) | 80 | No | Serves the built React application |
| `backend` | `./backend` (`python:3.12-slim`) | 5000 | No | Flask REST API, run by gunicorn |
| `postgres` | `postgres:16-alpine` | 5432 | No | PostgreSQL database with the `postgres_data` volume |

The backend and PostgreSQL are reachable only inside the Compose network.

## 1. Environment files

Create both files from the templates and keep them out of Git:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

**Root `.env`** provides database settings to Compose:

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Bootstrap and migration account. Not passed to the backend |
| `POSTGRES_PASSWORD` | `postgres` | Password for the bootstrap account |
| `POSTGRES_DB` | `postgres`, `backend` | Database name |
| `POSTGRES_APP_USER` | `backend` | Restricted runtime account |
| `POSTGRES_APP_PASSWORD` | `backend` | Runtime password, at least 32 characters, not a placeholder |

Compose stops at startup if any of these is missing.

**`backend/.env`** provides application secrets, loaded into the backend:

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Flask secret. At least 32 characters, not a placeholder |
| `JWT_SECRET` | JWT signing key. Must differ from `SECRET_KEY` |

`POSTGRES_*` values in `backend/.env` are overridden by Compose, so the backend always uses the root `.env` runtime account.

## 2. Start, check, and stop

```bash
docker compose up -d --build
docker compose ps
curl -i http://localhost/api/health
curl -i http://localhost/api/health/db
docker compose down
```

`docker compose down` keeps the database volume. `docker compose down -v` deletes it, and **all local data with it**.

Open the application at http://localhost/.

## 3. Images

**Backend** (`backend/Dockerfile`): installs `requirements.txt`, copies the source, runs as the unprivileged user `appuser`, and starts `gunicorn --bind 0.0.0.0:5000 app:app`. A `.dockerignore` file excludes local `.env` files, which CI verifies.

**Frontend** (`frontend/Dockerfile`): builds the React application with Vite and serves the output with nginx. `frontend/nginx.conf` returns `index.html` for unknown paths, so client-side routes work on refresh.

**Nginx** (`nginx/Dockerfile`): copies `nginx/default.conf` into `nginx:alpine`.

## 4. Database initialization

Compose mounts the migrations into PostgreSQL's init directory, in order:

- `001_initial_schema.sql`
- `002_user_settings.sql`
- `003_budget_uniqueness.sql`
- `004_restrict_category_budget_delete.sql`
- `005_user_phone.sql`
- `006_app_runtime_role.sql`

PostgreSQL runs these only when it creates a new volume. Existing databases are updated by the AWS deployment workflow, which applies 002 to 006 explicitly. See [database/README.md](../database/README.md) for the account model and migration rules.

Migration 003 stops if duplicate legacy budgets exist, so resolve them before retrying.

## 5. Health checks and restart policy

Every service has a health check, and every service uses `restart: unless-stopped`.

| Service | Check |
|---|---|
| `frontend` | HTTP request to `http://127.0.0.1/` |
| `backend` | HTTP request to `http://localhost:5000/health` |
| `postgres` | `pg_isready` for the bootstrap database and user |
| `nginx` | HTTP request to `http://127.0.0.1/api/health` |

`restart: unless-stopped` restarts containers after a Docker daemon restart. It does not prove that the public site is available after an EC2 reboot. Test recovery on the host.

## 6. Logs and inspection

```bash
docker compose logs -f backend
docker compose logs nginx
docker exec -it expense-backend sh
docker exec -it expense-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Use the bootstrap account for database inspection. The backend itself uses the runtime account.

## 7. Continuous integration and delivery

CI builds the backend, frontend, and Nginx images without pushing, and checks that local `.env` files are not packaged. CD publishes the backend and frontend images to GHCR, tagged with the commit SHA, and the AWS host pulls those tags. The Nginx image is built on the host from the deployed commit. See [CI/CD](ci-cd.md).

## 8. Troubleshooting

| Symptom | Check |
|---|---|
| Compose refuses to start | A required variable is missing from the root `.env` or `backend/.env` |
| Backend exits at startup | `SECRET_KEY` or `JWT_SECRET` is missing, too short, a placeholder, or equal to the other |
| Backend cannot reach the database | Runtime variables match migration 006. The host must be `postgres`, not `localhost` |
| `/api/health/db` fails | Backend logs and the runtime credentials |
| Nginx is unhealthy | `docker compose logs nginx`, then both health URLs |
| Port 80 is in use | Change the left-hand port in `docker-compose.yml`, for example `"8081:80"`, and use that URL |
| Changes do not appear | Rebuild the affected service: `docker compose up -d --build <service>` |
