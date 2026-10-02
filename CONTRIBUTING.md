# Contributing

This guide explains how the team works on the Expense Management Platform. Read [docs/architecture.md](docs/architecture.md) first for how the system fits together.

## Git workflow

```text
main (protected)  ◄── Pull Request ◄── your working branch
  │                     │
  │                     └─ CI must pass + 1 approval
  └─ every merge: build images → publish → deploy (when enabled)
```

- **`main`** is the only long-lived branch and always holds working, reviewed code. Nobody pushes to it directly.
- All work happens on a **working branch** and reaches `main` through a **pull request**.
- Each team area may keep its own branch (`frontend`, `backend`, `database`, `docker`, `nginx`, `ci-cd`, `azure`, `qa`), or create smaller feature branches.

### Branch naming

| Kind | Pattern | Example |
|---|---|---|
| Area branch | `<area>` | `frontend` |
| Feature | `feature/<issue>-<short-name>` | `feature/4-expense-form` |
| Bug fix | `fix/<issue>-<short-name>` | `fix/3-login-500-error` |
| Docs | `docs/<short-name>` | `docs/api-contract` |

Use lowercase and hyphens.

## Step by step

```bash
# 1. Get the latest main
git checkout main
git pull origin main

# 2. Create (or update) your branch
git checkout -b feature/4-expense-form   # new branch
# or, for an existing branch:
git checkout frontend
git merge origin/main

# 3. Commit small, focused changes
git add <files>
git commit -m "feat(frontend): add expense form"

# 4. Push and open a pull request into main
git push -u origin feature/4-expense-form
```

Then open a pull request on GitHub into `main`, fill in the template and link the issue (`Closes #4`).

### Keep your branch up to date

Merge `main` into your branch often, and always before asking for a review:

```bash
git fetch origin
git merge origin/main
```

Resolve any conflicts locally, run the checks again, and push.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<optional scope>): <short summary>
```

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `ci` | CI/CD workflows |
| `test` | Adding or fixing tests |
| `refactor` | Code change that is not a fix or feature |
| `chore` | Tooling, dependencies, housekeeping |

Examples: `feat(backend): add expense endpoints`, `fix(frontend): handle expired token`, `docs: add API contract`.

## Pull requests

A pull request can be merged when:

1. The **`ci-success`** check is green (see [docs/ci-cd.md](docs/ci-cd.md)).
2. At least **one teammate has approved** it.
3. The branch is **up to date with `main`**.
4. All review conversations are resolved.

Good pull requests are small, focused on one issue, and explain how the change was tested. Reviewers should check that the code is correct and readable, and that it contains no secrets.

## Running checks locally

CI runs these checks automatically, but running them first saves time.

| Area | Command |
|---|---|
| Database | Apply `database/migrations/*.sql` to a local PostgreSQL (see [database/README.md](database/README.md)) |
| Backend | `cd backend && flake8 . && pytest` |
| Frontend | `cd frontend && npm run lint && npm test && npm run build` |
| Docker | `docker build backend` / `docker build frontend` |

## Secrets

Never commit passwords, API keys, tokens or `.env` files. Copy `.env.example` to `.env` for local development. CI blocks tracked `.env` files and scans every pull request for secrets. If a secret is committed by mistake, tell the team and rotate it immediately. See [docs/security.md](docs/security.md).
