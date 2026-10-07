# Docker Documentation

This document describes the project's Docker and Docker Compose configuration for local development and application integration.

The project runs four services:

```text
Browser
   |
   v
Nginx :8080
   |
   +--------------------+
   |                    |
   v                    v
Frontend :80         Backend :5000
                          |
                          v
                    PostgreSQL :5432
```

Nginx is the application's host-facing entry point. The frontend, backend, and PostgreSQL services communicate over the Docker Compose network.

---

## 1. Docker Components

| Service | Build / Image | Internal Port | Purpose |
|---|---|---:|---|
| `frontend` | `./frontend` | 80 | Builds and serves the React application |
| `backend` | `./backend` | 5000 | Runs the Flask API |
| `postgres` | `postgres:16-alpine` | 5432 | Stores application data |
| `nginx` | `./nginx` | 80 | Reverse proxy and application entry point |

Only Nginx publishes a host port:

```text
localhost:8080
```

The backend and PostgreSQL ports are not directly published to the host.

---

## 2. Docker Compose

The main Docker configuration is:

```text
docker-compose.yml
```

The Compose file defines:

- `frontend`
- `backend`
- `postgres`
- `nginx`

It also defines the persistent PostgreSQL volume:

```text
postgres_data
```

Start the complete stack with:

```bash
docker compose up -d --build
```

Check the service status:

```bash
docker compose ps
```

The application is then available at:

```text
http://localhost:8080
```

Stop the stack:

```bash
docker compose down
```

Stopping the stack this way does not remove the PostgreSQL named volume.

---

## 3. Frontend Docker Image

The frontend uses a multi-stage Docker build.

The build stage uses:

```text
node:22-alpine
```

The production stage uses:

```text
nginx:alpine
```

The build process:

1. Copies `package.json` and `package-lock.json`.
2. Installs dependencies with `npm ci`.
3. Copies the frontend source.
4. Sets `VITE_API_BASE_URL=/api`.
5. Builds the React application with `npm run build`.
6. Copies the generated `dist` directory into the Nginx image.

The resulting container serves the production frontend on port `80`.

The frontend Dockerfile is:

```text
frontend/Dockerfile
```

The frontend's internal Nginx configuration is:

```text
frontend/nginx.conf
```

### Frontend API path

The frontend is configured to use:

```text
/api
```

for backend requests.

This allows the browser to communicate through the main Nginx reverse proxy rather than directly addressing the Flask container.

---

## 4. Backend Docker Image

The backend uses:

```text
python:3.12-slim
```

The Dockerfile:

1. Sets `/app` as the working directory.
2. Copies `requirements.txt`.
3. Installs Python dependencies.
4. Copies the backend source.
5. Exposes port `5000`.
6. Starts Flask on `0.0.0.0:5000`.

The backend Dockerfile is:

```text
backend/Dockerfile
```

The container runs:

```bash
flask --app app run --host=0.0.0.0 --port=5000
```

The backend is accessible to other containers as:

```text
backend:5000
```

It is not directly published to the host.

---

## 5. Backend Environment

Docker Compose loads the backend environment from:

```text
backend/.env
```

This file must remain untracked.

Compose also provides the PostgreSQL connection configuration:

```text
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=expense_user
POSTGRES_PASSWORD=expense_password
POSTGRES_DB=expense_db
```

The hostname is `postgres` because Docker Compose provides service-name DNS within the Compose network.

The backend should therefore connect to:

```text
postgres:5432
```

rather than `localhost:5432`.

---

## 6. PostgreSQL Container

PostgreSQL uses:

```text
postgres:16-alpine
```

The local development database configuration is:

```text
Database: expense_db
User:     expense_user
Password: expense_password
Port:     5432
```

These are development credentials and must not be reused as production credentials.

The PostgreSQL container is named:

```text
expense-postgres
```

---

## 7. Database Initialization

The Compose configuration mounts:

```text
database/migrations/001_initial_schema.sql
```

into:

```text
/docker-entrypoint-initdb.d/001_initial_schema.sql
```

