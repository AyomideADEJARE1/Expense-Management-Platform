# Backend Development Troubleshooting

This document records significant backend development and integration issues encountered while building the Expense Management Platform.

It provides troubleshooting guidance for local development, Docker Compose, PostgreSQL, authentication, API testing, and Git workflow.

---

## 1. Python Virtual Environment Activation on Windows

### Problem

The Python virtual environment could not initially be activated in PowerShell because the execution policy prevented the activation script from running.

### Diagnosis

The issue was related to PowerShell script execution permissions rather than Python or the virtual environment itself.

### Solution

For local Windows development, the execution policy can be adjusted for the current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

The virtual environment can then be activated with:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Lesson Learned

PowerShell execution policies can prevent Python virtual-environment activation scripts from running. Environment-specific shell restrictions should be checked before reinstalling Python or recreating the virtual environment.

---

## 2. PostgreSQL Command-Line Tools Not Found

### Problem

The `psql` command was initially not recognized from PowerShell.

### Diagnosis

PostgreSQL may be installed correctly while its command-line tools are unavailable through the system `PATH`.

### Solution

Verify that PostgreSQL is installed and that the PostgreSQL `bin` directory is available to the shell.

For the current Docker-based development workflow, PostgreSQL can instead be accessed directly through the running database container:

```bash
docker exec -it expense-postgres psql -U expense_user -d expense_db
```

### Lesson Learned

A command-not-found error does not necessarily mean the underlying software is missing. Check installation status and `PATH` configuration before reinstalling software.

---

## 3. Database Connected but Tables Were Missing

### Problem

The application could connect to PostgreSQL, but the database did not contain the expected application tables.

A PostgreSQL database connection succeeding does not guarantee that the schema has been initialized.

### Diagnosis

The database existed, but the required schema had not been created in the active database volume.

### Current Configuration

The application currently uses:

```text
Database: expense_db
User: expense_user
Host: postgres
Port: 5432
```

The Docker Compose PostgreSQL service mounts the initial schema migration:

```text
database/migrations/001_initial_schema.sql
```

into:

```text
/docker-entrypoint-initdb.d/001_initial_schema.sql
```

### Solution

For a fresh development database, recreate the PostgreSQL volume:

```bash
docker compose down -v
docker compose up -d
```

Then verify the tables:

```bash
docker exec expense-postgres psql -U expense_user -d expense_db -c "\dt"
```

The expected application tables include:

```text
users
expense_categories
expenses
budgets
monthly_expense_summary
```

### Important

PostgreSQL initialization scripts in `/docker-entrypoint-initdb.d/` run when the database is initialized with a new data directory. They are not automatically re-run every time the container starts.

### Lesson Learned

Database connectivity, database initialization, and database persistence are separate concerns.

---

## 4. Environment Variables and Secrets

### Problem

The Flask application requires configuration such as database credentials and secret keys without hard-coding sensitive values into application source code.

### Current Local Configuration

Local backend secrets are stored in:

```text
backend/.env
```

The file must remain uncommitted.

The Docker Compose backend also receives the PostgreSQL connection settings through the Compose configuration.

The current development database configuration is:

```text
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=expense_user
POSTGRES_PASSWORD=expense_password
POSTGRES_DB=expense_db
```

The application also requires its Flask secret configuration.

### Security Rule

Never commit:

```text
.env
```

or real credentials, passwords, tokens, or production secrets to Git.

Check the repository status before committing:

```bash
git status
```

### Lesson Learned

Environment-specific configuration should remain separate from application source code. Local development credentials must never be treated as production secrets.

---

## 5. Docker Compose Database Configuration

### Problem

The backend may fail to connect to PostgreSQL when it is configured to use `localhost` from inside the Docker network.

### Diagnosis

Inside a Docker container, `localhost` refers to the current container rather than another Compose service.

### Current Configuration

The backend connects to PostgreSQL using the Compose service name:

```text
POSTGRES_HOST=postgres
```

The PostgreSQL service is:

```text
postgres
```

Therefore the backend should use:

