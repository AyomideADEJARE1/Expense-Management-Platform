# Security Guidelines

Security controls and practices for the Expense Management Platform.

This document describes the security measures currently implemented in the application and the security requirements that should be followed during development and deployment.

---

## 1. Security Architecture

The application separates security responsibilities across the frontend, reverse proxy, backend, and database layers.

```text
Browser
   │
   ▼
Nginx
   │
   ▼
Flask API
   │
   ├── Authentication
   ├── Authorization
   ├── Input Validation
   ├── Rate Limiting
   └── Database Access
            │
            ▼
       PostgreSQL 16
```

The browser does not connect directly to PostgreSQL.

The Flask backend is responsible for authentication, authorization, application validation, and database access.

---

## 2. Authentication

The application uses **JWT-based authentication** for protected API endpoints.

The authentication flow is:

```text
User
 │
 ▼
Login
 │
 ▼
Flask Authentication API
 │
 ├── Validate credentials
 │
 ├── Verify password hash
 │
 └── Issue JWT
 │
 ▼
Client
 │
 ▼
Protected API requests
 │
 └── JWT supplied with request
```

Protected endpoints require a valid authentication token.

The backend validates the token before allowing access to protected application resources.

### Stateless Authentication

JWT authentication is stateless.

The application does not currently provide a server-side logout endpoint.

Client-side logout is performed by removing the stored authentication token.

This means logging out from the frontend does not require a server-side session to be destroyed.

---

## 3. Password Security

User passwords must never be stored in plaintext.

The backend hashes passwords before storing them in PostgreSQL.

Authentication compares the supplied password against the stored password hash rather than storing or retrieving the original password.

The application must also:

- Never log user passwords
- Never return passwords through API responses
- Never store plaintext passwords
- Never commit passwords to Git
- Avoid exposing authentication secrets in application logs

---

## 4. Rate Limiting

The Flask application uses rate limiting to reduce abuse of API endpoints.

Rate limiting helps protect authentication and application endpoints from excessive or automated requests.

Rate-limit configuration should be reviewed when the application is deployed to production so that legitimate users are not unnecessarily blocked while abusive traffic is controlled.

---

## 5. Secrets Management

Sensitive information must never be committed to GitHub.

The following must not be committed:

- Database passwords
- Secret keys
- JWT secrets
- API keys
- Access tokens
- Private keys
- Cloud credentials
- Production credentials
- `.env` files containing real secrets

Local environment configuration is kept outside version control.

The backend uses a local:

```text
backend/.env
```

for development-specific configuration such as the Flask secret key.

The repository's `.gitignore` excludes local environment files from Git tracking.

---

## 6. Environment Configuration

Environment variables are used for configuration that should not be hard-coded into application source code.

The backend database connection uses environment variables including:

```text
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

The Flask application also uses environment-based secret configuration.

For Docker Compose development, the database service currently uses:

```text
Database: expense_db
User: expense_user
Password: expense_password
Host: postgres
Port: 5432
```

These credentials are intended for **local development only**.

Production deployments must use securely managed credentials and must not reuse development credentials.

---

## 7. Database Security

PostgreSQL is not directly exposed to the user's browser.

The normal communication path is:

```text
Browser
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

The PostgreSQL service communicates with the backend through the Docker Compose network.

The current Docker Compose configuration does not publish PostgreSQL port `5432` directly to the host.

### Database Access

The backend uses:

```text
Flask
  │
  ▼
SQLAlchemy
  │
  ▼
Psycopg
  │
  ▼
PostgreSQL 16
```

Using SQLAlchemy and the database abstraction layer helps avoid constructing raw SQL queries throughout the application.

Database credentials should always be supplied through configuration rather than embedded in source code.

---

## 8. Input Validation

API input should be validated before it is processed or stored.

Validation applies to areas including:

- User registration
- Authentication
- Expense creation
- Expense updates
- Categories
- Budgets
- Dates
- Numeric values
- Query parameters

Invalid input should result in an appropriate HTTP error response rather than being accepted as valid application data.

The backend contains validation and response utilities to maintain consistent API behavior.

---

## 9. Authorization

Authentication and authorization are separate concerns.

Authentication verifies the identity represented by a valid JWT.

Authorization determines whether the authenticated user is allowed to access or modify a particular resource.

Expense, budget, category, and related application operations should therefore be restricted to authenticated users and should enforce ownership rules where applicable.

Users should not be able to access another user's private financial records simply by changing an identifier in an API request.

---

## 10. API Error Handling

The API should avoid exposing sensitive implementation details to clients.

Error responses should:

