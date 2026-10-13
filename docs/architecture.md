# Expense Tracker — System Architecture

The Enhanced Personal Expense Management Platform is a React, Nginx, Flask, PostgreSQL 16, and Docker Compose application. AWS EC2 is the approved deployment target.

The approved deployment target is AWS EC2 Ubuntu. The documented topology places Cloudflare in front of the application for public DNS/proxying and HTTPS. The current live deployment, DNS, certificate status, and public health responses must be verified before they are reported as operational.

## Architecture

![Expense Tracker system architecture](Expense%20Platform%20System%20Architecture.png)

    Internet
       |
    Cloudflare / HTTPS
       |
    AWS EC2
       |
    Nginx :80
       |----------------|
       v                v
    React :80       Flask :5000
                        |
                        v
                  PostgreSQL :5432

PostgreSQL is internal to the Docker network.

## Services

| Service | Container | Port | Responsibility |
|---|---|---:|---|
| Nginx | expense-nginx | 80 | Entry point/reverse proxy |
| Frontend | expense-frontend | 80 | React UI |
| Backend | expense-backend | 5000 | Flask API |
| PostgreSQL | expense-postgres | 5432 | Persistent data |

The current docker-compose.yml publishes Nginx as 80:80. Earlier documentation describing 8080:80 is stale.

## Request Flow

Browser -> Nginx -> Flask -> PostgreSQL for API requests.

Browser -> Nginx -> React for frontend requests.

The /api/health route maps to backend /health.

## Database

Database: configured by `POSTGRES_DB` in the protected root `.env`
Bootstrap/migration user: configured by `POSTGRES_USER`
Application runtime user: configured separately by `POSTGRES_APP_USER`
Host: `postgres`
Port: `5432`
Version: PostgreSQL 16
Volume: `postgres_data`

Initial schema: database/migrations/001_initial_schema.sql.

## Health Checks

- /health
- /health/db
- /api/health
- /api/health/db

## Production

Cloudflare -> expense-tracker.live -> AWS EC2 Ubuntu -> Docker Compose -> Nginx/React/Flask/PostgreSQL.

Let's Encrypt/Certbot manages the production certificate in the deployment environment.

The repository Nginx container is HTTP-only on port 80; production TLS/domain handling is surrounding infrastructure.

The browser reaches the app through Nginx. Nginx serves React and routes `/api/*` to Flask. PostgreSQL remains private to the Docker Compose network. Only Nginx is published on host port `80` by the current Compose file.

## CI/CD release path

GitHub Actions validates the source, applies database migration checks, runs backend and frontend checks, and builds the container images. The configurable CD workflow publishes commit-tagged images to GHCR and can deploy to AWS EC2 when `DEPLOY_ENABLED=true` and the required protected AWS/GHCR credentials are configured. The workflow waits for PostgreSQL, applies migrations `002` through `006`, restarts application services only after migrations succeed, and checks both public health endpoints.

A passing CI run does not prove that the latest commit is live. Release evidence should record the deployed commit/image and successful public health and browser checks.
