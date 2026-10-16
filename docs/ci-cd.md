# CI/CD

This document describes the continuous integration (CI) and continuous delivery (CD) workflows, the required GitHub configuration, and the AWS EC2 deployment sequence.

Related: [Architecture](architecture.md) · [Docker](docker.md) · [Nginx](nginx.md) · [Security](security.md) · [Contributing](../CONTRIBUTING.md)

## Overview

| Workflow | File | Runs when |
|---|---|---|
| CI | `.github/workflows/ci.yml` | Pull requests into `main`, `nginx`, or `integration/deployable-main`; pushes to `main` or `nginx`; manual dispatch |
| CD | `.github/workflows/cd.yml` | After a successful CI run for a push to `main`; manual dispatch |
| Dependabot | `.github/dependabot.yml` | Scheduled dependency update checks |

CI validates every change. CD publishes images to GHCR and, when enabled, deploys them to AWS EC2.

## Continuous integration

CI detects which components exist and runs the matching jobs.

| Job | What it checks |
|---|---|
| Detect components | Presence of backend, frontend, and Dockerfiles |
| Secret scan | Fails if a `.env` file is tracked (`.env.example` is allowed). Runs Gitleaks against the repository history |
| Database migrations | Applies `database/migrations/*.sql` in order to PostgreSQL 16. Verifies expected tables, the `RESTRICT` delete rule on budget categories, the `users.phone` column, and that the runtime role has no administrative privileges and cannot create roles, databases, or tables |
| Duplicate-budget check | Confirms migration 003 rejects duplicate legacy budgets with a clear diagnostic |
| Compose configuration | Validates that the bootstrap and runtime database credentials are wired to separate services, and that every service uses `restart: unless-stopped` |
| Public Nginx routes | Confirms `/api/health` and `/api/health/db` are mapped in Nginx and checked by CD |
| Deployment order | Confirms the Nginx build and each migration run before application services restart |
| Backend | Applies migrations, runs flake8, and runs `pytest` twice. Zero collected tests fail the job |
| Frontend | `npm ci`, dependency audit report, ESLint, `npm test`, and `npm run build`. All steps are required |
| Docker build | Checks `.dockerignore` rules, builds backend, frontend, and Nginx images, and confirms local `.env` files are not packaged |
| `ci-success` | Aggregate result. Use this as the single required status check |

The CI database and credentials are test-only values. They must never be used outside CI.

## Continuous delivery

### Publish

The `publish` job runs for backend and frontend when their Dockerfiles exist. It pushes two tags to GHCR:

- `sha-<short commit>`: identifies the exact CI-tested commit. Deployment uses this tag.
- `latest`: convenience only. Deployment does not use it.

Image names follow the pattern `ghcr.io/<owner>/<repository>-<service>` in lowercase. The owner and repository are taken from the running repository, so forks publish to their own registry namespace.

A commit tag is not immutable. For stronger release integrity, enable tag immutability in the registry or record image digests.

### Deploy

The `deploy` job runs only when:

- the workflow runs on `main`, and
- the repository variable `DEPLOY_ENABLED` is `true`.

It runs in the `production` environment and performs these steps on the EC2 host:

1. Logs in to GHCR with the read-only `GHCR_READ_USERNAME` and `GHCR_READ_TOKEN`, using `--password-stdin`. The login is removed when the script exits.
2. Checks out the CI-tested commit.
3. Pulls the `sha-<short commit>` backend and frontend images.
4. Builds the Nginx image from the same checked-out commit. Nginx is not published to GHCR.
5. Starts PostgreSQL and waits until it is healthy.
6. Applies migrations 002 through 006 to the database. If a migration fails, the script stops and the running application is unchanged.
7. Restarts the backend, frontend, and Nginx services and removes unused images.

After the SSH step, the workflow checks `<APP_URL>/api/health` and `<APP_URL>/api/health/db`. Both must return success. The checks retry before failing.

## Required GitHub configuration

Configure these under **Settings → Secrets and variables → Actions**, and create a `production` environment under **Settings → Environments**.

| Type | Name | Purpose |
|---|---|---|
| Secret | `AWS_EC2_HOST` | Public IP or hostname of the EC2 instance |
| Secret | `AWS_EC2_USER` | SSH user on the instance |
| Secret | `AWS_EC2_SSH_KEY` | Private key used for deployment |
| Secret | `GHCR_READ_USERNAME` | Account the EC2 host uses to pull images |
| Secret | `GHCR_READ_TOKEN` | Read-only package token for that account |
| Variable | `DEPLOY_ENABLED` | Set to `true` to enable deployment |
| Variable | `APP_URL` | Public application URL, used by the health checks |
| Variable | `DEPLOY_PATH` | Application directory on the host. Defaults to `~/expense-management-platform` |

Production passwords and signing keys belong on the server or in a secret store, never in the repository.

## Branch protection

Protect `main` and `nginx` with these settings:

- Require a pull request before merging, with at least one approval.
- Dismiss stale approvals when new commits are pushed.
- Require the `ci-success` status check to pass.
- Require branches to be up to date before merging.
- Require conversation resolution.
- Block force pushes and branch deletion.

## Verification levels

Each level proves something different. Report only the levels you have actually checked.

| Level | Meaning |
|---|---|
| CI passes | Checks passed for that commit |
| Images published | Images reached GHCR under the commit tag |
| EC2 deployment | The host runs the commit-tagged images |
| Health checks pass | Both public health endpoints respond on the deployed host |
| Browser checks pass | The main user flows work on the live site |

A green CI run is not evidence of a live release.

## Troubleshooting

| Symptom | Check |
|---|---|
| `ci-success` fails | Open the first failed job in the CI run |
| Secret scan fails | Tracked `.env` file, or a Gitleaks finding. Remove the secret and rotate it |
| Migration job fails | Run the failing migration locally against a disposable PostgreSQL 16 database |
| Frontend job fails | Run `npm ci`, `npm run lint`, `npm test`, and `npm run build` in `frontend/` |
| CD skips publishing | CI must succeed on a push to `main`, or run CD manually |
| Deployment is skipped | `DEPLOY_ENABLED` must be `true`, and the workflow must run on `main` |
| SSH step fails | `AWS_EC2_HOST`, `AWS_EC2_USER`, `AWS_EC2_SSH_KEY`, and the host's SSH access |
| GHCR pull fails on EC2 | The read token must be able to read both packages. Check the username and token |
| Migration fails during deploy | Read the psql error. Restore from backup if the data is partly changed. The running app stays up |
| Health check fails | Confirm `APP_URL`, Nginx routes, and running containers on the host |
