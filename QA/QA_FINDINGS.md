# QA Findings, Observations, Defects and Retests

Findings are evidence-based. QA is not judged by defect count.

Latest completed CI checkpoint: PR #54 run `38164855365` passed secret scanning, database migration/schema checks, backend lint, frontend lint/build, 26 backend tests, both Docker image builds, and `ci-success` for commit `94787e0c66f19e7e337a0e8af6ec6629885c9596`. The npm audit report showed zero vulnerabilities after the `source-map-js` patch to `1.2.2`. This is CI evidence for the correction branch, not proof that upstream `main` or the live deployment is fixed or fully tested. Browser-level and live-deployment verification remain pending.

## QA-FIND-001 — Duplicate frontend source structures
Classification: Observation. Status: Open.

The repository contains both a root-level React source structure and frontend/src. Docker builds ./frontend, making that tree the apparent containerized frontend. The role of the other tree should be clarified.

## QA-FIND-002 — README accuracy differs by branch
Classification: Documentation defect. Status: Correction proposed in PR #54; review pending.

The current upstream `main` README already describes the integrated React/Flask/PostgreSQL stack and identifies AWS EC2 as the documented live environment. The `integration/deployable-main` README still contained legacy frontend/localStorage descriptions that did not match its integrated backend and Docker/Nginx implementation.

PR #54 replaces the integration-branch README and preserves the architecture diagram and documented live URL, while explicitly noting the unresolved Azure-vs-AWS capstone requirement. Review the rendered README and verify its links before closing this finding.

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

The upstream `main` branch and the pre-correction integration branch expose search and an All/Expense type selector, but no transaction date/category filter controls. PR #54 now proposes start-date/end-date and category controls, plus matching API query support. The date-range API regression test and frontend build passed in CI run `38164448383`; browser-level filtering verification remains pending.

## QA-FIND-006 — CSV export workflow needs end-to-end verification
Classification: Correction proposed in PR #54; retest pending.

The backend exposes an authenticated CSV endpoint at `/api/expenses/export`, and PR #44 adds a client-side CSV download for the selected report. The Transactions page did not previously offer a direct export action; PR #54 now proposes one for the currently filtered transaction rows. Verify the downloaded file's headers, contents, formula handling, and user-data scope in a browser before closing this finding.

## QA-FIND-007 — Category authorization observation (consolidated)
Classification: Duplicate/overlapping observation. Status: Consolidated into QA-FIND-010.

The category write-authorization issue is tracked as the high-priority finding QA-FIND-010. Do not count this entry as a separate defect. The team still needs to confirm the intended global-category administration model before choosing the authorization implementation.

## QA-FIND-008 — Deployment target conflicts with the supplied capstone specification
Classification: Requirements/deployment mismatch. Status: Open; team/instructor decision required.

The supplied capstone specification requires an Azure Virtual Machine. Upstream `main` documentation describes AWS EC2 as the current live environment, while the CD workflow contains an Azure VM deployment job that the CI/CD documentation describes as legacy/configurable. The supplied requirement document does not itself establish that AWS has been approved as a substitute.

The team must confirm the required submission target with the instructor and provide evidence from that environment. Neither AWS documentation nor Azure workflow code alone proves the Azure deployment requirement has been satisfied.

## QA-FIND-009 — Live deployment verification has not been evidenced in this audit
Classification: Verification gap. Status: Pending.

The upstream README documents `https://expense-tracker.live`, but this audit has not captured a successful browser/API check of the live application. The web retrieval attempt could not access the URL, which is not sufficient evidence that the service is down. Verify the URL manually or with a suitable runtime check, then retain timestamped evidence for page load, login, expense operations, public health, database health, and deployment target.

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

The baseline CI workflow runs `pytest -v` but explicitly treats exit code 5 (no tests collected) as success. The frontend workflow uses `npm test --if-present`, while the integrated frontend `package.json` defines no test script. A prior CI run confirmed that pytest collected zero tests. PR #54 adds backend smoke/regression tests for `/health`, protected expense access, authentication/profile validation, category input types, CSV formula neutralization, invalid monetary values, and category ID validation. It also applies database migrations before tests and removes the CI exception that treated pytest exit code 5 (no tests collected) as success. The expanded suite must pass on the latest commit before this finding can be closed.

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


