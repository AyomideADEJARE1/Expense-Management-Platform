# Main repository audit: AyomideADEJARE1/Expense-Management-Platform

- **Audited branch:** `main`, head `77497a52a6eb920caab5a3791bcb4f75c78f9609` (merge of PR #52, 2026-10-10). Unchanged at the time of this audit.
- **Method:** read-only inspection of the files listed under "Scope". No code was run. No live environment was tested.
- **Location:** this file is in PR #53. The corrections are in PR #54.
- **Status key:** *Open on main* means the defect is present on `main`. *Fixed on PR #54 head* means the correction is on the PR #54 branch (`6c85ad5`). *Not checked on PR #54* means the relevant file was not opened there.

## Current changes to main

None since PR #52. The only commit on `main` after the last recorded QA baseline is the merge of PR #52, which fixed the README image-link formatting. PR #53 and PR #54 are both open and unmerged.

## Scope

Read on `main`: `README.md`, `docker-compose.yml`, `nginx/default.conf`, `backend/app.py`, `backend/routes/auth.py`, `backend/routes/expenses.py`, `backend/README.md`, `backend/docs/troubleshooting.md`, `backend/requirements.txt`, `database/migrations/001_initial_schema.sql`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `docs/architecture.md`, `docs/ci-cd.md`, `docs/security.md`, `frontend/package.json`, and the frontend folder listings.

Not read on `main`: `backend/routes/budgets.py`, `summaries.py`, `categories.py`, `backend/models/*`, `backend/utils/*`, the frontend source (`App.jsx`, components, services), `frontend/Dockerfile`, `frontend/nginx.conf`, `backend/Dockerfile`, `docs/docker.md`, `docs/nginx.md`, `CONTRIBUTING.md`. Findings in those areas are not covered here.

## Findings

Severity: **High** means a user-visible failure, a security exposure, or a deployment that can silently break. **Medium** means a correctness, safety, or maintainability gap with a workaround. **Low** means documentation or hygiene.

| ID | Severity | Finding | Evidence on `main` | Status on `main` | Status on PR #54 head |
|---|---|---|---|---|---|
| MAIN-001 | High | `/api/health/db` is probably unreachable through Nginx. Nginx sends `/api/*` to the backend without rewriting the path, but Flask mounts the DB check only at `/health/db`. The docs and troubleshooting guide tell operators to call `/api/health/db`. | `nginx/default.conf`: only `location = /api/health` rewrites to `/health`. `backend/app.py`: `@app.get("/health/db")`. Consequence: `/api/health/db` reaches the backend as `/api/health/db`, which matches no route, so it returns 404. Not confirmed at runtime. | Open | Fixed. Nginx now has `location = /api/health/db` rewriting to `/health/db`. CI asserts this. |
| MAIN-002 | High | The CD deploy job still targets Azure, while the README says production is AWS EC2. A run with `DEPLOY_ENABLED=true` would deploy to the wrong host and use Azure secret names. | `cd.yml`: job "Deploy to Azure VM", secrets `AZURE_VM_HOST`, `AZURE_VM_USER`, `AZURE_VM_SSH_KEY`. `README.md` and `docs/ci-cd.md` say Azure is legacy. | Open | Fixed. Deploy job is "Deploy to AWS EC2" and uses `AWS_EC2_*` secrets. |
| MAIN-003 | High | Secrets and the database password are hardcoded in Compose. `POSTGRES_PASSWORD: expense_password` is set for both `postgres` and `backend`, and it overrides `backend/.env`. Anyone with repository access has the password. | `docker-compose.yml`. | Open | Fixed. Compose uses separate bootstrap and runtime roles. CI asserts the old password is absent. |
| MAIN-004 | High | CSV export is vulnerable to spreadsheet formula injection. Category and description values are written unescaped, so a value beginning with `=`, `+`, `-`, or `@` runs as a formula when the file is opened in Excel. | `backend/routes/expenses.py` `export_expenses`: `writer.writerow([..., expense.description or "", ...])` with no escaping. | Open | Fixed. `safe_csv_cell()` is applied to category and description. |
| MAIN-005 | High | Duplicate general budgets are allowed for the same user and month. Nothing in the schema prevents a second whole-month budget (`category_id IS NULL`), so totals are wrong. | `001_initial_schema.sql`: no unique constraint on `budgets (user_id, month)` for null categories. | Open | Fixed by migration `003`. CI verifies that duplicates are rejected with a clear message. |
| MAIN-006 | High | Deleting a category silently turns its budgets into whole-month budgets, because the foreign key is `ON DELETE SET NULL`. A category budget can become a total budget without any warning. | `001_initial_schema.sql`: `fk_budgets_category ... ON DELETE SET NULL`. | Open | Fixed by migration `004` (`RESTRICT`). CI checks the rule. |
| MAIN-007 | High | The backend has no tests, and CI does not fail when none exist. Pytest exit code 5 (no tests collected) is downgraded to a warning. The frontend has no test script, and CI skips tests with `--if-present`. Passing CI therefore says nothing about behavior. This is QA-FIND-088. | `ci.yml` backend and frontend jobs; `backend/` has no test files; `frontend/package.json` has no `test` script. | Open | Fixed. The backend runs `pytest` twice and fails on zero tests. Frontend tests are mandatory. |
| MAIN-008 | Medium | The Flask session secret and the JWT signing key are the same value, both taken from `SECRET_KEY`. A compromise of one exposes the other, and the code does not check that the key is set or strong. | `backend/app.py`: `SECRET_KEY` and `JWT_SECRET_KEY` both set from `os.getenv("SECRET_KEY")`. | Open | Not checked on PR #54 head. The README requires separate, strong keys, but `app.py` was not opened on the branch to confirm the code change. |
| MAIN-009 | Medium | The database port is hardcoded to `5432`. The code ignores `POSTGRES_PORT`, so a non-default port cannot be configured. | `backend/app.py`: `port=5432`. | Open | Not checked on PR #54 head. |
| MAIN-010 | Medium | The `app.run(debug=True)` entry point enables the Werkzeug debugger. It is safe only on a developer machine. The Docker image starts through a different command, so the risk is local. | `backend/app.py` `__main__` block. | Open | Not checked on PR #54 head. The README says to disable the debugger outside non-production modes. |
| MAIN-011 | Medium | Expense input validation is weak. `category_id` is not type-checked, so a string can reach the database and produce a 500 instead of a 400. `description` is not type-checked. There is no finite-number or upper-bound check on amount. | `backend/routes/expenses.py` `create_expense`. | Open | Fixed. Type, finite, range, and strict date checks are in place. |
| MAIN-012 | Medium | The repository contains two copies of the frontend: a legacy root copy (`src/`, `public/`, `index.html`, `package.json`, `vite.config.js`, `eslint.config.js`) and the maintained copy in `frontend/`. Changes can go to the wrong copy. | Root listing of `main`. The PR #54 README acknowledges the legacy root assets. | Open | Not fixed on PR #54. The README says the legacy files still exist. |
| MAIN-013 | Medium | Migrations are not applied to existing databases. Compose runs them only when a new volume is created, and no deploy step applies later migrations. Schema changes can never reach a populated database. | `docker-compose.yml` mounts only `001`. `cd.yml` has no migration step. | Open | Fixed. The deploy job applies `002` to `006` before restarting services. |
| MAIN-014 | Medium | The production health check does not test the database, and the deploy job never runs a health check. | `cd.yml` has no deploy step; the README says health checks are manual. | Open | Fixed. Deploy checks `/api/health` and `/api/health/db`. |
| MAIN-015 | Medium | CI does not build the Nginx image, so a broken `nginx/default.conf` passes CI. | `ci.yml` `docker-build` matrix contains only `backend` and `frontend`. | Open | Fixed. The matrix includes `nginx`, and CI runs `nginx -t`. |
| MAIN-016 | Medium | Rate limiting uses in-memory storage. Limits reset on restart and are not shared across instances. | `docs/security.md` acknowledges it. | Open | Not fixed. Still listed as a limitation on PR #54. |
| MAIN-017 | Low | `backend/README.md` gives port 8080 for Nginx, but Compose publishes port 80. | `backend/README.md`: `http://localhost:8080`. | Open | Not checked on PR #54 head. |
| MAIN-018 | Low | The root `README.md` says Azure is legacy, but `cd.yml` still deploys to Azure. The documents contradict each other. | `README.md` vs `cd.yml`. | Open | Fixed. README and CI/CD guide now describe AWS only. |
| MAIN-019 | Low | The repository description (GitHub About) still mentions Azure. | GitHub repository metadata. Not a file. | Open | Not a file. Admin action required. |
| MAIN-020 | Low | The production domain `expense-tracker.live` is documented as live, but the audit could not confirm it. HTTPS, DNS, and health checks are unverified. | `README.md`; the web fetch tool cannot open it. | Unverified | Unchanged. The PR #54 README asks for verification. |

## What this audit does not claim

- It does not claim any finding was reproduced at runtime. MAIN-001 in particular is a configuration-level conclusion that needs a live check: `curl -i https://<host>/api/health/db` and `curl -i http://localhost/api/health/db`.
- It does not confirm that the production site runs any version of the code.
- Findings in the unread files are open questions, not conclusions.

## Recommended runtime checks

1. `curl -i http://localhost/api/health` and `curl -i http://localhost/api/health/db` on a local stack from `main`. Expected result: 200 on the first, and 404 on the second if MAIN-001 is real.
2. Export a CSV containing a description starting with `=1+1` and open it in a spreadsheet tool (MAIN-004).
3. Try to create two whole-month budgets for the same month through the API (MAIN-005).
