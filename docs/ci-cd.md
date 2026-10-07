# CI/CD Pipeline

This document describes the project's current Continuous Integration (CI) and Continuous Delivery (CD) workflows.

The CI pipeline validates changes on pull requests and pushes to the project's integration branches. The CD pipeline can publish Docker images to GitHub Container Registry (GHCR) and is prepared for Azure VM deployment when deployment is explicitly enabled.

The team's Git workflow is described in [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 1. Pipeline Overview

```mermaid
flowchart LR
    D[Developer] --> B[Feature Branch]
    B --> PR[Pull Request]
    PR --> CI[CI Validation]
    CI --> R[Review + Approval]
    R --> M[Merge to main or nginx]
    M --> CI2[CI Validation]
    CI2 --> P[CD: Publish Images]
    P --> G[GitHub Container Registry]
    P --> DEP[Azure Deployment]
    DEP --> H[Health Check]
```

The project separates validation from delivery:

1. Developers work on feature or area branches.
2. Pull requests trigger CI.
3. CI checks secrets, database migrations, backend code, frontend code, and Docker builds.
4. Pull requests are reviewed and approved before merging.
5. Pushes to `main` or `nginx` trigger CI again.
6. A successful push to `main` can trigger the CD workflow.
7. CD publishes Docker images to GHCR.
8. Azure deployment remains disabled unless `DEPLOY_ENABLED=true`.
9. When Azure deployment is enabled, the workflow connects to the configured VM and performs a deployment and health check.

---

## 2. Workflow Files

| Workflow | File | Trigger |
|---|---|---|
| Continuous Integration | `.github/workflows/ci.yml` | Pull requests and pushes to `main` or `nginx`; manual run |
| Continuous Delivery | `.github/workflows/cd.yml` | Successful CI workflow on `main`; manual run |
| Dependabot | `.github/dependabot.yml` | Scheduled dependency updates |

---

# 3. Continuous Integration

The CI workflow is defined in:

```text
.github/workflows/ci.yml
```

CI runs for:

- Pull requests targeting `main`
- Pull requests targeting `nginx`
- Pushes to `main`
- Pushes to `nginx`
- Manual workflow dispatch

The workflow uses:

- Python 3.12
- Node.js 20
- PostgreSQL 16
- GitHub Actions
- Docker Buildx
- Gitleaks

---

## 4. CI Pipeline

```mermaid
flowchart TD
    A[CI Trigger] --> B[Detect Components]
    A --> C[Secret Scan]
    A --> D[Database Migrations]

    B --> E[Backend]
    B --> F[Frontend]
    B --> G[Docker Build]

    C --> H[ci-success]
    D --> H
    E --> H
    F --> H
    G --> H
```

The workflow is designed to detect which application components exist and run the relevant jobs automatically.

---

# 5. Detect Project Components

The `detect` job checks whether the repository contains:

- `backend/requirements.txt`
- `frontend/package.json`
- A backend or frontend Dockerfile

The results determine whether the corresponding backend, frontend, and Docker jobs run.

This allows CI to continue working as the project structure evolves without requiring the workflow to be rewritten whenever a component is added.

---

# 6. Secret Scan

The `secret-scan` job performs two checks.

### Environment files

The workflow checks Git's tracked files and fails if a `.env` file has been committed.

`.env.example` is allowed.

The project's actual development environment file:

```text
backend/.env
```

must remain untracked.

### Gitleaks

The workflow also runs Gitleaks against the repository's Git history.

This helps detect accidentally committed credentials, tokens, API keys, passwords, and other sensitive values.

If a secret is exposed, it should be removed from the repository and rotated where applicable. Removing it only from the latest commit does not remove it from Git history.

---

# 7. Database Migration Checks

The `database` job starts PostgreSQL 16 as a GitHub Actions service.

CI uses a dedicated test database:

```text
Database: expense_management_test
User:     ci_user
Password: ci_password
Host:     localhost
Port:     5432
```

The workflow applies SQL files from:

```text
database/migrations/
```

in filename order.

The job then verifies that the expected tables exist:

```text
budgets
expense_categories
expenses
monthly_expense_summary
users
```

This provides an automated check that the database migrations can be applied successfully.

---

# 8. Backend CI

The backend job runs when:

```text
backend/requirements.txt
```

exists.

The job:

1. Sets up Python 3.12.
2. Installs backend dependencies.
3. Installs `flake8` and `pytest`.
4. Runs Flake8.
5. Runs the backend test suite.

The CI test environment provides database and application variables specifically for the CI environment.

The current CI workflow defines:

```text
FLASK_ENV=testing
SECRET_KEY=ci-test-secret
JWT_SECRET=ci-test-jwt-secret
DATABASE_URL=postgresql://ci_user:ci_password@localhost:5432/expense_management_test
```