## QA-FIND-015 — Frontend/backend lint failures on the reviewed integration branch
Classification: Confirmed CI failure. Status: Retest PASS in CI run `38164855365` for lint, tests, frontend build, both Docker builds, and final CI gate. Priority: Historical failure retained for audit trail.

GitHub Actions CI run `38157705137` for the first PR #54 revision failed the frontend lint step with four ESLint errors:
- `frontend/src/pages/Budgets.jsx`: unused `loadAppData`.
- `frontend/src/pages/Categories.jsx`: unused `loadAppData`.
- `frontend/src/pages/Dashboard.jsx`: unused `formatCurrency` import.
- `frontend/src/pages/Transactions.jsx`: unused `X` import.

The follow-up correction branch removes those unused bindings/imports. The next CI run then exposed two backend Flake8 failures in `backend/routes/auth.py`: E302 (one blank line before `@auth_bp.put("/me")`) and E501 (an 80-character error-response line). Both formatting fixes are now committed on PR #54. The early frontend lint and backend Flake8 failures were corrected in PR #54. An expanded CI run then collected 24 tests but failed four registration/profile/budget tests because the shared rate limiter returned HTTP 429 across test cases. PR #54 now resets rate-limit state between tests and removes the CI exception that treated zero collected tests as success. The latest commit must pass CI before this finding can be closed.

The same CI log reports one high-severity npm dependency vulnerability during `npm ci`. The log excerpt does not identify the affected package; run `npm audit` and record the package, advisory, affected version, and safe remediation before classifying the risk as resolved.


## QA-FIND-016 — Production rate-limit storage is configured as in-memory
Classification: Production-readiness/security observation. Status: Open. Priority: Medium.

The current `backend/extensions.py` creates Flask-Limiter without a `storage_uri`, and the successful CI test run emitted Flask-Limiter's warning that in-memory storage is not recommended for production. In-memory counters are process-local and are not shared between workers or instances, so rate limits can reset or diverge when the app scales or restarts.

Required action: configure a supported shared store (for example, Redis) through deployment configuration for production, document the required setting, and verify rate limiting across the deployed process topology. The CI-only JWT key-length warning should also be removed by using a test signing key of at least 32 bytes; do not reuse CI keys in any real environment.

## QA-FIND-017 — Frontend dependency audit reported a high-severity source-map-js advisory
Classification: Dependency-security finding. Status: Retest PASS for current PR #54 frontend lockfile; broader release review pending. Priority: High.

The CI dependency-audit report identified `source-map-js` in the affected range `1.0.0–1.2.1`, with the high-severity event-loop denial-of-service advisory CVE-2026-93749 / GHSA-68fv-2mgg-jv7q. The fixed version is `1.2.2`; the installed copy was transitive, so changing a direct dependency alone would not reliably force the patched version.

PR #54 adds an npm override for `source-map-js` and updates `frontend/package-lock.json` to `1.2.2`. CI run `38164855365` reports `found 0 vulnerabilities` after `npm ci`; the frontend lint/build job also passed. The backend and Docker jobs are still running for that commit, so this finding is verified for the frontend dependency audit, while overall PR verification remains pending.


## QA-FIND-018 — API CSV export can emit spreadsheet formulas from user-controlled text
Classification: Security defect. Status: Formula-neutralization helper tests PASS in CI run `38164448383`; actual file/browser retest pending. Priority: High.

The backend `GET /api/expenses/export` writes expense descriptions and category names directly into CSV cells. CSV quoting alone does not prevent spreadsheet formula execution when a cell begins with characters such as `=`, `+`, `-`, or `@`. The frontend export had the same weakness for formula characters preceded by whitespace.

