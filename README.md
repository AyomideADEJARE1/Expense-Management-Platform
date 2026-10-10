# Expense Management Platform

A full-stack expense management application built with React, Flask, PostgreSQL, Docker, and Nginx.

## Current Architecture

Internet -> Cloudflare / HTTPS -> AWS EC2 Ubuntu -> Docker Compose -> Nginx -> React/Flask -> PostgreSQL 16.

The browser reaches the application through Nginx. PostgreSQL is internal to the Docker network.

## Main Features

- User registration and JWT authentication
- Password hashing and authorization
- User-specific expense data
- Expense CRUD operations
- Expense categories and budgets
- Monthly summaries and charts
- Filtering and CSV export
- Application/database health checks
- API rate limiting
- Dockerized application stack
- Nginx reverse proxy
- Production HTTPS access

## Technology Stack

- Frontend: React, Vite, Tailwind CSS, Lucide React
- Backend: Python, Flask, SQLAlchemy, Psycopg, Flask-JWT-Extended, Flask-Limiter
- Database: PostgreSQL 16
- Infrastructure: Docker Compose, Nginx, AWS EC2, Cloudflare, Let's Encrypt/Certbot

## Local Development

    docker compose up -d --build
    docker compose ps

The current Compose configuration publishes Nginx on host port 80:

    http://localhost

Health:

    curl http://localhost/api/health
    curl http://localhost/api/health/db

Older documentation referred to localhost:8080. That is no longer the current Compose port mapping.

## Production

The current production environment runs on AWS EC2 Ubuntu.

Production domain: https://expense-tracker.live

Cloudflare provides the public DNS/proxy layer. HTTPS is active and certificate management uses Let's Encrypt/Certbot in the deployment environment.

The repository Docker Nginx configuration listens on port 80. Production domain/TLS handling is surrounding deployment infrastructure, not nginx/default.conf itself.

### Updating the application

Normal code changes do not require recreating the EC2 instance, domain, or TLS configuration.

Typical update:

    cd ~/Expense-Management-Platform
    git pull --ff-only
    docker compose build
    docker compose up -d
    docker compose ps
    curl http://localhost/api/health

Then verify the public site.

## CI/CD

GitHub Actions provides CI for secret scanning, database migration checks, backend checks, frontend checks/builds, and Docker builds.

The CD workflow can publish images to GitHub Container Registry and contains a configurable Azure deployment job. Azure is not the current production environment. The actual production deployment is AWS EC2.

A green CI run or image publication must not be described as proof of production deployment unless AWS deployment was performed and verified.

## Health Endpoints

- GET /health
- GET /health/db
- GET /api/health
- GET /api/health/db

## Security

Never commit real .env files, passwords, JWT/Flask secrets, API keys, cloud credentials, or private keys.

Development database credentials must not be reused as production secrets.