These values are **CI test configuration** and are not the same as the Docker Compose runtime configuration used by the application.

The application runtime currently uses PostgreSQL connection variables such as:

```text
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

and Flask's:

```text
SECRET_KEY
```

Production credentials must never use the test values above.

---

# 9. Frontend CI

The frontend job runs when:

```text
frontend/package.json
```

exists.

The job:

1. Sets up Node.js 20.
2. Runs `npm ci`.
3. Runs the lint script when available.
4. Runs the test script when available.
5. Runs the production build.

The current workflow uses:

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

The `--if-present` behavior means the absence of a lint or test script does not cause the workflow to fail solely because the script is missing.

The frontend build remains required.

---

# 10. Docker Build Validation

The `docker-build` job validates Dockerfiles without publishing images.

The workflow checks:

```text
backend/Dockerfile
frontend/Dockerfile
```

when present.

Each image is built using its respective directory as the Docker build context.

For example:

```text
backend/Dockerfile
    ↓
backend/ build context

frontend/Dockerfile
    ↓
frontend/ build context
```

Images are built with:

```text
push: false
```

so this CI job does not publish them to a registry.

This job verifies that the application images can be built successfully before delivery.

---

# 11. Required CI Result

The final CI job is:

```text
ci-success
```

It waits for the other CI jobs and fails if any required job reports:

- `failure`
- `cancelled`

Skipped component-specific jobs are allowed when those components are not present.

`ci-success` is therefore the single aggregate check intended for branch protection.

---

# 12. Continuous Delivery

The CD workflow is defined in:

```text
.github/workflows/cd.yml
```

CD is separate from CI.

The workflow listens for completion of the CI workflow on `main`.

For an ordinary automated run, publishing proceeds only when:

1. CI completed successfully.
2. The CI run was associated with a push to `main`.

A manual CD workflow run is also supported.

---

# 13. Publishing Docker Images

The `publish` job builds and pushes Docker images to:

```text
GitHub Container Registry
```

using the repository's `GITHUB_TOKEN`.

Images are generated for:

```text
backend
frontend
```

when their respective Dockerfiles exist.

The image naming pattern is:

```text
ghcr.io/<repository>-<service>
```

For this project, the repository-based image names follow the pattern:

```text
ghcr.io/ayomideadejare1/expense-management-platform-backend
ghcr.io/ayomideadejare1/expense-management-platform-frontend
```

Images receive:

- A short commit SHA tag
- A `latest` tag

The commit SHA allows a specific build to be identified, while `latest` represents the most recently published image.

---

# 14. Azure Deployment

The CD workflow contains an Azure VM deployment job, but deployment is **not automatically enabled by default**.

Deployment runs only when the repository variable:

```text
DEPLOY_ENABLED
```

is set to:

```text
true
```

and the CD workflow is running against:

```text
main
```

The deployment job uses SSH to connect to the configured Azure VM.

The configured deployment process performs:

```bash
git pull --ff-only
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

The deployment path defaults to:

```text
~/expense-management-platform
```

unless `DEPLOY_PATH` is configured.

### Current status

The Azure deployment infrastructure is **planned/configurable rather than confirmed as an active production deployment**.

The repository should therefore not be described as currently running in production on Azure until the Azure VM, production configuration, deployment secrets, and deployment workflow have been configured and verified.

---

# 15. CD Configuration

When Azure deployment is ready to be enabled, the repository requires the following configuration.

### Repository secrets

| Name | Purpose |
|---|---|
| `AZURE_VM_HOST` | Azure VM public IP address or hostname |
| `AZURE_VM_USER` | SSH user |
| `AZURE_VM_SSH_KEY` | Private SSH key used for deployment |

### Repository variables

| Name | Purpose |
|---|---|
| `DEPLOY_ENABLED` | Enables Azure deployment when set to `true` |
| `APP_URL` | Public application URL used by the health check |
| `DEPLOY_PATH` | Application directory on the Azure VM |

The production environment should also be configured in:

```text
Settings → Environments
```

with the environment name:

```text
production
```

Production secrets such as database passwords and application secret keys must remain outside the Git repository.

---

# 16. Deployment Health Check

After deployment, the CD workflow performs an HTTP health check using:

```text
<APP_URL>/health
```

The request is retried several times before the workflow is considered failed.

### Important endpoint distinction

The current application exposes the backend health endpoint at:

```text
/health
```

and Nginx exposes it externally as:

```text
/api/health
```

The current CD workflow checks:

```text
<APP_URL>/health
```

Therefore, the Azure deployment health-check path and the currently configured Nginx public health path should be reconciled before production deployment is enabled.

This documentation does not treat the Azure deployment as verified until that deployment path has been tested successfully.

