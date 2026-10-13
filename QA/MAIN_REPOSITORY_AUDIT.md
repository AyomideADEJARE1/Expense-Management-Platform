# Main repository audit: AyomideADEJARE1/Expense-Management-Platform

- **Audited branch:** `main`, head `77497a52a6eb920caab5a3791bcb4f75c78f9609` (merge of PR #52, 2026-10-10). No newer commit on `main` at the time of this update.
- **Method:** read-only inspection of the upstream repository, and of the PR #54 branch to check correction status. No code was run. No live environment was tested.
- **Location:** this file is in PR #53. Corrections are on PR #54. Read the status terms and the finding-ID scheme in [README.md](README.md) first.
- **Requirements:** the approved capstone specification, including the DevOps requirements and the common requirements for architecture, source control, CI/CD, security, monitoring, and documentation.

## Status terms

- **Confirmed defect:** shown in the code or configuration. The evidence column names the branch that was read.
- **Fixed on PR #54:** the correction is on the PR #54 branch. *Source-verified* means the file was read on that branch. *CI-verified* means a CI check asserts the behavior.
- **Runtime verification required:** the fix cannot be proven from source. The checks are listed below. Each one matters because users see the deployed system, not the repository.
- **Open:** no correction is on PR #54. The reason is stated.
- **Delegated:** the item is assigned to a named team role and is not a repository defect.

## Current changes to main

None. The last commit on `main` is the merge of PR #52, which fixed the README image-link formatting. PR #53 and PR #54 are open and unmerged.

## Scope

**Read on `main`:** `README.md`, `docker-compose.yml`, `nginx/default.conf`, `backend/app.py`, `backend/routes/auth.py`, `backend/routes/expenses.py`, `backend/README.md`, `backend/docs/troubleshooting.md`, `backend/requirements.txt`, `database/migrations/001_initial_schema.sql`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `docs/architecture.md`, `docs/ci-cd.md`, `docs/security.md`, `frontend/package.json`, `frontend/src/pages/Dashboard.jsx`, and the root and frontend folder listings.

**Read on PR #54:** the files above that changed, plus `backend/routes/categories.py`, `backend/routes/budgets.py`, `backend/Dockerfile`, `backend/.env.example`, `.env.example`, `docker-compose.yml`, `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/package.json`, `docs/docker.md`, `docs/nginx.md`, `docs/security.md`, `database/README.md`, and the backend, frontend, and database folder listings.

**Not read in this audit:** `backend/routes/summaries.py`, `backend/models/*`, `backend/utils/*`, the frontend source other than `Dashboard.jsx`, `frontend/tests/*`, the large `QA_FINDINGS.md` and `TEAM_ACTION_SUMMARY.md` files, and `CONTRIBUTING.md` on PR #54 (see MAIN-034). The architecture diagram PNG could not be opened (see MAIN-032).

## Findings

Severity: **High** means a user-visible failure, a security exposure, a deployment that can silently break, or documentation that would send an operator to the wrong procedure. **Medium** means a correctness, safety, or required-capability gap with a workaround. **Low** means documentation or hygiene.

| ID | Baseline ref | Severity | Finding | Evidence | Status on `main` | Status on PR #54 |
|---|---|---|---|---|---|---|
| MAIN-001 | — | High | `/api/health/db` is probably unreachable through Nginx. The Nginx `/api/` rule does not rewrite the path, and Flask mounts the database check only at `/health/db`. | `nginx/default.conf` on `main`; `backend/app.py` | Confirmed defect (configuration-level) | Fixed on PR #54. The `location = /api/health/db` rule rewrites to `/health/db`. CI-verified. Runtime verification required |
| MAIN-002 | QA-FIND-008 | High | The deploy job targets Azure, while the project's deployment target is AWS EC2. | `cd.yml` on `main`: job "Deploy to Azure VM", `AZURE_VM_*` secrets | Confirmed defect | Fixed on PR #54. Deploy job is "Deploy to AWS EC2" and uses `AWS_EC2_*` secrets. Source-verified. Runtime verification required |
| MAIN-003 | — | High | Secrets and the database password are hardcoded in Compose: `POSTGRES_PASSWORD: expense_password` for `postgres` and `backend`. | `docker-compose.yml` on `main` | Confirmed defect | Fixed on PR #54. Separate bootstrap and runtime roles, required through `${VAR:?...}`. CI-verified (asserts the old password is absent) |
| MAIN-004 | — | High | CSV export is open to spreadsheet formula injection. Category and description values are written without escaping. | `backend/routes/expenses.py` `export_expenses` on `main` | Confirmed defect | Fixed on PR #54. `safe_csv_cell()` applied to both fields. Source-verified. Runtime verification required |
| MAIN-005 | — | High | Duplicate general budgets are allowed for the same user and month. | `001_initial_schema.sql`: no unique constraint for a null category | Confirmed defect | Fixed on PR #54 (migration 003, plus checks in `budgets.py`). CI-verified. Runtime verification required on a populated database |
| MAIN-006 | — | High | Deleting a category silently turns its budgets into whole-month budgets (`ON DELETE SET NULL`). | `001_initial_schema.sql` | Confirmed defect | Fixed on PR #54 (migration 004 `RESTRICT`, and a pre-check in `categories.py`). CI-verified |
| MAIN-007 | QA-FIND-088 | High | The backend had no tests, and CI passed without them. The frontend had no test script, and CI skipped tests. | `ci.yml` on `main`; no backend test files; no `test` script | Confirmed defect | Fixed on PR #54. Backend has three test files and runs `pytest` twice, failing on zero tests. Frontend test script is `node --test` and is required. CI run `38425755944` passed on the earlier head |
| MAIN-008 | — | Medium | The Flask session secret and the JWT signing key are the same value, and key strength is not checked. | `backend/app.py` on `main` | Confirmed defect | Fixed on PR #54. Separate keys; weak or equal keys refused in production. Source-verified |
| MAIN-009 | — | Medium | The database port is hardcoded to `5432`. | `backend/app.py` on `main` | Confirmed defect | Fixed on PR #54. Reads `POSTGRES_PORT`. Source-verified |
| MAIN-010 | — | Medium | The Werkzeug debugger can be enabled from the entry point. | `backend/app.py` on `main` | Confirmed defect | Fixed on PR #54. Enabled only for `development`, `dev`, `testing`, and `test`. Source-verified |
| MAIN-011 | — | Medium | Expense validation is weak. `category_id` and `description` are not type-checked, and amounts have no finite or upper-bound check. | `backend/routes/expenses.py` on `main` | Confirmed defect | Fixed on PR #54. Source-verified. Runtime verification required (negative API tests) |
| MAIN-012 | QA-FIND-001 | Medium | The repository contains two copies of the frontend: a legacy root copy and the maintained copy in `frontend/`. | Root listing on `main` | Confirmed defect | **Fixed on PR #54.** The root build files and the root `src/` and `public/` folders were removed (29 files). Nothing built from them |
| MAIN-013 | — | Medium | Migrations are not applied to existing databases. | `docker-compose.yml` mounts only 001; `cd.yml` has no migration step | Confirmed defect | Fixed on PR #54. Deploy applies 002 to 006 before restart. CI-verified for order. Runtime verification required |
| MAIN-014 | — | Medium | The deploy job never checks health. | `cd.yml` on `main` | Confirmed defect | Fixed on PR #54. Deploy checks `/api/health` and `/api/health/db`. Runtime verification required |
| MAIN-015 | — | Medium | CI does not build the Nginx image, so a broken `nginx/default.conf` passes CI. | `ci.yml` Docker matrix on `main` | Confirmed defect | Fixed on PR #54. CI builds the Nginx image and runs `nginx -t`. CI-verified |
| MAIN-016 | — | Medium | Rate-limit storage is in memory. Limits reset on restart and are not shared between instances. | `docs/security.md` | Confirmed (documented limitation) | **Open.** Requires a decision: shared storage, or accept and document the limitation. The README and security guide document it |
| MAIN-017 | — | Low | `backend/README.md` gives port 8080. | `backend/README.md` on `main` | Confirmed defect | Fixed on PR #54 (`228ef20`). Source-verified |
| MAIN-018 | QA-FIND-008 | Low | The root README says Azure is legacy, but `cd.yml` still deploys to Azure. | `README.md` vs `cd.yml` | Confirmed defect | Fixed on PR #54. README and CI/CD guide describe AWS only |
| MAIN-019 | — | Low | The repository description (GitHub "About") still mentions Azure. | Repository metadata, not a file | Confirmed defect | **Open.** Requires a repository administrator to edit the description |
| MAIN-020 | QA-FIND-009 | Medium | The production URL `expense-tracker.live` is described as live. The QA baseline says the instance is paused. The audit could not confirm either. | `README.md` on `main`; QA baseline `README.md` | Unverified. Conflicting records | **Open.** PR #54 README and QA README state that live status must be verified. Runtime verification required |
| MAIN-021 | — | High | **Introduced on PR #54.** The deploy script hardcodes the image owner `AyomideADEJARE1`, so a deploy run from a fork pulls the upstream owner's images. | `cd.yml` deploy step on PR #54 | Not present on `main` | **Open.** The line must change to `${{ github.repository }}`. The change is in a workflow file. See "How MAIN-021 is closed" below |
| MAIN-022 | — | Medium | The backend container runs as root. | `backend/Dockerfile` on `main` and PR #54 | Confirmed defect | Fixed on PR #54 (`1b8af8a`). Runtime verification required (`docker exec expense-backend id -u` must not return 0) |
| MAIN-023 | QA-FIND-007 | Medium | Categories are shared across users. Any signed-in user can rename or delete any category, and deletion is refused while any user's data uses it. | `backend/routes/categories.py` on PR #54; `001_initial_schema.sql` has no owner column | Confirmed defect against the privacy requirement | **Open, decision.** Requires a product decision: per-user categories, or shared categories with an admin role. Documented as a limitation in the README and the security guide |
| MAIN-024 | — | High | `docs/docker.md` would send operators to the wrong procedure: it describes `flask run` (the container runs gunicorn), lists migrations 001 to 005 (006 is mounted), and uses the retired `expense_user` account. | `docs/docker.md` on PR #54 before `8c2483a` | Not read on `main` | Fixed on PR #54 (`8c2483a`). Checked against `docker-compose.yml` and `backend/Dockerfile` |
| MAIN-025 | — | Medium | `docs/nginx.md` gives port 8080 throughout and omits `/api/health/db`. | `docs/nginx.md` on PR #54 before `723c7e1` | Not read on `main` | Fixed on PR #54 (`723c7e1`). Checked against `nginx/default.conf` |
| MAIN-026 | — | Low | `database/schema/schema.sql` is an unreferenced copy of migration 001. Two copies of the schema can drift apart. | PR #54 folder listing | Not read on `main` | Fixed on PR #54 (`1d1000f`). Migrations are the only schema source |
| MAIN-027 | — | Medium | **Capability gap.** The AWS IAM roles, policies, and access model were not documented, although the capstone requires appropriate cloud IAM permissions. | No IAM document in the repository | Open | Documented on PR #54 in `docs/aws-iam.md` (`b75b35f`), derived from the code: the app makes no AWS calls and CI holds no AWS keys. **Runtime verification required:** the live account must match the document (root MFA, instance role, security-group rules, CloudTrail) |
| MAIN-028 | — | Medium | **Capability gap.** Monitoring is partial. Health endpoints and container health checks exist, but nothing checks on a schedule, nothing alerts a person, and logs are not centralized. | `docker-compose.yml`; `cd.yml`; no monitoring configuration in the repository | Open | **Partly fixed on PR #54:** log rotation (`0a99243`), host probe script `scripts/healthcheck.sh` (`6c4f8f6`), and `docs/monitoring.md` (`4c23da9`) explaining the gaps. **Open:** an external uptime monitor, an alert channel, centralized logs, and host metrics. These need AWS setup. Runtime verification required |
| MAIN-029 | — | Low | **Capability gap.** No consolidated environment-variable reference, which the capstone requires. | Variables are spread across the templates, Compose, and the README | Open | Fixed on PR #54. The README has an environment-variable table (`4e88259`) |
| MAIN-030 | — | Low | **Capability gap.** No explicit project objectives in the README. | `README.md` on `main` | Open | Fixed on PR #54. The README has an "Objectives" section (`4e88259`) |
| MAIN-031 | — | Low | **Capability gap.** Team member names are not in the repository. | — | Open | **Delegated** to the team lead, who holds the list of active members. Not a repository defect |
| MAIN-032 | — | Low | The architecture diagram PNG (`docs/Expense Platform System Architecture.png`) could not be opened in this audit, so its topology was not checked. The text architecture in `docs/architecture.md` matches the Compose file. | File present on `main` and PR #54 | Unverified | **Delegated** to a team member for a visual check against `docs/architecture.md` and the live topology |
| MAIN-033 | — | Medium | `docs/security.md` was not verified against the code, and it still listed the retired development password. | `docs/security.md` on PR #54 before `867318d` | Confirmed defect | Fixed on PR #54 (`867318d`). Each claim was checked against the code. CSV safety, startup key checks, the non-root container, and the category exception are documented |
| MAIN-034 | — | Medium | `CONTRIBUTING.md` is out of date. It gives port 8080 twice, uses `expense_user` and `expense_db`, and says the frontend has no test script. | `CONTRIBUTING.md` on PR #54 | Confirmed defect | Corrected on PR #54 (see the commit list in the README). **Runtime verification:** none required; documentation only |

## Baseline QA findings (PR #43 record) — status here

These findings come from the `qa-documentation` baseline. They keep their own IDs.

| Finding | Status | Note |
|---|---|---|
| QA-FIND-001 | Fixed on PR #54 (MAIN-012) | Root frontend duplicate removed |
| QA-FIND-002 | Fixed on PR #54 | README rewritten to match the integrated implementation (`4e88259`) |
| QA-FIND-003 | **Confirmed defect, open** | `frontend/src/pages/Dashboard.jsx` on `main` renders `SummaryCards` and `BudgetOverview` without budget data. The loaded budgets are not passed through. Not yet corrected |
| QA-FIND-004 | Open, not verified in this audit | Expense search navigation identifier. Needs a read of the navigation code and a browser check |
| QA-FIND-005 | Open, not verified in this audit | Date and category filter controls in the transaction workflow. The API supports the filters. The UI was not checked |
| QA-FIND-006 | Open, not verified in this audit | CSV export action in the UI. The API endpoint exists. The UI was not checked |
| QA-FIND-007 | Open, decision | Same as MAIN-023 |
| QA-FIND-008 | Fixed on PR #54 (MAIN-002, MAIN-018) | Deployment reconciled to AWS EC2 in the workflow and the docs |
| QA-FIND-009 | Open, pending | Same as MAIN-020. Requires a recorded live check |

## How MAIN-021 is closed

The fix changes one line in `.github/workflows/cd.yml`, the deploy job's `repo_lower=` line:

- **Replace:** `repo_lower=$(printf '%s' 'AyomideADEJARE1/Expense-Management-Platform' | tr '[:upper:]' '[:lower:]')`
- **With:** `repo_lower=$(printf '%s' '${{ github.repository }}' | tr '[:upper:]' '[:lower:]')`

The GitHub app connected to this audit cannot write workflow files, so the change cannot be made automatically. The repository owner can make the change in the GitHub web editor on the `stephen/qa-transaction-fixes` branch, which takes about a minute. Once it is committed to PR #54, merging PR #54 applies it. The status changes to Fixed on PR #54 when that commit exists.

## Runtime verification still required

Source reading and CI cannot prove these. Each check matters because the deployed system is what users see.

1. **MAIN-001, public database health route.** `curl -i https://<host>/api/health/db` must succeed. The deploy health check depends on this route.
2. **MAIN-002 and MAIN-014, AWS deployment.** Confirm the deployed commit or image matches the CI-tested commit, and that both health endpoints pass.
3. **MAIN-004, CSV injection.** Export a description beginning with `=1+1` and open the file in a spreadsheet application. The source cannot show how the application treats the cell.
4. **MAIN-005 and MAIN-013, migrations on populated data.** Apply 002 to 006 to a copy of production-like data that includes a duplicate legacy budget. Migration 003 is designed to stop on that data.
5. **MAIN-006, category delete.** Delete a category that a budget references, and confirm the delete is refused.
6. **MAIN-011, API validation.** Send string category IDs, non-finite amounts, and oversized amounts. Confirm 400 responses, not 500.
7. **MAIN-022, container user.** `docker exec expense-backend id -u` must not return `0`.
8. **MAIN-023, shared categories.** As user A, create a category. As user B, try to rename and delete it. This confirms the gap in practice.
9. **Browser journeys and downloads.** Registration, sign-in, expense CRUD and ownership, filters, budgets, dashboard totals, and both CSV downloads.
10. **Reboot recovery and backup restoration.** Restart the EC2 host and confirm the stack returns. Restore a database backup.
11. **MAIN-016, rate limiting.** Confirm the accepted behavior, or add shared storage.
12. **MAIN-020, live status.** Confirm the live URL, DNS, HTTPS, and certificate, and reconcile with the paused-environment record.
13. **MAIN-027 and MAIN-028, AWS account and monitoring.** Check the account against `docs/aws-iam.md`. Run `scripts/healthcheck.sh` on a schedule and test an alert end to end.
14. **MAIN-032, architecture diagram.** Compare the PNG with the live topology.

## What this audit does not claim

- No "Fixed on PR #54" status is a runtime result. Each one is a source or CI result until the matching runtime check is recorded.
- The audit does not confirm that the production site runs any version of this code.
- Findings in the unread files are open questions, not conclusions.
