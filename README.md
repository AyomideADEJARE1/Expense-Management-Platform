# Expense Management Platform

A full-stack Personal Expense Management Platform built with **React, Flask, PostgreSQL, Docker, Nginx, CI/CD, and Azure**, with a focus on cloud architecture, DevOps, security, monitoring, and automated deployment.

## Architecture

The application uses Nginx as the reverse proxy between the client, frontend, and backend services.

```text
                    Browser
                       │
                       ▼
                 ┌───────────┐
                 │   Nginx   │
                 │   :8080   │
                 └─────┬─────┘
                       │
             ┌─────────┴─────────┐
             │                   │
          / (frontend)       /api/* (backend)
             │                   │
             ▼                   ▼
      ┌─────────────┐     ┌─────────────┐
      │ React/Vite  │     │ Flask API   │
      │   :80       │     │    :5000    │
      └─────────────┘     └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ PostgreSQL  │
                          │    :5432    │
                          └─────────────┘
```

## Services

| Service | Technology | Internal Port | Purpose |
|---|---|---:|---|
| `nginx` | Nginx | 80 | Reverse proxy and entry point |
| `frontend` | React + Vite + Nginx | 80 | User interface |
| `backend` | Flask | 5000 | REST API and application logic |
| `postgres` | PostgreSQL 16 | 5432 | Application database |

The application is exposed locally through Nginx on:

```text
http://localhost:8080
```

## Nginx Routing

Nginx provides a single entry point for the application.

### Frontend

Requests to:

```text
/
```

are forwarded to the React frontend container.

### Backend API

Requests to:

```text
/api/*
```

are forwarded to the Flask backend.

For example:

```text
/api/health
/api/auth/login
/api/expenses
/api/categories
/api/budgets
```

The `/api/health` route is mapped to the backend `/health` endpoint.

## Prerequisites

Install the following before running the application:

- Docker
- Docker Compose

Verify the installation:

```bash
docker --version
docker compose version
```

## Running the Application

From the project root:

```bash
docker compose up --build
```

To run the application in the background:

```bash
docker compose up --build -d
```

Once the containers are running, open:

```text
http://localhost:8080
```

## Health Checks

Check that Nginx can reach the Flask backend:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{"status":"ok"}
```

The protected expenses endpoint can also be tested:

```bash
curl -i http://localhost:8080/api/expenses
```

When no authentication token is provided, the expected response is:

```text
401 UNAUTHORIZED
```

This confirms that the request reached the real Flask API and that authentication protection is active.

## Database Configuration

The Docker Compose integration provides a PostgreSQL 16 container for local development and integration testing.

Default development configuration:

```text
Database: expense_db
User: expense_user
Host: postgres
Port: 5432
```

The backend receives its database connection configuration through environment variables:

```text
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

The PostgreSQL data is persisted using the Docker volume:

```text
postgres_data
```

> The credentials in `docker-compose.yml` are development-only credentials and must not be used for production deployments.

## Frontend API Configuration

The React frontend uses:

```text
VITE_API_BASE_URL=/api
```

This allows browser requests to go through Nginx instead of connecting directly to the Flask container.

For example:

```text
React application
      │
      ▼
/api/expenses
      │
      ▼
Nginx
      │
      ▼
Flask backend
```

## Useful Docker Commands

View running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs
```

View logs for a specific service:

```bash
docker compose logs nginx
docker compose logs frontend
docker compose logs backend
docker compose logs postgres
```

Stop the application:

```bash
docker compose down
```

Stop the application and remove the development database volume:

```bash
docker compose down -v
```

Rebuild the containers:

```bash
docker compose build
```

## Project Structure

```text
.
├── backend/
│   ├── app.py
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── nginx/
│   ├── Dockerfile
│   └── default.conf
│
├── database/
│   ├── migrations/
│   ├── schema/
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   └── security.md
│
└── docker-compose.yml
```

## Integration Status

The Docker Compose environment integrates the real application components:

- React frontend
- Flask backend
- PostgreSQL database
- Nginx reverse proxy

The integration has been tested through the Nginx entry point using:

```text
GET /
GET /api/health
GET /api/expenses
```

The expected flow is:

```text
Client → Nginx → React
Client → Nginx → Flask → PostgreSQL
```

This setup provides the foundation for further deployment to Azure and production-oriented CI/CD workflows.
CI test: nginx branch workflow trigger verification.