---

# 17. Docker Compose and CD

Local development currently uses Docker Compose to build the application services from the repository.

The local architecture is:

```text
Nginx
  ↓
Frontend / Backend
  ↓
PostgreSQL
```

The CD workflow, however, is designed to publish images to GHCR and then use:

```bash
docker compose pull
```

on the Azure VM.

Therefore, the production Compose configuration must reference the published images correctly before Azure deployment is enabled.

Local Docker Compose behavior and production image-pull behavior should not be assumed to be identical.

See:

- [Docker documentation](docker.md)
- [Nginx documentation](nginx.md)
- [Architecture documentation](architecture.md)

for the respective service configurations.

---

# 18. Branch Protection

The repository's protected integration branch should require the aggregate CI check:

```text
ci-success
```

Recommended protections include:

- Require a pull request before merging.
- Require at least one approval.
- Dismiss stale approvals when new commits are pushed.
- Require required status checks to pass.
- Require branches to be up to date before merging where appropriate.
- Require conversation resolution.
- Block force pushes.
- Restrict branch deletion.

The exact protected branch should match the team's current integration workflow.

---

# 19. Development Branch Workflow

Developers should normally:

1. Create or use an appropriate feature/area branch.
2. Make the assigned changes.
3. Push the branch to GitHub.
4. Open a pull request against the project's designated integration branch.
5. Allow CI to run.
6. Address review comments and CI failures.
7. Obtain the required approval.
8. Merge the pull request.

Branches should be kept synchronized with the current integration branch before beginning substantial new work.

The repository currently uses `nginx` as an important integrated application branch, while `main` is also used by the CI/CD workflow. The actual target branch for a pull request should therefore follow the team's current GitHub branch configuration rather than assuming every feature branch must target `main`.

---

# 20. Troubleshooting

| Problem | What to check |
|---|---|
| `ci-success` fails | Open the CI run and inspect the failed job that caused the aggregate check to fail. |
| Secret scan fails | Check for tracked `.env` files or credentials detected by Gitleaks. Remove and rotate exposed secrets as necessary. |
| Database migration job fails | Run the affected migration locally against PostgreSQL and check for SQL errors. |
| Backend lint fails | Run `flake8` locally and correct the reported Python issues. |
| Backend tests fail | Run `pytest -v` from the `backend/` directory and inspect the failing test. |
| `npm ci` fails | Confirm `frontend/package-lock.json` is committed and synchronized with `package.json`. |
| Frontend build fails | Run `npm run build` from `frontend/` and inspect the build error. |
| Docker build fails | Build the affected Dockerfile locally using its service directory as the build context. |
| CD does not publish images | Confirm CI succeeded for the relevant `main` push or run CD manually. |
| Azure deployment is skipped | Confirm `DEPLOY_ENABLED=true` and that the workflow is running against `main`. |
| Azure SSH deployment fails | Check `AZURE_VM_HOST`, `AZURE_VM_USER`, `AZURE_VM_SSH_KEY`, VM SSH access, and `DEPLOY_PATH`. |
| Docker image pull fails on Azure | Confirm the GHCR image exists and that the VM's Docker configuration can access the required package. |
| Deployment health check fails | Verify `APP_URL`, the application's exposed health endpoint, Nginx routing, and the running containers on the VM. |

---

# 21. CI/CD Security

The CI/CD pipeline follows these principles:

- Secrets are not committed to Git.
- `.env` files are blocked from being tracked.
- Gitleaks scans repository history.
- CI uses dedicated test credentials.
- Production credentials remain outside the repository.
- GHCR publishing uses GitHub's `GITHUB_TOKEN`.
- Azure deployment uses a dedicated SSH key.
- Deployment is disabled until explicitly enabled.
- Production deployment should use a dedicated environment and appropriate approval controls.

---

# 22. Current CI/CD Status

| Capability | Status |
|---|---|
| CI on pull requests | Implemented |
| CI on `main` | Implemented |
| CI on `nginx` | Implemented |
| Secret scanning | Implemented |
| Database migration validation | Implemented |
| Backend lint/test | Implemented |
| Frontend lint/test/build | Implemented |
| Docker image build validation | Implemented |
| Aggregate `ci-success` check | Implemented |
| GHCR image publishing | Implemented in CD workflow |
| Azure VM deployment workflow | Implemented/configurable |
| Azure production deployment | Not confirmed as active |
| Production health-check verification | Not confirmed |
| Production Compose/image configuration | Requires verification before enabling deployment |

---

## 23. Related Documentation

- [Architecture](architecture.md)
- [Security](security.md)
- [Docker](docker.md)
- [Nginx](nginx.md)
- [Contributing](../CONTRIBUTING.md)
