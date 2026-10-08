# Expense Management Platform

A full-stack Personal Expense Management Platform built with **React, Flask, PostgreSQL, Docker, Nginx, GitHub Actions, and Azure deployment preparation**.

The project demonstrates full-stack application development, REST API design, authentication, database integration, containerization, reverse proxy configuration, CI/CD, security practices, testing, and cloud deployment preparation.

## Architecture

The application uses Nginx as the single entry point between the browser, frontend, and backend services.

```text
                         Browser
                            │
                            ▼
                    ┌─────────────┐
                    │    Nginx    │
                    │    :8080    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
          / (frontend)             /api/* (backend)
              │                         │
              ▼                         ▼
      ┌───────────────┐        ┌───────────────┐
      │ React + Vite  │        │  Flask REST   │
      │  Nginx :80    │        │    API :5000  │
      └───────────────┘        └───────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ PostgreSQL 16│
                                │    :5432     │
                                └──────────────┘
```

## Services

| Service | Technology | Internal Port | Purpose |
|---|---|---:|---|
| `nginx` | Nginx | 80 | Reverse proxy and application entry point |
| `frontend` | React + Vite + Nginx | 80 | User interface |
| `backend` | Flask | 5000 | REST API and application logic |
| `postgres` | PostgreSQL 16 | 5432 | Application database |

The application is exposed locally through Nginx at:

```text
http://localhost:8080
```

## Application Features

### Authentication

- User registration
- User login
- JWT-based authentication
- Authenticated user information
- Password hashing
- Authentication rate limiting
- Protected API endpoints

The application uses stateless JWT authentication. There is currently no server-side logout endpoint; client-side logout is handled by removing the stored authentication token.

### Expense Management

- Create expenses
- View expenses
- Update expenses
- Delete expenses
- Filter expenses by category
- Filter expenses by month
- Export expenses to CSV

### Categories

- Create categories
- View categories
- Update categories
- Delete categories

### Budgets

- Create budgets
- View budgets
- Update budgets
- Delete budgets
- Monthly and category-based budget management

### Reports and Summaries

- Monthly expense summaries
- Category-based expense summaries
- Dashboard reporting and charts

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

The health endpoint is specifically mapped as:

```text
/api/health
        ↓
backend /health
```

This allows the complete application path to be tested through Nginx.

See [`docs/nginx.md`](docs/nginx.md) for the detailed Nginx configuration.

## Prerequisites

Install:

- Docker
- Docker Compose

Verify the installation:

```bash
docker --version
docker compose version
```

## Configuration

The repository provides example environment configuration files.

For local development, the backend uses a local `.env` file.

Example:

```text
SECRET_KEY=your-local-development-secret
```

The `.env` file must not be committed to Git.

Docker Compose supplies the PostgreSQL connection settings to the backend through:

```text
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

The current Docker Compose database configuration is:

```text
Host: postgres
Port: 5432
Database: expense_db
User: expense_user
```

These credentials are for local development only and must not be reused for production.

## Running the Application

From the project root:

```bash
docker compose up --build -d
```

Check the service status:

```bash
docker compose ps
```

The frontend, backend, PostgreSQL, and Nginx services should become healthy.

Open the application:

```text
http://localhost:8080
```

## Database Initialization

The PostgreSQL service mounts the initial migration:

```text
database/migrations/001_initial_schema.sql
```

into PostgreSQL's initialization directory.

For a **new PostgreSQL Docker volume**, PostgreSQL automatically executes this migration during initialization.

To recreate the development database from the initial schema:

```bash
docker compose down -v
docker compose up --build -d
```

> `docker compose down -v` removes the development PostgreSQL volume and therefore deletes the existing local database data.

Verify the database tables:

```bash
docker exec expense-postgres \
  psql -U expense_user -d expense_db -c "\dt"