```text
postgres:5432
```

rather than:

```text
localhost:5432
```

### Verification

Check the running services:

```bash
docker compose ps
```

The PostgreSQL container should be healthy before the backend starts.

The backend can also be tested directly:

```bash
docker exec expense-backend python -c "from app import app, db; app.app_context().push(); db.session.execute(db.text('SELECT 1')); print('Database connection: OK')"
```

Expected result:

```text
Database connection: OK
```

### Lesson Learned

Docker Compose service names provide the internal network addressing used by application containers.

---

## 6. Backend Container Health

### Problem

The backend may be running but not actually ready to receive requests.

### Current Health Endpoint

The Flask application exposes:

```text
GET /health
```

A successful response is:

```json
{
  "status": "ok"
}
```

The Docker Compose backend health check calls:

```text
http://localhost:5000/health
```

### Database Health

The backend also exposes:

```text
GET /health/db
```

A successful database health response indicates that the application can execute a database query.

### Verification

From inside the backend container:

```bash
docker exec expense-backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:5000/health').read().decode())"
```

### Lesson Learned

A service being started is not the same as the service being healthy. Health checks should verify actual application readiness.

---

## 7. Nginx API Routing

### Problem

The backend works directly on port `5000`, but frontend requests use the `/api` path.

### Current Architecture

Requests enter through Nginx:

```text
Browser
   |
   v
Nginx :80
   |
   +---- /api/* ------> Flask backend :5000
   |
   +---- / -----------> React frontend :80
```

The host exposes Nginx on:

```text
localhost:8080
```

### API Health Routing

The public health endpoint is:

```text
/api/health
```

Nginx maps it to the Flask endpoint:

```text
/health
```

Therefore:

```text
GET /api/health
```

is proxied to:

```text
GET /health
```

on the backend.

### Verification

From the host:

```bash
curl http://localhost:8080/api/health
```

A successful response should report:

```json
{
  "status": "ok"
}
```

### Lesson Learned

The public API path and internal Flask route do not have to be identical. Nginx provides the routing layer between the browser and backend service.

---

## 8. Authentication

### Problem

The application requires users to register, log in, and access protected resources securely.

### Solution

JWT-based authentication is implemented using Flask-JWT-Extended.

The main authentication endpoints are:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Passwords are hashed before storage using Werkzeug password-hashing utilities.

Protected endpoints require a valid JWT.

### Logout Behavior

The application uses stateless JWT authentication and does not currently provide a server-side logout endpoint.

Client-side logout is performed by removing the stored token.

### Common Authentication Failures

Authentication failures may occur when:

- the JWT is missing;
- the JWT is invalid;
- the JWT is expired;
- the user is not authorized to access the requested resource.

### Lesson Learned

Authentication and authorization are separate concerns. A valid login does not automatically give a user access to another user's resources.

---

## 9. User Data Isolation

### Problem

Users must not be able to access another user's expenses or budgets by changing a resource ID.

### Solution

The authenticated user ID is obtained from the JWT.

Queries for user-owned resources are restricted using that authenticated user ID.

For example:

```python
Expense.user_id == user_id
```

This prevents authenticated users from accessing another user's private records through the API.

### Lesson Learned

Every user-owned resource should be checked against the authenticated user's identity rather than relying only on the resource ID supplied by the client.

---

## 10. Password Security

### Problem

Storing passwords in plain text would expose user credentials if the database were compromised.

### Solution

Passwords are hashed before being stored.

The database stores a password hash rather than the original password.

During login, the submitted password is verified against the stored hash.

### Lesson Learned

Application code should never need to retrieve or store a user's original password.

---

## 11. Authentication Rate Limiting

### Problem

Authentication endpoints can be targeted by repeated requests and brute-force attempts.

### Solution

Flask-Limiter is used to apply rate limits to authentication endpoints.

When a configured rate limit is exceeded, the API returns:

```text
HTTP 429 Too Many Requests
```

with a JSON response.

### Current Development Limitation

The current development configuration uses local in-memory rate-limit storage.