The correction proposed in PR #54 prefixes potentially executable text cells in both backend and frontend CSV exports and adds regression tests for common formula prefixes. Retest both export paths with descriptions containing formula prefixes and leading whitespace before closing this finding.

## QA-FIND-019 — Non-finite or oversized monetary values can trigger server/database errors
Classification: Input-validation defect. Status: Create-path regression tests PASS in CI run `38164448383`; update-path coverage pending. Priority: Medium.

The expense and budget routes parse numeric input as `Decimal`, but comparing non-finite values such as `NaN` can raise a decimal exception rather than returning a controlled validation response. Values beyond the database column's supported precision can also fail at persistence time.

The correction proposed in PR #54 rejects non-finite values and values at or above the maximum supported amount before database writes. Regression tests now cover non-finite and oversized expense and budget creation values. Update routes still need explicit tests for non-finite and oversized amounts.

## QA-FIND-020 — Category endpoints do not validate JSON field types before string operations
Classification: Input-validation defect. Status: Create-path regression tests PASS in CI run `38164448383`; update-path coverage pending. Priority: Medium.

The category routes call `.strip()` on the supplied category name without first confirming that it is a string, and they pass arbitrary JSON types for descriptions toward persistence. A request with a numeric name or list/object description can therefore produce an unhandled exception instead of a client error.

The correction proposed in PR #54 validates category name and description types on create/update and adds regression tests for invalid create payloads. Update-path type validation and the full category CRUD workflow still need test coverage.


## QA-FIND-021 — Documented production cloud target conflicts with the capstone deployment requirement
Classification: Requirements/deployment mismatch. Status: Open; team decision required. Priority: High for capstone acceptance.

The capstone specification requires deployment to an Azure Virtual Machine. However, the upstream `main` README and `docs/architecture.md` describe the current live production environment as AWS EC2, while `.github/workflows/cd.yml` contains an Azure VM deployment job. `docs/ci-cd.md` explicitly describes the Azure workflow as legacy/configurable and AWS as the actual production environment.

These sources describe different deployment targets. Do not claim the Azure requirement is satisfied merely because Azure-specific workflow code exists. The team must confirm whether the deliverable will be deployed to Azure as required or whether the instructor has approved AWS as a substitute. Update the architecture, README, CI/CD documentation, and evidence only after that decision.

## QA-FIND-022 — Docker Compose contains hard-coded database credentials
Classification: Security/configuration defect. Status: Open. Priority: High before production deployment.

The upstream `main` `docker-compose.yml` hard-codes `expense_user`, `expense_password`, and `expense_db` in both the backend and PostgreSQL service configuration. These values are not secret-safe production configuration, and the backend service's `environment` values override similarly named values from `backend/.env`.

The correction requires a coordinated configuration change: use Compose environment interpolation or a documented secret mechanism, provide safe example values only for local development, ensure the backend and PostgreSQL receive the same configured credentials, and verify a clean checkout can start without committing a real `.env`. Do not deploy until the production password is confirmed to be externally configured rather than relying on the repository defaults.

## QA-FIND-023 — Deployment health check verifies application reachability but not database readiness
Classification: Observability/release-verification gap. Status: Nginx/CD correction proposed in PR #54; runtime route retest pending. Priority: Medium.

The public Nginx health route `/api/health` maps to backend `/health`, which returns `status: ok` without checking PostgreSQL. A separate `/health/db` endpoint checks database connectivity, and Nginx also exposes it as `/api/health/db`; however, the deployment workflow's post-deployment health check currently calls only `/api/health`.

Additionally, the upstream Nginx configuration did not have an exact rewrite for `/api/health/db`; the generic `/api/` proxy passed that path through unchanged, so the backend's `/health/db` endpoint was not reachable at the documented public path. PR #54 adds the exact Nginx route and changes CD to check both `/api/health` and `/api/health/db`. Retest the routes through Nginx and the deployed URL before closing this finding.


## QA-FIND-024 — User-settings migration is not applied consistently by Compose and deployment
Classification: Database/deployment defect. Status: Correction proposed in PR #54; retest pending. Priority: High.

