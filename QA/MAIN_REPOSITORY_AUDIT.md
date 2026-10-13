# Main repository audit: AyomideADEJARE1/Expense-Management-Platform

- **Audited branch:** `main`, head `77497a52a6eb920caab5a3791bcb4f75c78f9609` (merge of PR #52, 2026-10-10). Unchanged at the time of this audit.
- **Method:** read-only inspection of the upstream repository. No code was run. No live environment was tested.
- **Location:** this file is in PR #53. The corrections are in PR #54.
- **Status terms:**
  - *Confirmed defect* means the defect is present on `main`, shown by reading the code or configuration.
  - *Fixed on PR #54* means the correction exists on the PR #54 branch. "Source-verified" means the file was read on the branch. "CI-verified" means the CI run asserts the behavior.
  - *Runtime verification required* means the fix cannot be proven from source. The live check is listed under "Runtime verification still required."

## Current changes to main

None since PR #52. The only commit on `main` after the last recorded QA baseline is the merge of PR #52, which fixed the README image-link formatting. PR #53 and PR #54 are both open and unmerged.

## Scope

Read on `main`: `README.md`, `docker-compose.yml`, `nginx/default.conf`, `backend/app.py`, `backend/routes/auth.py`, `backend/routes/expenses.py`, `backend/README.md`, `backend/docs/troubleshooting.md`, `backend/requirements.txt`, `database/migrations/001_initial_schema.sql`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `docs/architecture.md`, `docs/ci-cd.md`, `docs/security.md`, `frontend/package.json`, and the frontend folder listings.

Read on the PR #54 branch (`6c85ad5` before this update): `README.md`, `docs/ci-cd.md`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `nginx/default.conf` (through CI assertions), `backend/app.py`, `backend/routes/expenses.py`, `backend/README.md`, and the root listing.

Not read: `backend/routes/budgets.py`, `summaries.py`, `categories.py`, `backend/models/*`, `backend/utils/*`, the frontend source (`App.jsx`, components, services), `frontend/Dockerfile`, `frontend/nginx.conf`, `backend/Dockerfile`, `docs/docker.md`, `docs/nginx.md`, `CONTRIBUTING.md`, and the legacy root `src/`, `public/` trees. Findings in those areas are not covered here.

## Findings

Severity: **High** means a user-visible failure, a security exposure, or a deployment that can silently break. **Medium** means a correctness, safety, or maintainability gap with a workaround. **Low** means documentation or hygiene.

| ID | Severity | Finding | Evidence on `main` | Status on `main` | Status on PR #54 head |
|---|---|---|---|---|---|
| MAIN-001 | High | `/api/health/db` is probably unreachable through Nginx. Nginx sends `/api/*` to the backend without rewriting the path, but Flask mounts the DB check only at `/health/db`. | `nginx/default.conf`: only `location = /api/health` rewrites to `/health`. `backend/app.py`: `@app.get("/health/db")`. | Confirmed defect (configuration-level). | Fixed on PR #54. Nginx has `location = /api/health/db` rewriting to `/health/db`. CI-verified (CI greps both blocks). Runtime verification required. |
| MAIN-002 | High | The CD deploy job targets Azure, while the README says production is AWS EC2. | `cd.yml`: job "Deploy to Azure VM", `AZURE_VM_*` secrets. | Confirmed defect. | Fixed on PR #54. Deploy job is "Deploy to AWS EC2" and uses `AWS_EC2_*` secrets. Source-verified. Runtime verification required. |
| MAIN-003 | High | Secrets and the database password are hardcoded in Compose. `POSTGRES_PASSWORD: expense_password` is set for both `postgres` and `backend`. | `docker-compose.yml`. | Confirmed defect. | Fixed on PR #54. Compose uses separate bootstrap and runtime roles. CI-verified (asserts the old password is absent). The backend README example was also corrected in commit `228ef20`. |
| MAIN-004 | High | CSV export is vulnerable to spreadsheet formula injection. Category and description values are written unescaped. | `backend/routes/expenses.py` `export_expenses`: no escaping. | Confirmed defect. | Fixed on PR #54. `safe_csv_cell()` is applied to category and description. Source-verified. Runtime verification required (spreadsheet test). |
| MAIN-005 | High | Duplicate general budgets are allowed for the same user and month. | `001_initial_schema.sql`: no unique constraint for null categories. | Confirmed defect. | Fixed on PR #54 by migration `003`. CI-verified (duplicate insert is rejected with a diagnostic). Runtime verification required on a populated database. |
| MAIN-006 | High | Deleting a category silently turns its budgets into whole-month budgets (`ON DELETE SET NULL`). | `001_initial_schema.sql`: `fk_budgets_category ... ON DELETE SET NULL`. | Confirmed defect. | Fixed on PR #54 by migration `004` (`RESTRICT`). CI-verified (asserts the delete rule). |
| MAIN-007 | High | The backend has no tests, and CI does not fail when none exist. The frontend has no test script, and CI skips tests with `--if-present`. This is QA-FIND-088. | `ci.yml`; `backend/` has no test files; `frontend/package.json` has no `test` script. | Confirmed defect. | Fixed on PR #54. The backend runs `pytest` twice and fails on zero tests. Frontend tests are mandatory. CI-verified: run `38425755944` passed 71 backend tests twice and 9 frontend tests. Those results are source-level CI evidence, not runtime evidence. |
| MAIN-008 | Medium | The Flask session secret and the JWT signing key are the same value, and nothing checks key strength. | `backend/app.py`: both set from `SECRET_KEY`. | Confirmed defect. | Fixed on PR #54. `app.py` uses separate keys, rejects weak or equal keys in production, and does not reuse `SECRET_KEY` as the JWT key. Source-verified (branch `cb7a4bd`). |
| MAIN-009 | Medium | The database port is hardcoded to `5432`. | `backend/app.py`: `port=5432`. | Confirmed defect. | Fixed on PR #54. Reads `POSTGRES_PORT`. Source-verified. |
| MAIN-010 | Medium | The `app.run(debug=True)` entry point enables the Werkzeug debugger. | `backend/app.py` `__main__` block. | Confirmed defect. | Fixed on PR #54. The debugger is enabled only for `development`, `dev`, `testing`, and `test`. Source-verified. |
| MAIN-011 | Medium | Expense input validation is weak: `category_id` and `description` are not type-checked, and amount has no finite or upper-bound check. | `backend/routes/expenses.py` `create_expense`. | Confirmed defect. | Fixed on PR #54. Source-verified. Runtime verification required (API negative tests). |
| MAIN-012 | Medium | The repository contains two copies of the frontend. | Root listing of `main`. | Confirmed defect. | **Partly fixed on PR #54.** Removed the legacy root build files: `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`, and `index.html` (commits `bbe3078` to `2fc10c6`). The legacy `src/` and `public/` trees remain, and they are not referenced by any build. Remaining deletion is open. |
| MAIN-013 | Medium | Migrations are not applied to existing databases. | `docker-compose.yml` mounts only `001`; `cd.yml` has no migration step. | Confirmed defect. | Fixed on PR #54. The deploy job applies `002` to `006` before restarting services. CI-verified for order. Runtime verification required. |
| MAIN-014 | Medium | The deploy job never runs a health check. | `cd.yml` has no deploy step. | Confirmed defect. | Fixed on PR #54. Deploy checks `/api/health` and `/api/health/db`. Source-verified. Runtime verification required. |
| MAIN-015 | Medium | CI does not build the Nginx image. | `ci.yml` `docker-build` matrix. | Confirmed defect. | Fixed on PR #54. The matrix includes `nginx`, and CI runs `nginx -t`. CI-verified. |
| MAIN-016 | Medium | Rate limiting uses in-memory storage. | `docs/security.md`. | Confirmed defect (documented limitation). | Not fixed. A design decision is open: shared storage, or keep the limitation documented. |
| MAIN-017 | Low | `backend/README.md` gives port 8080. | `backend/README.md`. | Confirmed defect. | Fixed on PR #54 in commit `228ef20`. Source-verified. |
| MAIN-018 | Low | The root `README.md` says Azure is legacy, but `cd.yml` still deploys to Azure. | `README.md` vs `cd.yml`. | Confirmed defect. | Fixed on PR #54. README and CI/CD guide describe AWS only. Source-verified. |
| MAIN-019 | Low | The repository About description still mentions Azure. | GitHub repository metadata. Not a file. | Confirmed defect. | Open. Requires a repository admin. |
| MAIN-020 | Low | The production domain `expense-tracker.live` could not be confirmed. | `README.md`; web fetch cannot open it. | Unverified. | Unchanged. Runtime verification required. |
| MAIN-021 | High | **New, introduced on PR #54.** The deploy script hardcodes the image owner `AyomideADEJARE1`, so a deploy run from a fork would pull upstream images instead of its own. | `cd.yml` deploy step: `repo_lower=$(printf '%s' 'AyomideADEJARE1/Expense-Management-Platform' ...)`. | Not present on `main`. | **Open on PR #54.** Fix: replace the literal with `${{ github.repository }}`. The change is in a workflow file, so it needs the GitHub App's Workflows permission. |

## Runtime verification still required

Source reading and CI cannot prove these. Each one matters because the deployed system, not the repository, is what users see.

1. **MAIN-001, public database health route.** `curl -i https://<host>/api/health/db` must return success. Without it, the deploy health check could report a broken route. Why it matters: CD relies on this route to decide a deploy succeeded.
2. **MAIN-002 and MAIN-014, AWS deployment and health checks.** Confirm that the deployed commit or image matches the CI-tested commit, and that both health endpoints pass. Why it matters: a green CI run does not show what is running on the host.
3. **MAIN-004, CSV injection.** Export a description beginning with `=1+1` and open the file in a spreadsheet tool. Why it matters: source changes cannot show how the spreadsheet application treats the cell.
4. **MAIN-005 and MAIN-013, migrations on a populated database.** Apply `002` to `006` to a copy of production-like data, including a deliberately duplicated legacy budget. Why it matters: migration 003 is designed to stop on bad data, and only a populated database shows that behavior.
5. **MAIN-006, category delete.** Delete a category that a budget references, and confirm the delete is refused. Why it matters: the rule changes what users can do.
6. **MAIN-011, API validation.** Send string category IDs, non-finite amounts, and oversized amounts. Confirm 400 responses rather than 500. Why it matters: the validation fix is only proven by the responses.
7. **Browser journeys and downloads.** Registration, sign-in, expense CRUD and ownership, filters, budgets, dashboard totals, and both CSV downloads. Why it matters: unit and CI checks do not test the user path.
8. **Reboot recovery and backup restoration.** Restart the EC2 host and confirm the stack returns. Restore a database backup. Why it matters: `restart: unless-stopped` is configured but not yet tested on the host.
9. **MAIN-016, shared rate limiting.** Confirm the behavior the team accepts, or add shared storage. Why it matters: in-memory limits reset on restart.
10. **MAIN-020, live domain.** Confirm DNS, HTTPS, and certificate status. Why it matters: documentation claims the site is live, and the audit could not verify it.

## What this audit does not claim

- It does not claim any finding was reproduced at runtime. Every "Fixed on PR #54" status is a source or CI statement until the runtime checks above are recorded.
- It does not confirm that the production site runs any version of the code.
- Findings in the unread files are open questions, not conclusions.
