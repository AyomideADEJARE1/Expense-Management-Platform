# Security

This document describes the security controls implemented in Expense Tracker, the rules developers must follow, and what is still required before production. It was verified against the code on the PR #54 branch.

## 1. Architecture

```text
Browser -> Nginx (port 80, the only published port)
              |-- /api/* -> Flask API (gunicorn, non-root container)
              |                |-- authentication, authorization, validation
              |                |-- rate limiting
              |                v
              |           PostgreSQL 16 (internal network only)
              |-- /*     -> React frontend (static files)
```

The browser never connects to PostgreSQL. The backend is the only component that holds database credentials.

## 2. Authentication

- Registration and sign-in return a JSON Web Token (JWT) signed with `JWT_SECRET`.
- Protected endpoints require `Authorization: Bearer <token>`. Missing, invalid, and expired tokens return `401`.
- The JWT identity is the user ID. It is read from the token, never from the request body.
- There is no server-side logout. Logout removes the token in the browser. A stolen token remains valid until it expires, so token lifetime matters.

## 3. Passwords

- Passwords are hashed with Werkzeug's `generate_password_hash` before storage.
- Sign-in compares the supplied password with the stored hash using `check_password_hash`.
- Passwords are never returned, logged, or stored in plain text.
- Sign-in returns the same message for an unknown email and a wrong password, so accounts cannot be enumerated that way.

## 4. Authorization and data isolation

- Expenses, budgets, and profile data are filtered by the authenticated user ID. Changing an ID in the URL does not reveal another user's record. Missing and foreign records both return `404`.
- **Known exception: categories are shared.** Any signed-in user can rename or delete any category, and deletion is refused while any user's expense or budget uses it. This conflicts with the privacy requirement and is an open product decision (MAIN-023). Do not describe category data as private until that decision is made.

## 5. Input validation

The backend validates every write endpoint before it reaches the database:

- Types: JSON bodies must be objects, and string fields must be strings. Integer IDs reject booleans.
- Amounts: finite, greater than zero, below `10000000000`, and at most two decimal places.
- Dates: ISO format (`YYYY-MM-DD`), with a round-trip check that rejects values such as `2026-2-3`. Budget months must be the first day of the month.
- Length limits: names, emails, phone numbers, and descriptions.
- Currency: restricted to an allow-list.

Invalid input returns `400`. Database constraint violations return `409` where the constraint is known, and `500` otherwise, with a generic message.

## 6. CSV export safety

Exported text cells that begin with `=`, `+`, `-`, or `@` are prefixed with an apostrophe, so spreadsheet applications do not run them as formulas (MAIN-004). Category and description are both escaped.

## 7. Rate limiting

- `POST /api/auth/register` and `POST /api/auth/login` are limited to 5 requests per minute per client.
- Limits are stored in memory. They reset when the backend restarts and are not shared between instances (MAIN-016). With one backend container, this is acceptable for the capstone, and the limitation is documented.

## 8. Secrets and configuration

- Real `.env` files, passwords, signing keys, and SSH keys must never be committed. CI blocks tracked `.env` files and runs Gitleaks on the repository history.
- `backend/.env` holds the Flask and JWT secrets. The root `.env` holds the database settings. Both are created from templates that contain placeholders only.
- **Startup checks:** when `APP_ENV` (or `FLASK_ENV`) is `production`, which is the default, the backend refuses to start unless `SECRET_KEY` and `JWT_SECRET` are each at least 32 characters, are not placeholders, and differ from each other (MAIN-008).
- Compose refuses to start when a required database variable is missing (`${VAR:?...}`). No database password is written into the YAML.
- The development database password that was previously committed in Compose and in this document has been removed. Any copy of it that still exists in a fork, clone, or old branch must be treated as exposed, and the password must not be reused anywhere (MAIN-003).

## 9. Database access

- Two accounts are used. The bootstrap account (`POSTGRES_USER`) runs initialization and migrations. The restricted runtime account (`POSTGRES_APP_USER`) is the only database account the backend receives.
- Migration 006 creates the runtime account as a non-superuser, without role or database creation privileges, and grants only the table and sequence permissions the application needs.
- CI checks that the runtime role has no administrative privileges and cannot create roles, databases, or tables.
- PostgreSQL is not published to the host. It is reachable only on the Compose network.
- SQLAlchemy parameterizes queries. The application does not build SQL strings from user input.

## 10. Error handling and information disclosure

- Error responses carry a message and no stack trace.
- The Werkzeug debugger is enabled only when `APP_ENV` is `development`, `dev`, `testing`, or `test` (MAIN-010). It is off in production.
- Health endpoints return only status fields, with no configuration, versions, or credentials.

## 11. Container security

- Each application container uses a minimal base image: `python:3.12-slim`, `node:22-alpine` for the build stage, and `nginx:alpine`.
- The backend container runs as the unprivileged user `appuser` (MAIN-022).
- `.dockerignore` files exclude local `.env` files from the build context, and CI checks this.
- Only Nginx publishes a host port. The backend and PostgreSQL do not.
- Container logs are rotated (10 MB x 3 per service), so logs cannot fill the disk.

## 12. Transport security

- The local Compose stack serves HTTP on port 80 only. It is for development.
- In production, HTTPS is terminated by Cloudflare and Let's Encrypt/Certbot, which are configured outside this repository. Verify the certificate and HSTS status on the live host before release (see the runtime gates in the QA documents).

## 13. Network and cloud access

The AWS identities, instance role, security groups, and SSH access are documented in [aws-iam.md](aws-iam.md). Monitoring and alerting are documented in [monitoring.md](monitoring.md).

## 14. Git and repository hygiene

- Stage files explicitly (`git add <file>`). Do not use `git add .` when unrelated or sensitive files may be present.
- If a secret is committed, revoke or rotate it first. Deleting it from the latest commit does not remove it from history, so also rewrite history or treat the secret as permanently exposed.

## 15. Production requirements

Before production is declared secure, the following must be confirmed on the live AWS environment, with evidence recorded:

- Production secrets are set on the host and in the `production` GitHub environment, and differ from development values.
- The `DEPLOY_ENABLED` variable and the SSH key are restricted to the `production` environment.
- HTTPS is active, the certificate is valid, and renewal is configured.
- Security group rules match [aws-iam.md](aws-iam.md).
- The shared-category decision (MAIN-023) and rate-limit decision (MAIN-016) are recorded.
- A database backup has been taken and restored successfully.

## 16. Responsibilities

- **Backend:** authentication, authorization, validation, database access, and error handling.
- **Frontend:** token handling, not storing secrets in client code, and handling authentication failures.
- **Infrastructure:** Docker, Nginx, network exposure, host configuration, and production secrets.
- **Everyone:** no secrets in Git, explicit staging, and updating this document when a security control changes.

## 17. Review checklist

- [ ] No passwords, keys, or `.env` files with real values are committed.
- [ ] Protected endpoints require a valid token.
- [ ] Queries are filtered by the authenticated user, or the exception is documented.
- [ ] New input is validated before use.
- [ ] Errors do not expose internals or credentials.
- [ ] New ports are not published unless required.
- [ ] Security documentation is updated.

## 18. Related documents

- [Architecture](architecture.md)
- [Docker](docker.md)
- [Nginx](nginx.md)
- [CI/CD](ci-cd.md)
- [AWS IAM and access model](aws-iam.md)
- [Monitoring](monitoring.md)
- [Database](../database/README.md)
- [Backend](../backend/README.md)
