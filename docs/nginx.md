# Nginx Documentation

Nginx is the single application entry point inside Docker Compose.

## Current Configuration

Files: nginx/Dockerfile and nginx/default.conf.

The container listens on port 80 and the current Compose mapping is 80:80.

## Routing

| Request | Destination |
|---|---|
| /api/health | backend:5000/health |
| /api/* | backend:5000 |
| everything else | frontend:80 |

The flow is:

    Browser -> Nginx -> Flask for /api/*
    Browser -> Nginx -> React for everything else

## Proxy Headers

The current configuration forwards Host, X-Real-IP, X-Forwarded-For, and X-Forwarded-Proto.

## Health

Compose checks http://127.0.0.1/api/health.

Test locally:

    curl http://localhost/api/health

## Production HTTPS

nginx/default.conf is HTTP-only. It does not contain the live TLS certificate configuration.

Production path:

    Internet -> Cloudflare/HTTPS -> AWS EC2 -> Docker Nginx :80 -> React/Flask

Production domain: https://expense-tracker.live

Let's Encrypt/Certbot is used for certificate management in the production environment.

External TLS/domain configuration belongs to deployment infrastructure, not the repository Nginx file.