The integration branch adds `database/migrations/002_user_settings.sql` and the User model expects the added settings columns. Before correction, Compose mounted only `001_initial_schema.sql` into PostgreSQL's initialization directory. A fresh database would therefore miss the user-settings columns. In addition, PostgreSQL initialization scripts run only when the data directory is first initialized; simply adding a mount does not update an existing persistent volume.

PR #54 now mounts the second migration for fresh database initialization and runs its idempotent `ADD COLUMN IF NOT EXISTS` statements during deployment so an existing volume can be updated. CI and deployment retests must verify both a clean database and an already-initialized database. Do not rerun the non-idempotent initial schema migration against an existing database.


## QA-FIND-025 — Authentication/profile routes can raise errors for malformed JSON field types
Classification: Input-validation defect. Status: Covered malformed-field, profile, email, and name-limit tests PASS in CI run `38164448383`; broader auth/security coverage pending. Priority: Medium.

The integration branch's registration and login routes call `.strip()` on name/email fields without first validating their JSON types. The profile update route also assumes first and last names are strings, and checks currency membership against a set without first ensuring the supplied value is a string. Numeric, list, or object values can therefore produce unhandled exceptions instead of controlled HTTP 400 responses.

PR #54 now validates registration/login field types, profile name types, and currency types, and adds API regression tests for malformed payloads. Retest all invalid-input cases and confirm they return controlled client errors without a 500 response.


## QA-FIND-026 — Expense and budget endpoints do not validate category ID types
Classification: Input-validation defect. Status: Create-path regression tests PASS in CI run `38164448383`; update-path coverage pending. Priority: Medium.

The expense and budget endpoints passed arbitrary JSON `category_id` values into SQLAlchemy lookups. Arrays, objects, booleans, zero, or negative values could cause unexpected database behavior or unhandled errors rather than a controlled validation response.

PR #54 now requires a positive integer category ID when a category is supplied, while preserving `null` as the supported way to remove a budget's optional category. Regression tests cover malformed category IDs on expense and budget creation. Update-route coverage remains required.


## QA-FIND-027 — Application does not fail closed when a weak signing secret is configured
Classification: Security/configuration risk. Status: Open. Priority: High before production release.

The Flask app assigns `SECRET_KEY` and `JWT_SECRET_KEY` directly from the `SECRET_KEY` environment variable without validating that it is present, sufficiently strong, or different from the placeholder value used in the example environment files. The example placeholder is acceptable only as a value that must be replaced for local setup; it must never be used in production.

Required action: define the production-mode configuration convention, reject missing/default/weak secrets at startup in production, document generation and rotation, and ensure CI uses a separate non-production test key. This audit does not establish that the live production secret is weak; it establishes that the application does not currently enforce a safe value.

## QA-FIND-028 — PostgreSQL port configuration was ignored by the application
Classification: Configuration defect. Status: Code correction included in PR #54; non-default-port verification pending. Priority: Low.

The backend constructs its SQLAlchemy URL from PostgreSQL environment variables but hard-coded port 5432 instead of reading `POSTGRES_PORT`. This made the documented port setting ineffective for non-default database configurations. PR #54 now reads the configured port with 5432 as the default; CI and a non-default-port configuration test should verify the behavior.


## QA-FIND-029 — Authentication tests were coupled through the shared rate limiter
Classification: Test-isolation defect. Status: Retest PASS in CI run `38164448383`; production rate-limit storage remains open under QA-FIND-016. Priority: Medium.

The first expanded CI run returned HTTP 429 in otherwise unrelated registration/profile tests because multiple test cases shared the same process-local five-requests-per-minute registration limit. This was test-state interference, not evidence that the validation assertions themselves were wrong.

PR #54 resets rate-limit state between functional tests. CI run `38164448383` passed all 26 tests, including the cases that previously failed with HTTP 429. Rate-limit behavior should still be verified separately in a dedicated test with explicit limits and controlled state. Production still needs a shared rate-limit store for multi-worker deployment.


