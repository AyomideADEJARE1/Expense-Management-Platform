# QA Findings, Observations, Defects and Retests

Findings are evidence-based. QA is not judged by defect count.

## QA-FIND-001 — Duplicate frontend source structures
Classification: Observation. Status: Open.

The repository contains both a root-level React source structure and frontend/src. Docker builds ./frontend, making that tree the apparent containerized frontend. The role of the other tree should be clarified.

## QA-FIND-002 — README does not match the current integrated implementation
Classification: Documentation defect. Status: Open.

The README contains legacy frontend/localStorage-oriented descriptions, while the current implementation is an integrated React/Flask/PostgreSQL application with Docker/Nginx infrastructure.

Required action: update architecture, features, persistence, setup and deployment documentation.

## QA-FIND-003 — Dashboard budget data is not passed to all budget-dependent components
Classification: Historical finding; source correction present. Status: Retest pending.

The earlier reviewed implementation did not pass loaded budget data into all budget-dependent dashboard components. In `integration/deployable-main`, `frontend/src/pages/Dashboard.jsx` now passes `budgets` to `SummaryCards`, `CategoryDonutChart`, and `BudgetOverview`.

This is source-level evidence of a correction, not proof of correct runtime totals. Retest budget utilization, category breakdowns, and dashboard values against known expense/budget records before closing the finding.

## QA-FIND-004 — Expense search navigation uses an inconsistent tab identifier
Classification: Historical finding; source correction present. Status: Retest pending.

The earlier implementation used `transcations` instead of `transactions` for expense search navigation. PR #44 changed the identifier to `transactions` in `frontend/src/App.jsx`.

Retest by searching for an existing expense and selecting the result. Confirm that the Transactions view opens and the intended record is visible.

## QA-FIND-005 — Required date/category filtering is not exposed in the transaction workflow
Classification: Requirement gap; correction proposed in PR #54. Status: Retest pending.

The expense API supports month and category query parameters, but `frontend/src/pages/Transactions.jsx` currently exposes search and an All/Expense type selector only. It does not expose a date/month selector or category selector for filtering the transaction list.

Required action: add accessible date/month and category controls, then execute TC-FLT-001 and TC-FLT-002 with records spanning multiple months and categories.

## QA-FIND-006 — CSV export workflow needs end-to-end verification
Classification: Correction proposed in PR #54; retest pending.

The backend exposes an authenticated CSV endpoint at `/api/expenses/export`. PR #44 also replaces the Reports page print action with a client-side CSV download for the selected report. However, the Transactions page still has no direct CSV action, and no retained browser evidence currently proves that the generated file contains the correct records and fields.

Required action: provide/confirm a user-accessible export workflow, then verify the downloaded CSV opens correctly, includes the expected headers and filtered records, and contains only the authenticated user's data.

## QA-FIND-007 — Category authorization model requires clarification
Classification: Security/authorization observation. Status: Open.

Category routes do not follow the same authentication pattern used by protected expense/budget routes. This may be intentional for shared global categories. If categories are user-owned, authorization requires correction.

Required action: confirm the intended ownership model before classifying it as a confirmed security defect.

## QA-FIND-008 — Deployment workflow and reported AWS environment require reconciliation
Classification: DevOps observation. Status: Open.

Repository deployment configuration historically references Azure VM deployment, while the team reports AWS as the current deployment environment under the tutor's permitted alternative. Configuration and documentation should be reconciled with the actual environment.

This does not mean AWS has failed. Live verification is separately blocked while the instance is paused.

## QA-FIND-009 — Live deployment verification is currently blocked
Classification: Verification blocker. Status: Blocked.

The deployment instance is intentionally paused. Live URL, post-deployment health and deployed routing checks cannot be marked PASS or FAIL until the environment is restored.

## Retest rule
Resolved findings remain in this record. Record the fixing commit/PR, affected test, environment, evidence and result. Successful re-execution is recorded as RETEST PASS.

## Historical QA rule
Git history can reconstruct implementation history, but must not be presented as a functional test unless execution evidence exists.


## QA-FIND-010 — Category write endpoints are not authenticated
Classification: Confirmed security defect. Status: Open. Priority: High.

In `backend/routes/categories.py` on `integration/deployable-main`, the category POST, PUT, and DELETE handlers have no `@jwt_required()` guard. An unauthenticated caller can attempt to create, rename, or delete shared category records. The routes currently model categories as global rather than user-owned, so write access is publicly available.

Required action: agree on the intended category administration model with the team. Then enforce authentication and authorization appropriate to that model, add negative tests for unauthenticated writes, and verify that category deletion cannot damage expenses or leave inconsistent records.

## QA-FIND-011 — Automated test coverage was missing/incomplete
Classification: Confirmed verification gap; initial backend smoke tests proposed in PR #54. Status: Retest pending. Priority: High.

The baseline CI workflow runs `pytest -v` but explicitly treats exit code 5 (no tests collected) as success. The frontend workflow uses `npm test --if-present`, while the integrated frontend `package.json` defines no test script. A prior CI run confirmed that pytest collected zero tests. PR #54 adds initial backend smoke tests for `/health`, unauthenticated access to protected expenses, invalid registration input, and a register → login → own-expenses API path, and configures the backend job to apply migrations before tests.

