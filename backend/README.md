# Expense Management Platform — Backend

## Overview

The backend of the Expense Management Platform provides the REST API and server-side functionality for managing users, expenses, categories, budgets, and expense summaries.

The backend is built with **Flask, SQLAlchemy, Psycopg, and PostgreSQL** and is accessed by the React frontend through the Nginx reverse proxy.

---

## Technology Stack

- Python 3.12
- Flask
- Flask-SQLAlchemy
- SQLAlchemy
- PostgreSQL 16
- Psycopg
- Flask-JWT-Extended
- Flask-Limiter
- python-dotenv

---

## Backend Responsibilities

The backend is responsible for:

- User registration and authentication
- Password hashing
- JWT-based authentication
- Expense management
- Expense filtering
- CSV expense export
- Category management
- Budget management
- Monthly expense summaries
- Category-based expense summaries
- PostgreSQL database communication using a restricted runtime account
- Input validation
- Error handling
- API rate limiting
- Application health checks
- Database health checks

---

## Architecture

The backend is part of the following application architecture:

```text
Browser
   |
   v
Nginx Reverse Proxy :80
   |
   +----------------------+
   |                      |
   v                      v
React Frontend         Flask REST API
                           |
                           | SQLAlchemy / Psycopg
                           v
                     PostgreSQL 16
                         :5432
```

The frontend communicates with the Flask REST API through Nginx.

The Flask backend communicates with PostgreSQL through SQLAlchemy and Psycopg.

The frontend does not communicate directly with PostgreSQL.

### API Routing

Nginx exposes the backend through:

```text
/api/*
```

For example:

```text
/api/auth/login
/api/auth/me
/api/categories
/api/expenses
/api/budgets
/api/summaries/monthly
```

The backend itself exposes:

```text
/health
/health/db
```

Nginx maps:

```text
/api/health
/api/health/db
```

to:

```text
/health
/health/db
```

on the Flask backend.

---

## Project Structure

```text
backend/
│
├── docs/
│   └── troubleshooting.md
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── category.py
│   ├── expense.py
│   ├── budget.py
│   └── monthly_summary.py
│
├── routes/
│   ├── auth.py
│   ├── categories.py
│   ├── expenses.py
│   ├── budgets.py
│   └── summaries.py
│
├── utils/
│   └── responses.py
│
├── app.py
├── extensions.py
├── requirements.txt
├── .env.example
└── README.md
```

### Directory Responsibilities

| Directory/File | Purpose |
|---|---|
| `models/` | SQLAlchemy database models |
| `routes/` | REST API endpoints |
| `utils/` | Shared backend utilities |
| `docs/` | Backend development and troubleshooting documentation |
| `app.py` | Flask application configuration and entry point |
| `extensions.py` | Flask-SQLAlchemy and Flask-Limiter extensions |
| `requirements.txt` | Python dependencies |
| `.env.example` | Example environment configuration |
| `README.md` | Backend documentation |

---

## Environment Configuration

The backend uses environment variables for application configuration and database credentials.

For local development, create a `.env` file in the `backend/` directory from `.env.example`. Set `SECRET_KEY` and `JWT_SECRET` to two different values of at least 32 characters. Do not reuse database passwords as signing keys.

When running through Docker Compose, the database connection is supplied from the root `.env`. The backend receives only the restricted runtime account (`POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD`). The bootstrap password is not passed to the backend container.

Do not use development credentials in production.

> Never commit real passwords, secret keys, tokens, or other credentials to Git.

The `.env` file should remain excluded from version control.

---

## Database

The backend uses **PostgreSQL 16**.

The Flask application communicates with PostgreSQL through SQLAlchemy and Psycopg. The Compose service name is `postgres`, on port `5432`, and it is reachable only inside the Docker network.

The main database entities include:

- Users
- Expense categories
- Expenses
- Budgets
- Monthly expense summaries

Financial amounts use PostgreSQL numeric types to preserve monetary precision.

### Database Initialization

The Docker Compose configuration mounts:

```text
database/migrations/001_initial_schema.sql
```

into PostgreSQL's initialization directory.

When a new PostgreSQL volume is created, PostgreSQL automatically executes this migration during database initialization. Later migrations are applied by the deployment workflow.

To recreate a local development database from the initial schema:

```bash
docker compose down -v
docker compose up --build -d
```

> `docker compose down -v` removes the PostgreSQL Docker volume and deletes existing local database data.

---

## Running the Backend Locally

From the backend directory, create and activate a Python virtual environment.

### Create Virtual Environment

```bash
python -m venv .venv
```

### Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then activate the environment again:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Linux / WSL

```bash
source .venv/bin/activate
```

### Install Dependencies

```bash
python -m pip install -r requirements.txt
```

### Start the Flask Development Server

```bash
python app.py
```

The development server runs at:

```text
http://127.0.0.1:5000
```

> When the complete application is running through Docker Compose, the backend is normally accessed through Nginx at `http://localhost/api/...` rather than directly from the browser.

---

## Running with Docker Compose

From the project root:

```bash
docker compose up --build -d
```

Check the backend container:

```bash
docker compose ps backend
```

View backend logs:

```bash
docker compose logs backend
```

The backend container listens internally on:

```text
5000
```

Nginx forwards `/api/*` requests to the backend container.

---

# API Endpoints

## Authentication

### Register

```text
POST /api/auth/register
```

Creates a new user account.

### Login

```text
POST /api/auth/login
```

Authenticates a user and returns a JWT access token.

### Current User

```text
GET /api/auth/me
```

Returns information about the currently authenticated user.

---

## Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Get categories |
| POST | `/api/categories` | Create a category |
| GET | `/api/categories/<category_id>` | Get one category |
| PUT | `/api/categories/<category_id>` | Update a category |
| DELETE | `/api/categories/<category_id>` | Delete a category. Refused while a budget still references the category |

---

## Expenses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | Get authenticated user's expenses |
| POST | `/api/expenses` | Create an expense |
| GET | `/api/expenses/<expense_id>` | Get one expense |
| PUT | `/api/expenses/<expense_id>` | Update an expense |
| DELETE | `/api/expenses/<expense_id>` | Delete an expense |
| GET | `/api/expenses/export` | Export expenses as CSV |

### Expense Filtering

Expenses can be filtered by category, month, or date range. Dates use `YYYY-MM-DD`, and months use `YYYY-MM`.

Examples:

```text
GET /api/expenses?category_id=1
GET /api/expenses?month=2026-10
GET /api/expenses?start_date=2026-10-01&end_date=2026-10-31
```

---

## Budgets

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/budgets` | Get authenticated user's budgets |
| POST | `/api/budgets` | Create a budget |
| GET | `/api/budgets/<budget_id>` | Get one budget |
| PUT | `/api/budgets/<budget_id>` | Update a budget |
| DELETE | `/api/budgets/<budget_id>` | Delete a budget |

Budgets can be associated with an entire month or a specific expense category. Migration `003` allows only one general budget per user and month.

---

## Expense Summaries

### Monthly Summary

```text
GET /api/summaries/monthly
```

Example:

```text
GET /api/summaries/monthly?month=2026-10
```

Returns the total expenses for the specified month.

### Category Summary

```text
GET /api/summaries/category
```

Example:

```text
GET /api/summaries/category?month=2026-10
```

Returns expenses grouped by category.

---

# Health Checks

## Application Health

```text
GET /health
```

Returns a successful response when the Flask application is running.

Through Nginx, the same check is available at:

```text
GET /api/health
```

Example:

```bash
curl -i http://localhost/api/health
```

Expected response:

```json
{
    "status": "ok"
}
```

## Database Health

```text
GET /health/db
```

Checks whether the Flask backend can communicate with PostgreSQL.

Through Nginx:

```text
GET /api/health/db
```

Example:

```bash
curl -i http://localhost/api/health/db
```

A healthy local stack should return success for both checks. Live verification through the deployed entry point is still required before release.

---

# Authentication

The backend uses JWT-based authentication.

Available authentication endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Protected endpoints require:

```text
Authorization: Bearer <access_token>
```

The backend handles:

- Missing authentication tokens
- Invalid authentication tokens
- Expired authentication tokens

Passwords are hashed before being stored in the database.

There is currently no server-side logout endpoint because JWT authentication is stateless. Client-side logout is performed by removing the stored authentication token.

---

# Validation

The backend validates incoming data before storing it in the database.

Validation includes:

- Required fields
- Email values
- Category IDs
- Monetary amounts
- Expense dates
- Budget months
- Duplicate budget conditions
- Authentication data

## Monetary Validation

Expense and budget amounts must:

- Be valid, finite numbers
- Be greater than zero
- Be below the supported maximum
- Contain no more than two decimal places

For example:

```text
1500.50
```

is valid.

While:

```text
1500.567
```

is rejected.

---

# Security

Security measures implemented in the backend include:

- Password hashing
- JWT authentication
- Authentication-protected endpoints
- User-specific data access
- Environment-based secrets, with separate Flask and JWT signing keys
- Production startup checks that reject weak or shared signing keys
- The Werkzeug debugger disabled outside explicit development or test modes
- `.env` excluded from Git
- Authentication rate limiting
- Input validation
- CSV formula protection on exported text cells
- Database transaction rollback on errors

Users can only access their own authenticated expense and budget data.

---

# API Response Format

The backend uses a consistent response structure.

### Successful Response

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {}
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error message",
    "data": null
}
```

---

# Testing and Verification

Automated backend tests run in CI on each pull request. CI fails if no tests are collected, and it runs the suite twice to check repeatability.

Development checks are listed in the QA documents, in `QA/TEST_CASES.md`. Source and CI checks do not replace live verification through the deployed Nginx entry point.

The backend source can also be checked for Python compilation errors using:

```bash
python -m compileall routes models utils app.py extensions.py
```

---

# Development Workflow

Backend changes should be developed through feature branches and pull requests.

Typical workflow:

```text
Create feature branch
        |
        v
Implement backend change
        |
        v
Test locally
        |
        v
Commit changes
        |
        v
Push branch
        |
        v
Open Pull Request
        |
        v
CI validation
        |
        v
Code review
        |
        v
Merge into the appropriate integration branch
```

Changes should not be pushed directly to protected branches.

---

# Troubleshooting

Backend troubleshooting information is maintained in:

```text
backend/docs/troubleshooting.md
```

The troubleshooting documentation contains development problems, investigation steps, solutions, verification results, and lessons learned.

---

## Database credential separation

The root `.env` contains two different PostgreSQL accounts:

- `POSTGRES_USER` / `POSTGRES_PASSWORD`: bootstrap/migration account.
- `POSTGRES_APP_USER` / `POSTGRES_APP_PASSWORD`: restricted account used by the Flask runtime.

The Compose configuration maps only the restricted account to the backend container. Migration 006 provisions its role and grants the required table and sequence permissions. The bootstrap password must not be passed into the backend. On an existing AWS database, add the runtime credentials to the protected environment file before deployment, then verify normal application operations and that administrative actions are refused.
