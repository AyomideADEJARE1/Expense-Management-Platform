# Contributing

This guide explains how the team works on the Expense Management Platform.

Before contributing, review the [architecture documentation](docs/architecture.md) to understand how the application components fit together.

---

## Git Workflow

Development is done through working branches and pull requests.

The current project uses `nginx` as an important integration branch for the Dockerized application, while `main` remains a protected branch used by the CI/CD workflow.

```text
Working Branch
      |
      | Pull Request
      v
  Integration
   / Branch
      |
      | Reviewed / Tested
      v
    main
```

The exact target branch should follow the current project integration plan and the branch specified by the project lead.

### Branches

The repository may contain area or feature branches such as:

```text
frontend
backend-development
nginx
docker
ci-cd
azure
qa
```

Feature and documentation branches can also be created for focused work.

Do not push directly to protected branches.

---

## Branch Naming

Use descriptive lowercase branch names with hyphens.

| Kind | Pattern | Example |
|---|---|---|
| Feature | `feature/<short-name>` | `feature/expense-form` |
| Bug fix | `fix/<short-name>` | `fix/login-error` |
| Documentation | `docs/<short-name>` | `docs/api-documentation` |
| CI/CD | `ci/<short-name>` | `ci/update-workflow` |
| Infrastructure | `infra/<short-name>` | `infra/docker-network` |

Where an issue number is available, it can be included:

```text
feature/4-expense-form
fix/12-login-500-error
docs/18-api-documentation
```

---

## Step-by-Step Workflow

### 1. Get the repository

If you already have the repository locally, do not clone it again.

Check the current state:

```bash
git status
```

Update remote references:

```bash
git fetch origin
```

### 2. Start from the appropriate base branch

For new work, switch to the branch specified by the project lead.

For example:

```bash
git checkout nginx
git pull origin nginx
```

For work specifically intended for `main`:

```bash
git checkout main
git pull origin main
```

### 3. Create a working branch

For example:

```bash
git checkout -b feature/expense-filter
```

or:

```bash
git checkout -b docs/api-documentation
```

### 4. Make focused changes

Modify only the files required for the task.

Check the working tree regularly:

```bash
git status
```

Review your changes:

```bash
git diff
```

Avoid staging unrelated files.

Prefer:

```bash
git add path/to/file
```

instead of:

```bash
git add .
```

when unrelated or generated files may be present.

### 5. Run appropriate checks

Run the checks relevant to the files you changed.

For example:

```bash
git diff --check
```

For backend changes:

```bash
cd backend
flake8 .
pytest
```

For frontend changes:

```bash
cd frontend
npm run lint --if-present
npm test --if-present
npm run build
```

For Docker changes:

```bash
docker compose config
docker compose build
```

For documentation changes:

```bash
git diff --check
```

### 6. Commit the changes

Use a focused Conventional Commit message:

```bash
git add path/to/changed-file
git commit -m "docs: update API documentation"
```

### 7. Push the branch

```bash
git push -u origin feature/expense-filter
```

### 8. Open a pull request

Open the pull request against the appropriate integration or target branch.

The pull request should:

- Explain what changed.
- Explain why the change was made.
- Identify the relevant issue when applicable.
- Describe how the change was tested.
- Identify any known limitations.
- Avoid including secrets or unrelated changes.

---

## Keeping a Branch Up to Date

Before requesting review, update the working branch against its target branch.

For example, if the target is `nginx`:

```bash
git fetch origin
git merge origin/nginx
```

If the target is `main`:

```bash
git fetch origin
git merge origin/main
```

Resolve conflicts locally, run the relevant checks again, and push the updated branch.

---

## Commit Messages

The project uses the Conventional Commits format:

```text
<type>(<optional scope>): <short summary>
```

Common types include:

| Type | Use for |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `ci` | CI/CD workflow changes |
| `test` | Tests |
| `refactor` | Code restructuring without changing intended behavior |
| `chore` | Maintenance, dependencies, and tooling |

Examples:

```text
feat(backend): add expense filtering
fix(frontend): handle expired JWT
docs: update Docker documentation
ci: update frontend build workflow
refactor(backend): simplify database queries
```

Keep commits focused and avoid combining unrelated changes into a single commit.

---

## Pull Requests

Before requesting review, confirm that:

