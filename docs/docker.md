# Docker Documentation

Docker Compose provides the containerized environment used for local development, integration testing, and the current AWS EC2 deployment.

## Services

| Service | Build/Image | Internal Port | Purpose |
|---|---|---:|---|
| frontend | ./frontend | 80 | React |
| backend | ./backend | 5000 | Flask API |
| postgres | postgres:16-alpine | 5432 | Database |
| nginx | ./nginx | 80 | Reverse proxy |

Current published port: 80:80.

## Start

    docker compose up -d --build
    docker compose ps

Local application: http://localhost

Health:

    curl http://localhost/api/health
    curl http://localhost/api/health/db

## Dependencies

PostgreSQL must be healthy before the backend starts. Nginx depends on healthy frontend and backend services.

## Persistence

PostgreSQL uses the postgres_data volume and initializes from database/migrations/001_initial_schema.sql.

Initialization scripts run for a new PostgreSQL data directory and are not rerun on every restart.

## Development Reset

    docker compose down -v
    docker compose up -d

Warning: down -v deletes the database volume and its data. Do not use it as a routine production restart.

## Rebuild

    docker compose up -d --build

A normal application update does not require recreating EC2, the domain, or TLS.

## Production

Production runs on AWS EC2 Ubuntu using the same Compose application.

The surrounding environment includes Cloudflare, expense-tracker.live, HTTPS, and Let's Encrypt/Certbot.

The repository Nginx configuration remains HTTP port 80; TLS/domain handling is deployment infrastructure around the container.