A production deployment with multiple application instances should use appropriate persistent/shared rate-limit storage.

### Lesson Learned

Authentication endpoints should be protected against excessive repeated requests, while production deployments should use storage appropriate for their deployment architecture.

---

## 12. Monetary Precision

### Problem

Financial values require accurate decimal representation.

### Solution

PostgreSQL stores monetary values using:

```text
NUMERIC(12, 2)
```

The backend also validates monetary values using Python's `Decimal` type.

Amounts must:

- be greater than zero;
- contain no more than two decimal places.

For example:

```text
1500.50
```

is valid, while:

```text
1500.567
```

is rejected.

### Lesson Learned

Financial values should use decimal-based representations rather than relying on binary floating-point arithmetic.

---

## 13. Input Validation

### Problem

API clients can submit incomplete, malformed, or invalid data.

### Solution

The backend validates important fields including:

- required fields;
- email addresses;
- passwords;
- expense amounts;
- budget amounts;
- expense dates;
- budget months;
- category IDs.

Invalid requests return an appropriate HTTP `400` response rather than being silently accepted.

### Lesson Learned

Validation should occur at the API boundary before invalid data reaches the database.

---

## 14. Database Transaction Error Handling

### Problem

A failed database transaction can leave the SQLAlchemy session in a failed transaction state.

### Solution

Failed database operations are rolled back using:

```python
db.session.rollback()
```

The API then returns an appropriate error response.

### Lesson Learned

When a database transaction fails, the session should be rolled back before it is reused.

---

## 15. API Testing

### Problem

Backend functionality can appear correct in isolation while still containing integration problems.

### Testing Performed

The backend and integrated application have been tested across areas including:

- application health;
- database health;
- user registration;
- duplicate registration;
- login;
- case-insensitive email handling;
- authenticated user information;
- missing JWT;
- invalid JWT;
- expired JWT;
- authentication rate limiting;
- category CRUD;
- expense CRUD;
- expense filtering;
- CSV export;
- budget CRUD;
- duplicate budget prevention;
- monthly summaries;
- category summaries;
- monetary precision validation.

### End-to-End Testing

The application can also be tested through the Nginx entry point:

```text
http://localhost:8080
```

API requests should use:

```text
http://localhost:8080/api/...
```

This verifies the interaction between:

```text
Browser/client
    ↓
Nginx
    ↓
Flask backend
    ↓
PostgreSQL
```

### Lesson Learned

Testing through the integrated application path can identify routing, authentication, database, and container issues that isolated backend testing may not reveal.

---

## 16. Docker Compose Troubleshooting

### Check Service Status

```bash
docker compose ps
```

All four application services should eventually report healthy where health checks are configured:

```text
frontend
backend
postgres
nginx
```

### View Logs

Backend:

```bash
docker compose logs backend
```

PostgreSQL:

```bash
docker compose logs postgres
```

Nginx:

```bash
docker compose logs nginx
```

Frontend:

```bash
docker compose logs frontend
```

Follow logs live:

```bash
docker compose logs -f backend
```

### Rebuild After Code Changes

```bash
docker compose build
docker compose up -d
```

### Full Development Reset

If the database volume must be recreated:

```bash
docker compose down -v
docker compose up -d
```

**Warning:** `docker compose down -v` removes the PostgreSQL data volume. Do not use it when you need to preserve existing development data.

### Lesson Learned

Start with service status and logs before performing destructive resets.

---

## 17. Git Branch Management

### Problem

Development work should be isolated from protected or integration branches.

### Current Workflow

The project uses feature and task branches for development.

The `nginx` branch is an important integration branch containing the currently integrated application stack, while `main` is used as a protected project branch and CI/CD target.

The exact target branch for a pull request should follow the current project integration plan.

### Typical Workflow

Fetch the latest remote branches:

```bash
git fetch origin
```

Create or switch to a working branch:

```bash
git switch -c feature/example
```

Make the required changes and review the diff:

```bash
git diff
```

Stage only the intended files:

```bash
git add path/to/file
```

Commit the changes:

```bash
git commit -m "feat: implement example change"
```