The migration is mounted read-only.

PostgreSQL executes initialization scripts from this directory when a new database cluster is created.

This means the initial application schema is automatically created when the PostgreSQL data volume is initialized for the first time.

---

## 8. PostgreSQL Persistence

PostgreSQL uses the named Docker volume:

```text
postgres_data
```

mounted at:

```text
/var/lib/postgresql/data
```

Normal container recreation therefore does not delete the database.

For example:

```bash
docker compose down
docker compose up -d
```

preserves the database stored in `postgres_data`.

### Resetting the database

To completely recreate the local database:

```bash
docker compose down -v
docker compose up -d
```

The `-v` option removes the Compose-managed volumes.

**Warning:** this deletes the existing local PostgreSQL data.

---

## 9. Nginx Container

The Nginx reverse proxy is built from:

```text
nginx/Dockerfile
```

which uses:

```text
nginx:alpine
```

The configuration is:

```text
nginx/default.conf
```

The container listens on port:

```text
80
```

Docker Compose maps:

```text
8080:80
```

Therefore:

```text
Host:      localhost:8080
Container: nginx:80
```

---

## 10. Nginx Routing

The Nginx configuration defines two upstream services:

```text
frontend → frontend:80
backend  → backend:5000
```

Requests are routed as follows:

```text
/api/health
    ↓
backend/health
```

```text
/api/*
    ↓
backend:5000
```

```text
/*
    ↓
frontend:80
```

The resulting request flow is:

```text
Browser
   |
   v
localhost:8080
   |
   v
Nginx
   |
   +---- /api/* ------> Flask backend
   |
   +---- everything --> React frontend
```

---

## 11. Container Networking

Docker Compose provides service-name DNS within the application network.

Services communicate using their Compose service names.

Examples:

```text
backend → postgres:5432
nginx   → backend:5000
nginx   → frontend:80
```

The containers should therefore use service names rather than host-specific addresses.

For example:

```text
POSTGRES_HOST=postgres
```

is correct inside the backend container.

---

## 12. Published Ports

The current Compose configuration publishes only Nginx:

| Service | Container Port | Host Port |
|---|---:|---:|
| Frontend | 80 | Not published |
| Backend | 5000 | Not published |
| PostgreSQL | 5432 | Not published |
| Nginx | 80 | 8080 |

This keeps the application services behind the Nginx entry point.

---

## 13. Health Checks

All four services have Docker health checks.

### Frontend

Checks:

```text
http://127.0.0.1/
```

### Backend

Checks:

```text
http://localhost:5000/health
```

### PostgreSQL

Uses:

```bash
pg_isready -U expense_user -d expense_db
```

### Nginx

Checks:

```text
http://127.0.0.1/api/health
```

Check service health with:

```bash
docker compose ps
```

A correctly running local stack should report all four services as healthy.

---

## 14. Service Startup Dependencies

The backend waits for PostgreSQL to become healthy:

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

Nginx waits for both the frontend and backend:

```yaml
depends_on:
  frontend:
    condition: service_healthy
  backend:
    condition: service_healthy
```

This prevents dependent services from starting normal operation before their required services report healthy.

---

## 15. Common Docker Commands

### Start

```bash
docker compose up -d
```

### Start and rebuild

```bash
docker compose up -d --build
```

### Stop

```bash
docker compose down
```

### Check services

```bash
docker compose ps
```

### View all logs

```bash
docker compose logs
```

### Follow logs

```bash
docker compose logs -f
```

### View one service's logs

```bash
docker compose logs backend
```

```bash
docker compose logs frontend
```

```bash
docker compose logs postgres
```

```bash
docker compose logs nginx
```

### Rebuild one service

```bash
docker compose up -d --build backend
```

or:

```bash
docker compose up -d --build frontend
```

---

## 16. Container Access

Open a shell in the backend:

```bash
docker exec -it expense-backend /bin/bash
```

Open a shell in the frontend:

```bash
docker exec -it expense-frontend /bin/sh
```