## QA-FIND-030 — Budget uniqueness is enforced only in application code
Classification: Data-integrity risk. Status: Open. Priority: Medium.

The budget API checks whether a budget already exists for a user, month, and category before inserting or updating it. The PostgreSQL schema does not define a corresponding uniqueness constraint/index for that business key. Two concurrent requests can therefore both pass the application check and create duplicate budgets.

Required action: inspect existing data for duplicates, then add an appropriate database-level uniqueness strategy for category-specific budgets and whole-month budgets (where `category_id` is NULL). The migration must account for PostgreSQL's NULL uniqueness behavior and must be tested against both a fresh database and an existing database before release.


## QA-FIND-032 — Transaction filtering was limited to a month rather than a date range
Classification: Functional requirement gap. Status: API regression test PASS in CI run `38164448383`; browser retest pending. Priority: Medium.

The first proposed transaction-filter correction added month/category filtering, but the capstone requirement calls for filtering by date and category. A month-only selector cannot isolate an arbitrary start/end period.

PR #54 now proposes start-date and end-date controls in the React transaction view and matching `start_date`/`end_date` query parameters in the Flask expense query (including the authenticated CSV endpoint, which shares the same query builder). Regression tests cover an inclusive date range, reversed ranges, and malformed dates. Browser-level testing remains required.


## QA-FIND-033 — API routes assume JSON request bodies are objects
Classification: Input-validation defect. Status: Regression tests PASS in CI run `38164448383`; broader route coverage pending. Priority: Medium.

Several write routes checked only whether `request.get_json()` returned a truthy value before calling `.get()`. A non-empty JSON array is truthy but has no `.get()` method, which could cause an unhandled exception. PR #54 changes the authentication, category, expense, and budget write routes to reject non-object JSON bodies with HTTP 400 and adds regression tests for those payloads.


## QA-FIND-031 — VM authentication to GitHub Container Registry is not established
Classification: Deployment configuration risk. Status: Open. Priority: Medium.

The CD workflow publishes images to GHCR and the deployment script pulls those images on the VM. The workflow logs in to GHCR on the GitHub Actions runner, but that login does not automatically authenticate the remote VM. If the packages are private, `docker compose pull` will fail unless the VM has a configured read-only package credential. If the packages are public, anonymous pull should be verified explicitly.

Required action: confirm package visibility and test the VM pull from a clean authentication state. If credentials are required, provision a least-privilege read-only token through a secure host-side secret mechanism; do not place it in the repository or print it in logs.


## QA-FIND-034 — Database health probe did not reset a failed SQLAlchemy session
Classification: Reliability defect. Status: Correction proposed in PR #54; retest pending. Priority: Low.

The `/health/db` handler caught database exceptions and returned HTTP 500, but did not roll back the SQLAlchemy session. After a failed query, that session may remain in a failed transaction state and interfere with subsequent operations in the same request context. PR #54 now rolls back the session in the exception path. Verify that a simulated database failure returns an unhealthy status and that the application recovers after database connectivity is restored.


## QA-FIND-035 — Nginx does not set baseline browser security headers
Classification: Security hardening gap. Status: Baseline headers proposed in PR #54; container/browser retest pending. Priority: Medium.

The reviewed Nginx server configuration did not set common response headers to reduce MIME sniffing, framing, referrer leakage, and unnecessary browser permissions. PR #54 adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, a strict referrer policy, and a restrictive permissions policy. Verify these headers on both frontend and API responses through Nginx. HSTS remains an infrastructure-level decision because the container Nginx listener is HTTP-only and TLS is documented as terminating outside the container.


## Cross-branch verification addendum — 2026-10-11

This addendum records a direct comparison of the upstream `main` branch, upstream `integration/deployable-main`, PR #53's documentation branch, and PR #54's correction branch. It supplements the numbered findings above; it does not create duplicate findings.

### Confirmed against upstream `main`

