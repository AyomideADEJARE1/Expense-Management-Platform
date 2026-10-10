# System Architecture

The implemented platform consists of React, Nginx, Flask, PostgreSQL 16, and Docker Compose.

Current production runs on AWS EC2 Ubuntu. Cloudflare provides the public DNS/proxy layer and HTTPS is active.

## Architecture

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

Database: expense_db
User: expense_user
Host: postgres
Port: 5432
Version: PostgreSQL 16
Volume: postgres_data

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

The main branch is the source of truth for the implemented application. Azure is not the current production target.