Open a shell in Nginx:

```bash
docker exec -it expense-nginx /bin/sh
```

Connect directly to PostgreSQL:

```bash
docker exec -it expense-postgres \
  psql -U expense_user -d expense_db
```

---

## 17. Database Verification

List the PostgreSQL tables:

```bash
docker exec expense-postgres \
  psql -U expense_user -d expense_db -c "\dt"
```

The current application schema contains:

```text
budgets
expense_categories
expenses
monthly_expense_summary
users
```

Test backend-to-database connectivity:

```bash
docker exec expense-backend python -c \
"from app import app, db; app.app_context().push(); db.session.execute(db.text('SELECT 1')); print('Database connection: OK')"
```

Expected result:

```text
Database connection: OK
```

---

## 18. Application Health Verification

Test the public Nginx health endpoint:

```bash
curl http://localhost:8080/api/health
```

The backend's internal health endpoint is:

```text
/health
```

and Nginx exposes it externally as:

```text
/api/health
```

The backend response is:

```json
{
  "status": "ok"
}
```

---

## 19. Development Workflow

A typical Docker development cycle is:

```text
Modify source
    ↓
Rebuild affected service
    ↓
Restart service
    ↓
Check health
    ↓
Check logs
    ↓
Test through localhost:8080
```

For a backend change:

```bash
docker compose up -d --build backend
```

For a frontend change:

```bash
docker compose up -d --build frontend
```

For changes affecting the complete stack:

```bash
docker compose up -d --build
```

---

## 20. Troubleshooting

| Problem | What to check |
|---|---|
| Container fails to start | Run `docker compose logs <service>`. |
| Backend cannot reach PostgreSQL | Confirm `POSTGRES_HOST=postgres` and check PostgreSQL health. |
| Tables are missing | Check whether the PostgreSQL volume was initialized before the migration was added. |
| Frontend cannot reach API | Confirm the frontend uses `/api` and Nginx routes `/api/` to the backend. |
| Nginx returns an error | Check `docker compose logs nginx` and verify the upstream service names. |
| Service is unhealthy | Run `docker compose ps` and inspect that service's logs. |
| Port 8080 is already in use | Stop the process using port 8080 or change the host-side port mapping. |
| Changes are not appearing | Rebuild the affected service with `docker compose up -d --build <service>`. |
| Local database needs a full reset | Use `docker compose down -v` followed by `docker compose up -d`. |

---

## 21. Docker Security

The current Docker configuration is primarily intended for development and project integration.

Important considerations:

- `backend/.env` must not be committed.
- Development database credentials must not be reused in production.
- PostgreSQL is not directly published to the host.
- The backend is not directly published to the host.
- Nginx is the host-facing application entry point.
- Production credentials should be supplied through protected configuration or secret management.
- Container dependencies should be kept updated.
- Production images and configuration should be reviewed separately from the local development stack.

---

## 22. Docker and CI/CD

The GitHub Actions CI workflow validates the Dockerfiles by building the backend and frontend images without pushing them.

The Docker build validation checks:

```text
backend/Dockerfile
frontend/Dockerfile
```

The CD workflow separately publishes images to GitHub Container Registry when its conditions are met.

See [CI/CD documentation](ci-cd.md) for the complete pipeline.

---

## 23. Local Docker vs Production

The current Compose configuration is the project's **local/integration environment**.

The repository also contains a configurable CD workflow for publishing images and deploying to an Azure VM.

The Azure deployment should not be considered an active production deployment until the following have been configured and verified:

- Production environment variables.
- Production database credentials.
- GHCR image configuration.
- Azure VM configuration.
- Docker Compose production configuration.
- Nginx public routing.
- Deployment secrets.
- Production health checks.

Local development credentials and local Docker settings must not simply be reused as production configuration.

---

## 24. Related Documentation

- [Architecture](architecture.md)
- [CI/CD](ci-cd.md)
- [Security](security.md)
- [Database](../database/README.md)
- [Backend](../backend/README.md)