- `backend/routes/categories.py` is unchanged between upstream `main` and `integration/deployable-main` at the time of review (same file blob SHA `0ddfd5fc289b245c5bd3626d83fda7dc19f35070`). Category POST, PUT, and DELETE have no authentication decorator. This remains the existing QA-FIND-010 authorization issue; PR #54 adds field-type validation but does not add authorization. Do not mark it fixed.
- Upstream `main` `docker-compose.yml` still hard-codes the PostgreSQL username/password/database for both backend and database service, and requires `backend/.env`. This remains QA-FIND-022 and the clean-checkout setup concern recorded under QA-FIND-014. Do not duplicate these as new findings.
- Upstream `main` `frontend/src/pages/Transactions.jsx` exposes search and transaction-type selection but no date-range/category controls or direct CSV export action. These remain the requirement gaps in QA-FIND-005/006 and are proposed for correction by PR #54.
- Upstream `main` documents AWS EC2 as production while the supplied capstone PDF requires an Azure VM. This remains QA-FIND-008/021 pending a documented instructor/team decision; Azure workflow code alone is not deployment evidence.
- The upstream `main` Nginx configuration explicitly maps `/api/health` to backend `/health`, but has no exact mapping for `/api/health/db`. PR #54 proposes the missing route and CD check. Runtime verification is still pending.
- The upstream `main` budget model has no database-level uniqueness constraint for (user, month, category), including the separate whole-month budget case when category is NULL. This remains QA-FIND-030; application-level pre-checks alone do not prevent concurrent duplicate inserts.

### PR #54 correction review

The PR #54 head branch contains transaction date-range/category UI and API query support, CSV formula neutralization, stricter JSON and field validation, a strict pytest collection gate, image-name configuration for Compose, a database health route, and baseline Nginx headers. Its recorded CI run reports 26 backend tests passing and zero npm audit vulnerabilities. These results apply to the tested correction commit, not upstream `main` or a live deployment.

Outstanding items explicitly remain: category write authorization, production-safe database credentials, fail-closed production signing-secret validation, shared production rate-limit storage, database-enforced budget uniqueness, VM GHCR pull authentication/visibility, Azure-versus-AWS requirement resolution, and browser/live-deployment verification. No source-level correction should be promoted to PASS until its required retest evidence exists.

### Additional test-coverage action

PR #54 is being extended with a regression test for cross-user expense isolation across the authenticated expense list and CSV export. The test must pass in CI before this coverage gap can be marked covered. This test does not replace the broader requirement for complete CRUD, browser journey, and deployment testing.

## Additional source audit — targeted retest notes (2026-10-11)

### QA-FIND-031 — Category descriptions accept invalid types on the original main branch
Classification: Confirmed input-validation defect. Status: Correction proposed in PR #54; authorization remains open separately.

Evidence: upstream `main` `backend/routes/categories.py` assigns `description = data.get("description")` and passes it to the model without checking that a supplied description is a string. A JSON array/object or other unexpected type can reach persistence and trigger a database/driver exception rather than a controlled 400 response. The PR #54 fork branch validates description types for create and update and returns 400 for non-string values. Retest against the upstream integration target before closing.

### QA-FIND-032 — Category mutation routes have no access-control policy
Classification: Security finding. Status: Open; design decision required.

Evidence: upstream `main` `backend/routes/categories.py` exposes POST, PUT, and DELETE without `@jwt_required()` or an explicit role/owner policy. These operations modify the shared category table. PR #54 improves request validation but does not add authorization. Do not close this finding based on the validation patch. The team must choose between administrator-managed shared categories and user-owned categories, then test unauthenticated, authenticated non-admin, and authorized administrator behavior.

### QA-FIND-033 — Budget duplicate prevention is vulnerable to concurrent requests
Classification: Data-integrity risk. Status: Open.

Evidence: upstream `main` `backend/routes/budgets.py` checks for an existing (user, month, category) budget before inserting, while `backend/models/budget.py` has no corresponding database uniqueness constraint. Two simultaneous requests can both pass the pre-check and insert duplicates. The category-null case also requires explicit treatment because PostgreSQL ordinary UNIQUE constraints permit multiple NULL values. Recommended correction: migration-backed database enforcement appropriate to the supported PostgreSQL version (for example, separate partial unique indexes for non-null category IDs and null-category budgets), duplicate-safe error handling, and a concurrency regression test. Confirm existing duplicate rows before applying a constraint to any existing database.