Push the branch:

```bash
git push -u origin feature/example
```

Open a pull request against the appropriate target branch.

### Important

Do not use:

```bash
git add .
```

when unrelated or intentionally untracked files may exist in the working tree.

Stage only the files that belong to the current task.

### Lesson Learned

Feature branches and focused commits make code review safer and reduce accidental changes.

---

## 18. Pull Request and CI Troubleshooting

### Problem

A pull request may show unexpected files, fail CI, or target the wrong branch.

### Diagnosis

First inspect:

```bash
git status
```

Then compare the branch against its intended target:

```bash
git diff origin/<target-branch>...HEAD
```

Review the GitHub Actions result and identify which job failed.

The CI workflow currently includes checks for areas such as:

- repository/file detection;
- secret scanning;
- database initialization;
- backend checks;
- frontend checks;
- Docker builds;
- overall CI status.

### Important

A successful Docker build does not by itself mean that the application has been deployed to Azure.

The current CD workflow supports GHCR image publishing and configurable Azure deployment, but production deployment should be verified separately.

### Lesson Learned

A green build, a successful image build, and a successful production deployment are separate outcomes.

---

## 19. Common Troubleshooting Sequence

When the backend is not working, troubleshoot from the lowest dependency level upward.

### Step 1 — Check containers

```bash
docker compose ps
```

### Step 2 — Check PostgreSQL

```bash
docker compose logs postgres
```

### Step 3 — Check backend logs

```bash
docker compose logs backend
```

### Step 4 — Test backend health

```bash
curl http://localhost:5000/health
```

### Step 5 — Test database health

```bash
curl http://localhost:5000/health/db
```

### Step 6 — Test Nginx health

```bash
curl http://localhost:8080/api/health
```

### Step 7 — Test the frontend

Open:

```text
http://localhost:8080
```

### Step 8 — Check application logs

If the service is running but requests fail:

```bash
docker compose logs -f backend nginx
```

This sequence helps determine whether the problem is related to:

- container startup;
- PostgreSQL;
- backend application;
- database connectivity;
- Nginx routing;
- frontend integration.

---

## 20. Known Development Considerations

### Development Credentials

The Docker Compose configuration uses development database credentials.

These credentials are intended for local development and must not be reused as production secrets.

### Rate-Limit Storage

The current development rate-limit configuration uses local in-memory storage.

Production deployments should use an appropriate shared/persistent backend where required.

### Production Deployment

Azure deployment is documented as part of the project's planned/configurable deployment workflow.

Do not assume that a successful local Docker Compose deployment means the Azure production environment is active.

### API Health Path

The application exposes the backend health endpoint as:

```text
/health
```

Nginx exposes the application health endpoint as:

```text
/api/health
```

The distinction should be preserved when testing the backend directly versus testing the complete application through Nginx.

---

## 21. Quick Reference

### Start the application

```bash
docker compose up -d
```

### Check services

```bash
docker compose ps
```

### View backend logs

```bash
docker compose logs -f backend
```

### Backend health

```bash
curl http://localhost:5000/health
```

### Database health

```bash
curl http://localhost:5000/health/db
```

### Nginx/API health

```bash
curl http://localhost:8080/api/health
```

### Application

```text
http://localhost:8080
```

### Reset database volume

```bash
docker compose down -v
docker compose up -d
```

### Database tables

```bash
docker exec expense-postgres psql -U expense_user -d expense_db -c "\dt"
```

---

## 22. Summary

Backend troubleshooting for the Expense Management Platform involves more than debugging Flask routes.

The main areas to consider are:

1. Python development environment
2. PostgreSQL availability and initialization
3. Docker Compose networking
4. Backend health
5. Nginx routing
6. Authentication and authorization
7. Input validation
8. Database transactions
9. API testing
10. Git and pull-request workflow

When troubleshooting, start with service status and logs, verify database connectivity, test the backend directly, and then test the complete application through Nginx.

This approach makes it easier to identify whether a problem originates in the application code, database, container configuration, network routing, or integration workflow.
