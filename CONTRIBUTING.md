# Contributing

This guide explains how work is organized and reviewed on Expense Tracker. Read the [architecture](docs/architecture.md) first.

## Branches

| Branch | Role |
|---|---|
| `main` | Protected. Source of the CI/CD deployment. Changes arrive only through reviewed pull requests |
| `nginx` | Integration branch for the Dockerized application. Pull requests may target it, as CI allows |
| `integration/deployable-main` | Integration branch that CI validates before changes are proposed to `main` |
| Working branches | Short-lived branches for one change, created from the branch named in the task |

Do not push directly to `main`. Confirm the target branch in the task or with the project lead before opening a pull request.

Branch names use lowercase words and hyphens, prefixed by type:

| Kind | Pattern | Example |
|---|---|---|
| Feature | `feature/<name>` | `feature/expense-filter` |
| Fix | `fix/<name>` | `fix/csv-export-encoding` |
| Documentation | `docs/<name>` | `docs/qa-findings` |
| CI/CD | `ci/<name>` | `ci/frontend-tests` |
| Infrastructure | `infra/<name>` | `infra/aws-monitoring` |

Include an issue number where one exists, for example `fix/12-login-error`.

## Workflow

1. **Update your copy.** Run `git fetch origin`. Do not clone the repository again if you already have it.
2. **Start from the target branch.** For example: `git checkout -b feature/expense-filter origin/nginx`.
3. **Make a focused change.** Change only the files the task needs. Run `git status` and `git diff` before staging.
4. **Stage files by name.** Use `git add <file>`. Avoid `git add .`, which can include local `.env` files or unrelated changes.
5. **Run the checks for the files you changed** (see below).
6. **Commit with a Conventional Commit message**, for example `docs(nginx): correct the health route`.
7. **Push and open a pull request** against the target branch. Describe what changed, why, how it was tested, and any known limitation. Do not include secrets.
8. **Respond to review and CI.** Fix failing checks. Do not merge your own pull request unless the project lead has authorized it.

To bring a branch up to date with its target:

```bash
git fetch origin
git merge origin/<target-branch>
```

Resolve conflicts locally, rerun the checks, then push.

## Commit messages

Use the Conventional Commits format: `<type>(<optional scope>): <summary>`.

| Type | Use for |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fixes |
| `docs` | Documentation |
| `ci` | CI/CD workflow changes |
| `test` | Tests |
| `refactor` | Restructuring with no intended behavior change |
| `chore` | Maintenance and tooling |
| `security` | Security corrections |
| `ops` | Operations, deployment, and monitoring configuration |

Keep each commit focused. Do not combine unrelated changes.

## Checks

Run the checks for the area you changed. CI runs the same checks on every pull request.

**Backend**

```bash
cd backend
pip install -r requirements.txt
pip install flake8 pytest
flake8 .
pytest -v
```

**Frontend**

```bash
cd frontend
npm ci
npm run lint
npm test
npm run build
```

**Docker and Compose**

```bash
docker compose config
docker compose build
```

**Documentation and all changes**

```bash
git diff --check
```

## Pull request checklist

- [ ] The target branch is the one specified for the task.
- [ ] The change is limited to the task.
- [ ] `git diff --check` passes.
- [ ] The relevant checks above have been run.
- [ ] CI has passed, or the failure is understood and explained in the pull request.
- [ ] No secrets, `.env` files, or private keys are included.
- [ ] Documentation affected by the change has been updated.
- [ ] The pull request description states the known limitations.

Reviewers check correctness, readability, security, database and API compatibility, Docker integration, tests, and documentation.

## Secrets

Never commit passwords, API keys, access tokens, private keys, production credentials, or real `.env` files. The local templates are `.env.example` and `backend/.env.example`, and they contain placeholders only. Create the real files from the templates and keep them untracked. CI blocks tracked `.env` files and runs Gitleaks.

If a secret is committed, revoke or rotate it first. See [security](docs/security.md).

## Local environment

Create the environment files from the templates, then start the stack:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose ps
```

The application is available at `http://localhost/`. Nginx publishes host port 80. The backend and PostgreSQL are reachable only inside the Compose network.

Check the health endpoints:

```bash
curl -i http://localhost/api/health
curl -i http://localhost/api/health/db
```

Inspect the database with the bootstrap account from the root `.env`:

```bash
docker exec expense-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"
```

Do not use `docker compose down -v` unless you intend to delete the local database.

## Documentation

When a change affects behavior, configuration, deployment, or security, update the matching document in the same pull request:

- [Architecture](docs/architecture.md)
- [Docker](docs/docker.md)
- [Nginx](docs/nginx.md)
- [CI/CD](docs/ci-cd.md)
- [Security](docs/security.md)
- [AWS IAM and access model](docs/aws-iam.md)
- [Monitoring](docs/monitoring.md)
- [Backend](backend/README.md)
- [Database](database/README.md)
- [QA documentation](QA/README.md)

Documentation changes should be committed separately from code where practical.
