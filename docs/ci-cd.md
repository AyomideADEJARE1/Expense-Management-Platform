# CI/CD Documentation

## CI

Workflow: .github/workflows/ci.yml

Current checks include component detection, secret scanning/Gitleaks, PostgreSQL migration checks, backend lint/test, frontend lint/test/build, Docker builds, and the overall ci-success job.

A successful CI run does not prove production deployment.

## CD

Workflow: .github/workflows/cd.yml

The workflow can publish backend and frontend images to GitHub Container Registry.

It also contains a configurable deployment job using Azure-specific variables/secrets such as AZURE_VM_HOST, AZURE_VM_USER, AZURE_VM_SSH_KEY, DEPLOY_ENABLED, and APP_URL.

That deployment target is legacy/configurable workflow code, not the current production environment.

## Current Production

The actual production application runs on AWS EC2 Ubuntu with Docker Compose.

Public domain: https://expense-tracker.live

Cloudflare provides the public DNS/proxy layer. HTTPS is active and Let's Encrypt/Certbot is used for certificate management.

## AWS Application Update

After changes are merged into main:

    cd ~/Expense-Management-Platform
    git pull --ff-only
    docker compose build
    docker compose up -d
    docker compose ps
    curl http://localhost/api/health

Then verify the public HTTPS application.

The EC2 instance, domain, and TLS configuration do not need to be recreated for every code change.

## Verification Levels

| Check | Meaning |
|---|---|
| CI passes | Repository checks passed |
| Docker build passes | Images build successfully |
| Image published | Image reached GHCR |
| EC2 containers healthy | Services run on EC2 |
| EC2 health passes | Nginx/backend path works |
| Public HTTPS passes | DNS/proxy/TLS/public path works |

Do not state that GitHub Actions deployed production unless AWS deployment was actually automated and verified.