1. The pull request targets the correct integration branch.
2. The changes are limited to the intended task.
3. `git diff --check` passes.
4. Relevant local tests or builds have been run.
5. CI checks have passed or any failure has been investigated.
6. No secrets have been committed.
7. Review comments have been addressed.
8. The branch is up to date with its target branch when required.

Pull requests should be small enough for another team member to review effectively.

Reviewers should check:

- Correctness.
- Readability.
- Security.
- Database compatibility.
- API compatibility.
- Docker integration where applicable.
- Tests and validation.
- Documentation where applicable.

---

## CI/CD

GitHub Actions provides automated validation for the repository.

The CI workflow runs for pull requests and pushes involving the configured integration branches, currently including:

```text
main
nginx
```

The CI pipeline includes checks for:

- Repository structure.
- Secrets.
- Database initialization.
- Backend dependencies and tests.
- Frontend dependencies, linting, tests when available, and build.
- Docker image builds.

The frontend test command uses:

```bash
npm test --if-present
```

because the frontend currently does not define a test script.

The Docker build stage validates the application images but does not automatically mean that every local merge is deployed to production.

See [CI/CD documentation](docs/ci-cd.md) for the current workflow details.

---

## Running Checks Locally

### Database

The local database is provided by Docker Compose.

Start the application:

```bash
docker compose up -d --build
```

Check the database:

```bash
docker compose ps postgres
```

List database tables:

```bash
docker exec expense-postgres \
  psql -U expense_user -d expense_db -c "\dt"
```

See [database documentation](database/README.md) for database-specific instructions.

### Backend

Install the backend requirements and run the available checks:

```bash
cd backend
pip install -r requirements.txt
flake8 .
pytest
```

The project also provides backend health endpoints:

```text
/health
/health/db
```

### Frontend

From the frontend directory:

```bash
cd frontend
npm ci
npm run lint --if-present
npm test --if-present
npm run build
```

The `--if-present` option allows the commands to succeed when an optional script is not defined.

### Docker

Validate the Compose configuration:

```bash
docker compose config
```

Build the complete application:

```bash
docker compose build
```

Start it:

```bash
docker compose up -d
```

Check service health:

```bash
docker compose ps
```

Test the public application entry point:

```bash
curl http://localhost:8080/api/health
```

See [Docker documentation](docs/docker.md) for the complete Docker workflow.

---

## Secrets

Never commit:

- Passwords.
- API keys.
- Access tokens.
- Private keys.
- Production credentials.
- Local `.env` files containing secrets.

The local backend environment file is:

```text
backend/.env
```

This file must remain untracked.

Do not replace real secrets with fake values inside committed configuration simply to make a build pass. Use the appropriate environment or secret-management mechanism instead.

The CI workflow performs repository secret checks and blocks tracked `.env` files except for explicitly permitted example files.

See [security documentation](docs/security.md) for the project's security guidance.

---

## Docker Development

The local application consists of four Docker Compose services:

```text
Nginx
  |
  +-- Frontend
  |
  +-- Backend
        |
        +-- PostgreSQL
```

The application is accessed through:

```text
http://localhost:8080
```

Only Nginx is published to the host in the current Compose configuration.

The backend and PostgreSQL services communicate through the Docker Compose network.

See [Docker documentation](docs/docker.md) and [Nginx documentation](docs/nginx.md) for implementation details.

---

## Documentation

When a change affects project behavior or infrastructure, update the relevant documentation.

Current documentation includes:

- [Architecture](docs/architecture.md)
- [Docker](docs/docker.md)
- [Nginx](docs/nginx.md)
- [Security](docs/security.md)
- [CI/CD](docs/ci-cd.md)
- [Backend](backend/README.md)
- [Database](database/README.md)

Documentation changes should be committed separately when practical.

---

## Before Opening a Pull Request

Use this checklist:

```text
[ ] Correct target branch selected
[ ] Changes are focused on the intended task
[ ] No unrelated files are staged
[ ] git diff --check passes
[ ] Relevant tests have been run
[ ] Docker configuration validated if applicable
[ ] Documentation updated if necessary
[ ] No secrets committed
[ ] Commit messages follow Conventional Commits
[ ] Branch pushed to GitHub
[ ] Pull request description completed
[ ] CI status checked
```

A clean and focused pull request makes review, integration, and troubleshooting easier for the entire team.