```

Expected tables include:

```text
budgets
expense_categories
expenses
monthly_expense_summary
users
```

See [`database/README.md`](database/README.md) for more information.

## Health Checks

Check the application through Nginx:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{"status":"ok"}
```

The backend database health endpoint can also be tested through Nginx:

```bash
curl http://localhost:8080/api/health/db
```

An authenticated endpoint without a token should return `401 UNAUTHORIZED`:

```bash
curl -i http://localhost:8080/api/expenses
```

This confirms that the request reaches the Flask API and that authentication protection is active.

## Useful Docker Commands

View running services:

```bash
docker compose ps
```

View all logs:

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

Follow backend logs:

```bash
docker compose logs -f backend
```

Stop the application:

```bash
docker compose down
```

Rebuild images:

```bash
docker compose build
```

Restart the application:

```bash
docker compose up -d
```

Remove containers and the development database volume:

```bash
docker compose down -v
```

See [`docs/docker.md`](docs/docker.md) for detailed Docker and Compose documentation.

## Frontend API Configuration

The frontend uses:

The frontend defaults to `/api` for backend requests. The `VITE_API_BASE_URL` environment variable can be used to override this default when needed.

This allows browser requests to use the same Nginx entry point as the frontend instead of connecting directly to the Flask container.

The request flow is:

```text
React
  │
  ▼
/api/expenses
  │
  ▼
Nginx
  │
  ▼
Flask API
  │
  ▼
PostgreSQL
```

The browser does not connect directly to PostgreSQL.

## Project Structure

```text
.
├── backend/
│   ├── app.py
│   ├── extensions.py
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── docs/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
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
│   ├── ci-cd.md
│   ├── security.md
│   ├── docker.md
│   └── nginx.md
│
├── .github/
│   └── workflows/
│
├── CONTRIBUTING.md
├── docker-compose.yml
└── README.md
```

## CI/CD

GitHub Actions are used for automated validation and CI/CD workflows.

Current CI work includes:

- Backend linting
- Frontend linting
- Frontend build validation
- Docker/Compose integration
- Service health checks
- Pull request validation

Azure deployment is part of the planned deployment workflow but should not be considered completed until the Azure deployment work has been fully implemented and verified.

See [`docs/ci-cd.md`](docs/ci-cd.md) for details.

## Documentation

| Document | Purpose |
|---|---|
| `README.md` | Project overview and quick start |
| `CONTRIBUTING.md` | Development and pull request workflow |
| `backend/README.md` | Backend API and development documentation |
| `backend/docs/troubleshooting.md` | Backend troubleshooting history |
| `database/README.md` | Database setup and schema |
| `docs/architecture.md` | System architecture |
| `docs/security.md` | Security implementation and practices |
| `docs/docker.md` | Docker and Compose operations |
| `docs/nginx.md` | Nginx reverse proxy configuration |
| `docs/ci-cd.md` | CI/CD workflows and deployment |

## Current Integration Status

The integrated application currently contains:

- React frontend
- Flask REST API
- PostgreSQL 16
- Nginx reverse proxy
- Docker Compose health checks
- PostgreSQL initialization on a fresh Docker volume
- JWT authentication
- Expense CRUD operations
- Category management
- Budget management
- Monthly expense summaries
- Category-based summaries
- Expense filtering
- CSV export

The integrated environment has been tested through the Nginx entry point for:

```text
Frontend access
API health
Database connectivity
Authentication
Categories
Expenses
Expense filtering
Monthly summaries
Category summaries
CSV export
```

Further QA and Azure deployment remain part of the project's continuing work.

## Development Workflow

Development should be performed through feature branches and pull requests.

Typical workflow:

```text
Create feature branch
        ↓
Implement change
        ↓
Test locally
        ↓
Commit changes
        ↓
Push branch
        ↓
Open Pull Request
        ↓
CI validation
        ↓
Code review
        ↓
Merge
```

Changes should not be pushed directly to protected branches.

## License

This project is currently intended as a development and portfolio project.