This is a useful starting suite, not complete coverage. The new CI run must confirm the tests actually collect and pass. Additional coverage is still required for cross-user data isolation, expense/category/budget CRUD, summaries, filters, CSV, invalid payloads, and frontend/browser journeys.

## QA-FIND-012 — Deployment workflow does not align cleanly with Compose image configuration
Classification: Confirmed deployment-configuration inconsistency; correction proposed in PR #54. Status: Retest/configuration review pending. Priority: High.

The CD workflow publishes backend/frontend images to GHCR and later runs `docker compose pull` on the VM. In `docker-compose.yml`, the frontend and backend services specify `build:` contexts but no matching `image:` names for the published GHCR images. The deployment workflow therefore does not explicitly configure Compose to pull the images that the publish job creates.

The workflow health check requests `${APP_URL}/health`, while the integrated Nginx configuration explicitly routes `/api/health` to the backend's `/health` endpoint. The externally checked path must match the deployed routing configuration.

Required action: align Compose image names, publishing tags, and deployment pull behavior; align the health-check URL with the public Nginx route; verify using a deployment or controlled integration environment before marking CD as passing.

## QA-FIND-013 — Root README describes the legacy localStorage-only app
Classification: Confirmed documentation defect; corrected README proposed in PR #54. Status: Review pending.

The root `README.md` on `integration/deployable-main` describes a React/localStorage application and lists a legacy component structure. The current integrated implementation instead uses the frontend under `frontend/`, Flask API routes, PostgreSQL, Docker Compose, and Nginx. This discrepancy can cause a developer or reviewer to follow incorrect setup and persistence instructions.

Required action: rewrite the root README to reflect the actual integrated application, required environment configuration, Docker Compose commands, health endpoints, API routing, current CI/CD limitations, and deployment status.

## QA-FIND-014 — Docker Compose uses development credentials and requires a local backend env file
Classification: Configuration/security observation. Status: Open.

The integrated Compose file defines a fixed PostgreSQL username/password/database in YAML and requires `backend/.env` through `env_file`. The committed `backend/.env.example` uses placeholder values and does not by itself satisfy the required `backend/.env` path. A clean checkout may therefore fail to start until the local env file is created; fixed Compose credentials must remain strictly development-only.

Required action: document the exact setup step or provide a safe environment-file pattern, ensure no real `.env` is committed, and make production credentials configurable through deployment secrets rather than source-controlled defaults.


## QA-FIND-015 — Frontend lint fails on the reviewed integration branch
Classification: Confirmed CI failure. Status: Correction committed; retest pending. Priority: High.

GitHub Actions CI run `38157705137` for the first PR #54 revision failed the frontend lint step with four ESLint errors:
- `frontend/src/pages/Budgets.jsx`: unused `loadAppData`.
- `frontend/src/pages/Categories.jsx`: unused `loadAppData`.
- `frontend/src/pages/Dashboard.jsx`: unused `formatCurrency` import.
- `frontend/src/pages/Transactions.jsx`: unused `X` import.

The follow-up correction branch removes those unused bindings/imports. The next CI run then exposed two backend Flake8 failures in `backend/routes/auth.py`: E302 (one blank line before `@auth_bp.put("/me")`) and E501 (an 80-character error-response line). Both formatting fixes are now committed on PR #54. The next run shows frontend lint/build and backend lint passing, along with migration/schema checks and secret scanning. Docker image builds and the final `ci-success` job were still in progress at the time of this update. Pytest collected zero tests and emitted the configured warning, so backend behavior remains untested by automated tests.

The same CI log reports one high-severity npm dependency vulnerability during `npm ci`. The log excerpt does not identify the affected package; run `npm audit` and record the package, advisory, affected version, and safe remediation before classifying the risk as resolved.


## QA-FIND-016 — Production rate-limit storage is configured as in-memory
Classification: Production-readiness/security observation. Status: Open. Priority: Medium.

The current `backend/extensions.py` creates Flask-Limiter without a `storage_uri`, and the successful CI test run emitted Flask-Limiter's warning that in-memory storage is not recommended for production. In-memory counters are process-local and are not shared between workers or instances, so rate limits can reset or diverge when the app scales or restarts.

Required action: configure a supported shared store (for example, Redis) through deployment configuration for production, document the required setting, and verify rate limiting across the deployed process topology. The CI-only JWT key-length warning should also be removed by using a test signing key of at least 32 bytes; do not reuse CI keys in any real environment.

## QA-FIND-017 — Frontend dependency audit reports one high-severity advisory
Classification: Dependency-security finding. Status: Open. Priority: High pending identification.

The GitHub Actions `npm ci` log reported one high-severity dependency vulnerability. The log excerpt available during this audit did not identify the affected package or advisory, so no package upgrade is recommended blindly.

Required action: run `npm audit` against the exact lockfile revision, record the affected package, advisory, dependency path and fixed version, then apply the smallest compatible update and rerun lint, build, and the audit.
