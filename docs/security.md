# Security Guidelines

## Security Architecture

Browser -> Cloudflare/HTTPS -> Nginx -> Flask API -> PostgreSQL.

The browser does not connect directly to PostgreSQL.

## Authentication

The backend uses JWT-based authentication for protected endpoints.

Authentication is stateless and the application does not currently provide a server-side logout endpoint. Client-side logout removes the stored token.

## Password Security

Passwords are hashed before storage. The application must never store, return, log, or commit plaintext passwords.

## Authorization and User Isolation

User-owned resources must be restricted using the authenticated user identity. Changing a resource ID must not allow access to another user's private financial data.

## Rate Limiting

The backend uses rate limiting, including authentication-related protection. Development uses in-memory rate-limit storage.

## Secrets

Never commit real .env files, database passwords, Flask/JWT secrets, API keys, cloud credentials, private keys, or production credentials.

Compose development database values are for development/integration and must not be reused as production secrets.

## Database

PostgreSQL is internal to the Docker network. The current Compose configuration does not publish port 5432 to the host.

## Validation

The backend validates registration, authentication, expense, budget, category, date, amount, and query inputs.

## Health

Backend: /health and /health/db.

Through Nginx: /api/health and /api/health/db.

Health responses must not expose secrets.

## Production

Current production runs on AWS EC2 Ubuntu at https://expense-tracker.live.

Cloudflare provides the public DNS/proxy layer. HTTPS is active and Let's Encrypt/Certbot is used for certificate management.

AWS networking, OS security, Cloudflare settings, TLS management, and production secret handling are deployment-environment responsibilities.

## Git Security

Before committing:

    git status
    git diff

If a secret is exposed, rotate/revoke it immediately. Removing the file from the latest commit alone is insufficient if the secret remains in Git history.
