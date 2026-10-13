# Main repository audit: AyomideADEJARE1/Expense-Management-Platform

- **Audited branch:** `main`, head `77497a52a6eb920caab5a3791bcb4f75c78f9609` (merge of PR #52, 2026-10-10). Unchanged at the time of this audit.
- **Method:** read-only inspection of the upstream repository, and of the PR #54 branch for correction status. No code was run. No live environment was tested.
- **Location:** this file is in PR #53. The corrections are in PR #54.
- **Requirements reference:** the capstone project document ("Expense Tracker Enhanced Version", modes of submission 1 to 9, the DevOps requirements, and the common requirements for architecture, source control, CI/CD, security, monitoring, and documentation).
- **Status terms:**
  - *Confirmed defect* means the defect is present, shown by reading the code or configuration. The branch named in the evidence says which copy was read.
  - *Fixed on PR #54* means the correction is on the PR #54 branch. *Source-verified* means the file was read on the branch. *CI-verified* means a CI run asserts the behavior.
  - *Runtime verification required* means the fix cannot be proven from source. Each runtime check is listed under "Runtime verification still required."
  - *Open* means no correction is on PR #54, and the reason is stated.

## Current changes to main

None since PR #52. The only commit on `main` after the last recorded QA baseline is the merge of PR #52, which fixed the README image-link formatting. PR #53 and PR #54 are both open and unmerged.

## Scope

**Read on `main`:** `README.md`, `docker-compose.yml`, `nginx/default.conf`, `backend/app.py`, `backend/routes/auth.py`, `backend/routes/expenses.py`, `backend/README.md`, `backend/docs/troubleshooting.md`, `backend/requirements.txt`, `database/migrations/001_initial_schema.sql`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `docs/architecture.md`, `docs/ci-cd.md`, `docs/security.md`, `frontend/package.json`, and the frontend and root folder listings.

**Read on the PR #54 branch (`stephen/qa-transaction-fixes`):** `README.md`, `backend/README.md`, `backend/app.py`, `backend/routes/auth.py`, `backend/routes/expenses.py`, `backend/routes/categories.py`, `backend/routes/budgets.py`, `backend/Dockerfile`, `backend/.env.example`, `.env.example`, `docker-compose.yml`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docs/docker.md`, `docs/nginx.md`, `docs/ci-cd.md`, `docs/architecture.md`, `database/README.md`, `ci.yml`, `cd.yml`, and the folder listings of `backend/`, `backend/routes/`, `backend/tests/`, `frontend/`, `database/`, and `database/schema/`.

**Not read:** `backend/routes/summaries.py`, `backend/models/*`, `backend/utils/*`, the frontend source (`App.jsx`, components, pages, services, tests), `frontend/tests/*`, `docs/security.md` on PR #54, `CONTRIBUTING.md`, `backend/docs/troubleshooting.md` on PR #54, and the legacy root `src/` and `public/` trees. The architecture diagram PNG could not be opened. Findings in those areas are not covered here.

## Findings

Severity: **High** means a user-visible failure, a security exposure, a deployment that can silently break, or documentation that would send an operator to a wrong procedure. **Medium** means a correctness, safety, or maintainability gap with a workaround, or a required capstone item that is missing. **Low** means documentation or hygiene.

| ID | Severity | Finding | Evidence | Status on `main` | Status on PR #54 head |
|---|---|---|---|---|---|
| MAIN-001 | High | `/api/health/db` is probably unreachable through Nginx. Nginx sends `/api/*` to the backend without rewriting the path, but Flask mounts the DB check only at `/health/db`. | `nginx/default.conf`: only `location = /api/health` rewrites to `/health`. `backend/app.py`: `@app.get("/health/db")`. | Confirmed defect (configuration-level). | Fixed on PR #54. Nginx has `location = /api/health/db` rewriting to `/health/db`. CI-verified (CI greps both blocks). Runtime verification required. |
| MAIN-002 | High | The CD deploy job targets Azure, while the README says production is AWS EC2. | `cd.yml`: job "Deploy to Azure VM", `AZURE_VM_*` secrets. | Confirmed defect. | Fixed on PR #54. Deploy job is "Deploy to AWS EC2" and uses `AWS_EC2_*` secrets. Source-verified. Runtime verification required. |
| MAIN-003 | High | Secrets and the database password are hardcoded in Compose. `POSTGRES_PASSWORD: expense_password` is set for both `postgres` and `backend`. | `docker-compose.yml` on `main`. | Confirmed defect. | Fixed on PR #54. Compose uses separate bootstrap and runtime roles and requires them through `${VAR:?...}`. CI-verified (asserts the old password is absent). The backend README example was also corrected in commit `228ef20`. |
| MAIN-004 | High | CSV export is vulnerable to spreadsheet formula injection. Category and description values are written unescaped. | `backend/routes/expenses.py` `export_expenses` on `main`: no escaping. | Confirmed defect. | Fixed on PR #54. `safe_csv_cell()` is applied to category and description. Source-verified. Runtime verification required. |
| MAIN-005 | High | Duplicate general budgets are allowed for the same user and month. | `001_initial_schema.sql`: no unique constraint for null categories. | Confirmed defect. | Fixed on PR #54 by migration `003`, plus application checks in `budgets.py`. CI-verified (duplicate insert is rejected with a diagnostic). Runtime verification required on a populated database. |
| MAIN-006 | High | Deleting a category silently turns its budgets into whole-month budgets (`ON DELETE SET NULL`). | `001_initial_schema.sql`: `fk_budgets_category ... ON DELETE SET NULL`. | Confirmed defect. | Fixed on PR #54 by migration `004` (`RESTRICT`), plus a pre-check in `categories.py`. CI-verified (asserts the delete rule). |
| MAIN-007 | High | The backend had no tests, and CI did not fail when none existed. The frontend had no test script, and CI skipped tests. This is QA-FIND-088. | `ci.yml`; no backend test files on `main`; no `test` script in `frontend/package.json`. | Confirmed defect. | Fixed on PR #54. Backend has three test files and runs `pytest` twice, failing on zero tests. Frontend tests are mandatory. CI run `38425755944` passed 71 backend tests twice and 9 frontend tests. These are source-level CI results. |
| MAIN-008 | Medium | The Flask session secret and the JWT signing key are the same value, and nothing checks key strength. | `backend/app.py`: both set from `SECRET_KEY`. | Confirmed defect. | Fixed on PR #54. Separate keys, weak or equal keys are refused in production. Source-verified (branch `cb7a4bd`). |
| MAIN-009 | Medium | The database port is hardcoded to `5432`. | `backend/app.py`: `port=5432`. | Confirmed defect. | Fixed on PR #54. Reads `POSTGRES_PORT`. Source-verified. |
| MAIN-010 | Medium | The `app.run(debug=True)` entry point enables the Werkzeug debugger. | `backend/app.py` `__main__` block. | Confirmed defect. | Fixed on PR #54. The debugger is enabled only for `development`, `dev`, `testing`, and `test`. Source-verified. |
| MAIN-011 | Medium | Expense input validation is weak: `category_id` and `description` are not type-checked, and amount has no finite or upper-bound check. | `backend/routes/expenses.py` `create_expense` on `main`. | Confirmed defect. | Fixed on PR #54. Source-verified. Runtime verification required (API negative tests). |
| MAIN-012 | Medium | The repository contains two copies of the frontend. | Root listing of `main`. | Confirmed defect. | **Partly fixed on PR #54.** Root build files removed: `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`, and `index.html` (commits `bbe3078` to `2fc10c6`). The legacy `src/` and `public/` trees remain. Nothing builds from them. Open: their removal. |
| MAIN-013 | Medium | Migrations are not applied to existing databases. | `docker-compose.yml` mounts only `001`; `cd.yml` has no migration step. | Confirmed defect. | Fixed on PR #54. The deploy job applies `002` to `006` before restarting services. CI-verified for order. Runtime verification required. |
| MAIN-014 | Medium | The deploy job never runs a health check. | `cd.yml` has no deploy step. | Confirmed defect. | Fixed on PR #54. Deploy checks `/api/health` and `/api/health/db`. Source-verified. Runtime verification required. |
| MAIN-015 | Medium | CI does not build the Nginx image. | `ci.yml` `docker-build` matrix. | Confirmed defect. | Fixed on PR #54. The matrix includes `nginx`, and CI runs `nginx -t`. CI-verified. |
| MAIN-016 | Medium | Rate limiting uses in-memory storage. | `docs/security.md`. | Confirmed defect (documented limitation). | Open. A design decision: shared storage, or keep the limitation documented. The README now lists it under limitations. |
| MAIN-017 | Low | `backend/README.md` gives port 8080. | `backend/README.md` on `main`. | Confirmed defect. | Fixed on PR #54 in commit `228ef20`. Source-verified. |
| MAIN-018 | Low | The root `README.md` says Azure is legacy, but `cd.yml` still deploys to Azure. | `README.md` vs `cd.yml`. | Confirmed defect. | Fixed on PR #54. README and CI/CD guide describe AWS only. Source-verified. |
| MAIN-019 | Low | The repository description (GitHub About) still mentions Azure. | GitHub repository metadata. Not a file. | Confirmed defect. | Open. Requires a repository admin. |
| MAIN-020 | Low | The production domain `expense-tracker.live` could not be confirmed. | `README.md`; the web fetch tool cannot open it. | Unverified. | Open. Runtime verification required. |
| MAIN-021 | High | **Introduced on PR #54.** The deploy script hardcodes the image owner `AyomideADEJARE1`, so a deploy run from a fork would pull upstream images instead of its own. | `cd.yml` deploy step: `repo_lower=$(printf '%s' 'AyomideADEJARE1/Expense-Management-Platform' ...)`. | Not present on `main`. | **Open on PR #54.** Fix: replace the literal with `${{ github.repository }}`. The change is in a workflow file, which needs the GitHub App's Workflows permission. |
| MAIN-022 | Medium | The backend container runs as root. The Dockerfile has no `USER` instruction, so an application compromise has root inside the container. | `backend/Dockerfile` on PR #54 (same as `main`). | Confirmed defect. | Fixed on PR #54 in commit `1b8af8a`. A dedicated unprivileged user runs gunicorn. Source-verified. Runtime verification required (`docker exec expense-backend id -u` must not return 0). |
| MAIN-023 | Medium | Categories are shared across all users. Any signed-in user can rename or delete any category, and deletion is refused while any user's expense or budget uses it. This is a privacy and integrity issue against the requirement that users see only their own data. | `backend/routes/categories.py` on PR #54: no owner column, no ownership check, deletion checks all expenses and budgets. | Not read on `main`. Same model in `001_initial_schema.sql`, which has no `user_id` on categories. | **Open.** Requires a product decision (QA-FIND-010): per-user categories, or shared categories with an admin role. The README documents the current behavior as a limitation. |
| MAIN-024 | High | `docs/docker.md` would send operators to the wrong procedure. It says the backend runs `flask run` (the container runs gunicorn), lists migrations 001 to 005 (006 is mounted), uses the retired `expense_user` account, and says the backend gets database settings from `backend/.env`. | `docs/docker.md` on PR #54 before commit `8c2483a`. | Not read on `main`. | Fixed on PR #54 in commit `8c2483a`. Source-verified against `docker-compose.yml` and `backend/Dockerfile`. |
| MAIN-025 | Medium | `docs/nginx.md` gives port 8080 throughout, omits `/api/health/db`, and so does not match the routing. | `docs/nginx.md` on PR #54 before commit `723c7e1`. | Not read on `main`. | Fixed on PR #54 in commit `723c7e1`. Source-verified against `nginx/default.conf`. |
| MAIN-026 | Low | `database/schema/schema.sql` is an unreferenced copy of `001_initial_schema.sql` (same size, 3082 bytes). Two copies of the schema can drift apart. | Folder listing of PR #54; `database/README.md` names only `database/migrations/` as the source. | Not read on `main`. | Fixed on PR #54 in commit `1d1000f`. Migrations are now the only schema source. |
| MAIN-027 | Medium | **Capstone gap:** AWS IAM roles and policies are not documented, although the capstone requires appropriate cloud IAM permissions. | No IAM document in the repository. The README now lists this under limitations. | Open. | Open. Requires the team to write the IAM documentation (instance role, SSH access, security group rules for ports 22, 80, and 443). |
| MAIN-028 | Medium | **Capstone gap:** monitoring is partial. Health endpoints and container health checks exist, but there is no centralized log collection, no server or container alerting, and no uptime monitoring outside the deploy workflow. | `docker-compose.yml` health checks; `cd.yml` deploy health checks; no monitoring configuration in the repository. | Open. | Partly addressed on PR #54: the README "Monitoring" section states what exists and what does not. Implementation remains open. |
| MAIN-029 | Low | **Capstone gap:** no consolidated environment-variables reference. The capstone requires one. | Variables are scattered across the `.env.example` files, Compose, and the README. | Open. | Fixed on PR #54. README has an "Environment variables" table covering both files and the optional `APP_ENV` and `POSTGRES_PORT`. |
| MAIN-030 | Low | **Capstone gap:** the README has no explicit project objectives. The capstone requires "clear project objectives." | `README.md` on `main` describes the project but states no objectives. | Open. | Fixed on PR #54. README has an "Objectives" section taken from the capstone brief. |
| MAIN-031 | Medium | **Capstone gap:** team member names are not recorded anywhere in the repository. The capstone requires them as a submission item. | No team list in `README.md`, `CONTRIBUTING.md`, or `QA/`. | Open. | Open. Requires the team to supply the names. Do not invent them. |
| MAIN-032 | Low | The architecture diagram `docs/Expense Platform System Architecture.png` could not be opened in this audit, so its topology is not checked against the implementation. The text architecture in `docs/architecture.md` and `docs/docker.md` matches the Compose file. | File exists on `main` and PR #54 (1,670,063 bytes). | Unverified. | Open. Requires a visual check by a team member against the topology in `docs/architecture.md`. |
| MAIN-033 | Low | Two capstone-documentation items are not yet verified in the repository: `docs/security.md` on PR #54 and `CONTRIBUTING.md` (feature branches and PR workflow). | Not read on PR #54. | Unverified. | Open. Requires a read of both files. |

## Capstone requirements traceability (summary)

| Capstone requirement | Repository evidence | Status |
|---|---|---|
| Architecture diagram | PNG in `docs/`, text diagrams in `docs/architecture.md` | Present. Diagram not verified (MAIN-032). |
| GitHub repository with README and run steps | `README.md`, "Getting started" | Present. |
| Live URL | README and `docs/ci-cd.md` | Documented. Not verified (MAIN-020). |
| Type and purpose of the application | README intro and objectives | Present (MAIN-030 fixed on PR #54). |
| Clear project objectives | README "Objectives" on PR #54 | Fixed on PR #54 (MAIN-030). |
| Team member names | None | Open (MAIN-031). |
| Enhanced features: authentication, add/edit/delete, categories, monthly summaries, budgets, dashboard charts, filters, CSV export | Routes, frontend pages, README feature list | Present. Category ownership is open (MAIN-023). |
| React frontend, Flask REST API, PostgreSQL, Docker Compose | `frontend/`, `backend/`, `docker-compose.yml` | Present. |
| GitHub Actions CI/CD, Docker image build and deployment | `ci.yml`, `cd.yml` | Present on PR #54. Runtime verification required. |
| Nginx reverse proxy | `nginx/default.conf` | Present. Health route fixed (MAIN-001). |
| Application health checks | `/health`, `/health/db`, Compose health checks | Present. |
| Azure VM deployment (superseded by AWS EC2 team direction) | `cd.yml` on PR #54 | Moved to AWS EC2 (MAIN-002). |
| Secure environment variables | `.env.example` files, `.gitignore`, CI secret scan | Present on PR #54. Hardcoded password removed (MAIN-003). |
| Architecture diagram covers users, internet, cloud, application, database, and CI/CD | Diagram and text architecture | Text covers all six. Diagram not verified (MAIN-032). |
| Source control: feature branches and pull requests | `CONTRIBUTING.md`, PR workflow | Not verified (MAIN-033). |
| No secrets committed | CI secret scan and `.env` check | Present on PR #54. |
| Appropriate cloud IAM permissions | None | Open (MAIN-027). |
| `/health` endpoint, application logs, container health monitoring | Health endpoints, Compose health checks, `docker compose logs` | Partly present. Alerting and centralized logs open (MAIN-028). |
| Documentation: architecture, setup, deployment, environment variables, troubleshooting | `docs/`, README, `database/README.md` | Present on PR #54. Corrections listed in MAIN-024, MAIN-025, MAIN-029. |

## Runtime verification still required

Source reading and CI cannot prove these. Each one matters because the deployed system, not the repository, is what users see.

1. **MAIN-001, public database health route.** `curl -i https://<host>/api/health/db` must return success. Why it matters: the deploy health check depends on this route to decide that a deploy succeeded.
2. **MAIN-002 and MAIN-014, AWS deployment and health checks.** Confirm that the deployed commit or image matches the CI-tested commit, and that both health endpoints pass. Why it matters: a green CI run does not show what runs on the host.
3. **MAIN-004, CSV injection.** Export a description beginning with `=1+1` and open the file in a spreadsheet tool. Why it matters: the source cannot show how a spreadsheet application treats a cell.
4. **MAIN-005 and MAIN-013, migrations on a populated database.** Apply `002` to `006` to a copy of production-like data, including a deliberately duplicated legacy budget. Why it matters: migration 003 is designed to stop on bad data, and only a populated database shows that behavior.
5. **MAIN-006, category delete.** Delete a category that a budget references, and confirm the delete is refused. Why it matters: the rule changes what users can do.
6. **MAIN-011, API validation.** Send string category IDs, non-finite amounts, and oversized amounts. Confirm 400 responses rather than 500. Why it matters: the validation fix is proven only by the responses.
7. **MAIN-022, container user.** Run `docker exec expense-backend id -u` and confirm the result is not `0`. Why it matters: the Dockerfile change is only effective once the image is built and running.
8. **MAIN-023, shared categories.** Create a category as user A, then try to rename and delete it as user B. Why it matters: this confirms the ownership gap in practice.
9. **Browser journeys and downloads.** Registration, sign-in, expense CRUD and ownership, filters, budgets, dashboard totals, and both CSV downloads. Why it matters: unit and CI checks do not test the user path.
10. **Reboot recovery and backup restoration.** Restart the EC2 host and confirm the stack returns. Restore a database backup. Why it matters: `restart: unless-stopped` is configured but not yet tested on the host.
11. **MAIN-016, shared rate limiting.** Confirm the behavior the team accepts, or add shared storage. Why it matters: in-memory limits reset on restart.
12. **MAIN-020, live domain.** Confirm DNS, HTTPS, and certificate status. Why it matters: documentation says the site is live, and the audit could not verify it.
13. **MAIN-032, architecture diagram.** Compare the PNG with the live topology. Why it matters: the diagram is submitted as evidence of the deployed architecture.

## What this audit does not claim

- It does not claim any finding was reproduced at runtime. Every "Fixed on PR #54" status is a source or CI statement until the runtime checks above are recorded.
- It does not confirm that the production site runs any version of the code.
- Findings in the unread files are open questions, not conclusions.