### QA-FIND-034 — Nginx database-health route differs between main and correction branch
Classification: Deployment/health-check gap. Status: Open on upstream main; correction proposed in PR #54.

Evidence: upstream `main` `nginx/default.conf` has an exact mapping for `/api/health` but no exact mapping for `/api/health/db`. The general `location /api/` forwards the latter path as `/api/health/db` to Flask, whereas the backend health endpoint is `/health/db`; therefore the documented public path is not explicitly mapped to the backend path on main. PR #54 adds the route mapping and checks it in CD. Verify both endpoints through Nginx in a running Compose environment before closure.

### QA-FIND-035 — Compose credentials are hard-coded in the original main branch
Classification: Security/configuration finding. Status: Open on upstream main; correction design still required.

Evidence: upstream `main` `docker-compose.yml` embeds fixed PostgreSQL user/password/database values in both backend and database service configuration. The README warns not to reuse development credentials in production, but the Compose file itself still contains those values. The fork's current correction branch still has the same fixed values. Do not mark this as fixed merely because image names or deployment pull logic changed. Replace secrets with required environment interpolation or a supported secrets mechanism, provide a safe non-production example file, and fail startup when required production secrets are absent. Test fresh setup and existing deployments without exposing real credentials.

### Retest rules
- Keep findings 031–035 separate only where they represent different underlying failure modes; do not duplicate existing CSV/date filtering or general input-validation findings.
- Mark a finding "fixed" only after reviewing the correction on the PR's target branch and recording relevant passing automated/manual evidence.
- CI passing on PR #54 does not prove these remaining findings are fixed; the latest PR #54 run validates the current correction head, not the unchanged upstream `main` or live deployment.

## QA-FIND-036 — JWT-specific secret configuration is ignored
Classification: Security configuration defect. Status: Correction proposed in PR #54; retest and production fail-closed validation pending. Priority: High.

Evidence: in backend/app.py, app.config["JWT_SECRET_KEY"] is assigned from os.getenv("SECRET_KEY"), while the CI workflow provides a separate JWT_SECRET environment variable. As written, the intended JWT-specific environment variable is ignored and both Flask SECRET_KEY and JWT signing use the SECRET_KEY value. This makes the configuration misleading and prevents operators from rotating/configuring the JWT key independently.

Why it matters: a production secret rotation may not change the JWT signing key as expected if the operator changes only JWT_SECRET. It also makes it harder to follow least-privilege/secret-separation practices and can leave tokens signed with an unintended key.

Correction now proposed in PR #54: backend/app.py reads JWT_SECRET_KEY first, then the existing JWT_SECRET variable used by CI, and falls back to SECRET_KEY only for backward compatibility when no dedicated JWT secret is configured. backend/.env.example now documents separate Flask and JWT placeholders. Remaining action: make production startup reject missing/placeholder/weak secrets rather than accepting the compatibility fallback, and add automated tests proving the dedicated JWT variable is honored.

Required regression tests:
- Production configuration fails startup when either required key is missing or is a placeholder.
- Valid distinct SECRET_KEY and JWT secret values are loaded into their respective Flask config keys.
- Changing JWT secret changes the JWT signing configuration; SECRET_KEY alone must not silently override it.
- Non-production test setup remains deterministic without weakening production validation.

Impact if left unresolved: operators may believe they rotated JWT_SECRET while the application continues signing JWTs with SECRET_KEY. This can undermine incident response and create a false sense that production key rotation was completed.

Closure evidence: correction merged to the intended target branch, passing configuration tests, secret-scan success, and a reviewed example/deployment configuration. Until the production fail-closed checks and tests are added, status remains RETEST PENDING. This finding overlaps the broader production-secret enforcement concern but is retained separately because the ignored JWT environment variable is a specific, directly evidenced configuration defect.