- Use appropriate HTTP status codes
- Provide useful client-facing error messages
- Avoid exposing database credentials
- Avoid returning secret values
- Avoid exposing internal infrastructure details unnecessarily
- Avoid logging sensitive authentication information

Detailed exception information should remain available only through appropriate server-side debugging and logging mechanisms during development.

---

## 11. Health Endpoints

The backend exposes application and database health endpoints:

```text
GET /health
GET /health/db
```

Through Nginx, they are available as:

```text
GET /api/health
GET /api/health/db
```

These endpoints are intended to verify service availability and database connectivity.

Health endpoints should not expose credentials, tokens, passwords, or other sensitive configuration.

---

## 12. Docker Security

The application runs as separate Docker Compose services:

```text
Nginx
   │
   ├── React
   │
   └── Flask
          │
          ▼
      PostgreSQL
```

PostgreSQL is isolated from direct browser access.

The database container should remain on the internal Docker network and should not be unnecessarily published to the host or internet.

Docker configuration should also avoid:

- Hard-coded production secrets
- Unnecessary exposed ports
- Untrusted container images
- Running unnecessary services
- Committing environment files containing credentials

The project currently uses official base images for its application services and PostgreSQL.

---

## 13. Git and Repository Security

Before committing or pushing code, developers should check that sensitive information has not been introduced.

Pay particular attention to:

- `.env` files
- Passwords
- Secret keys
- JWT secrets
- API keys
- Access tokens
- Private keys
- Cloud credentials
- Production configuration

Never use:

```bash
git add .
```

when doing a commit if unrelated or sensitive files may be present in the working directory.

Instead, stage the intended files explicitly.

### Accidentally Committed Secrets

If a secret is accidentally committed:

1. Revoke or rotate the exposed secret immediately.
2. Determine whether the secret exists elsewhere in Git history.
3. Remove the secret from the repository where appropriate.
4. Review access logs or provider activity if necessary.
5. Replace the exposed credential with a new one.

Simply deleting the file from the latest commit does not make a previously committed secret safe.

---

## 14. Local Development Security

Local development credentials must remain separate from production credentials.

The development environment may use values such as:

```text
POSTGRES_USER=expense_user
POSTGRES_PASSWORD=expense_password
POSTGRES_DB=expense_db
```

These values are intended for the local Docker Compose environment.

The backend's local environment file should remain untracked:

```text
backend/.env
```

Developers must never place production credentials into local development files that could accidentally be committed.

---

## 15. Production Security Requirements

The current Docker Compose environment is intended primarily for local development and integration testing.

Before production deployment, the following areas should be addressed:

- Use production-grade secrets management
- Rotate development credentials
- Configure HTTPS/TLS
- Secure the Azure VM and network
- Restrict inbound network access
- Use least-privilege cloud identities
- Protect production database credentials
- Configure appropriate monitoring and logging
- Review JWT configuration and token lifetime
- Review rate limits for production traffic
- Avoid exposing unnecessary service ports
- Keep Docker images and operating system packages updated
- Configure secure backups and recovery procedures

Azure deployment and its associated production security controls are currently planned rather than completed.

---

## 16. Security Responsibilities

All contributors are responsible for following the project's security practices.

The Project Lead / Architect is responsible for coordinating major security decisions.

Backend contributors are responsible for:

- Authentication
- Authorization
- Input validation
- Secure database access
- Error handling
- Secret handling

Frontend contributors are responsible for:

- Secure token handling
- Avoiding exposure of secrets in client-side code
- Handling authentication failures correctly
- Avoiding unnecessary sensitive data storage

Infrastructure contributors are responsible for:

- Docker configuration
- Nginx configuration
- Network exposure
- Cloud infrastructure security
- Production secrets management

---

## 17. Security Review Checklist

Before merging a change, verify:

- [ ] No passwords or secrets are committed.
- [ ] No `.env` files containing real secrets are committed.
- [ ] Authentication requirements are preserved.
- [ ] Authorization rules are preserved.
- [ ] User input is validated.
- [ ] Sensitive information is not returned in API responses.
- [ ] Sensitive information is not logged.
- [ ] Database credentials are not hard-coded.
- [ ] PostgreSQL is not unnecessarily exposed.
- [ ] New endpoints have appropriate authentication requirements.
- [ ] Rate limiting is considered for sensitive or high-volume endpoints.
- [ ] Docker configuration does not unnecessarily expose services.
- [ ] Production-only security requirements are documented when applicable.

---

## 18. Security Documentation

Related project documentation includes:

```text
README.md
docs/architecture.md
database/README.md
backend/README.md
```

This document should be updated whenever a significant security control or deployment security requirement changes.
