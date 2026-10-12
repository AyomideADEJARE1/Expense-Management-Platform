# QA Findings, Observations, Defects and Retests

Findings are evidence-based. QA is not judged by defect count.

Latest completed CI checkpoint: PR #54 run `38164855365` passed secret scanning, database migration/schema checks, backend lint, frontend lint/build, 26 backend tests, both Docker image builds, and `ci-success` for commit `94787e0c66f19e7e337a0e8af6ec6629885c9596`. The npm audit report showed zero vulnerabilities after the `source-map-js` patch to `1.2.2`. This is CI evidence for the correction branch, not proof that upstream `main` or the live deployment is fixed or fully tested. Browser-level and live-deployment verification remain pending.

## QA-FIND-001 — Duplicate frontend source structures
Classification: Observation. Status: Open.

The repository contains both a root-level React source structure and frontend/src. Docker builds ./frontend, making that tree the apparent containerized frontend. The role of the other tree should be clarified.

## QA-FIND-002 — README accuracy differs by branch
Classification: Documentation defect. Status: Correction proposed in PR #54; review pending.

The current upstream `main` README already describes the integrated React/Flask/PostgreSQL stack and identifies AWS EC2 as the documented live environment. The `integration/deployable-main` README still contained legacy frontend/localStorage descriptions that did not match its integrated backend and Docker/Nginx implementation.

PR #54 replaces the integration-branch README and preserves the architecture diagram and documented live URL, while noting that the approved deployment target is AWS. Review the rendered README and verify its links before closing this finding.

## QA-FIND-003 — Dashboard budget data is not passed to all budget-dependent components
Classification: Historical finding; source correction present. Status: Retest pending.

The earlier reviewed implementation did not pass loaded budget data into all budget-dependent dashboard components. In `integration/deployable-main`, `frontend/src/pages/Dashboard.jsx` now passes `budgets` to `SummaryCards`, `CategoryDonutChart`, and `BudgetOverview`.

This is source-level evidence of a correction, not proof of correct runtime totals. Retest budget utilization, category breakdowns, and dashboard values against known expense/budget records before closing the finding.

## QA-FIND-004 — Expense search navigation uses an inconsistent tab identifier

Classification: Confirmed frontend defect on upstream main; correction proposed in PR #54. Status: Retest pending.

The current upstream main version of `frontend/src/App.jsx` assigns search results the tab identifier `transcations`, while the rendered page checks for `transactions`. Selecting an expense search result can therefore set an active tab that no page renders. The correction branch changes the identifier to `transactions`.

Required action: Keep the corrected identifier in the reviewed release branch and add a regression check or browser test for selecting an expense search result.

Retest: Log in, search for an existing expense description, select the result, and confirm the Transactions view opens and shows the intended record.

Closure evidence: Tested commit SHA, browser screenshot/video, and a passing regression check where available.

## QA-FIND-005 — Required date/category filtering is not exposed in the transaction workflow
Classification: Requirement gap; correction proposed in PR #54. Status: Retest pending.

The upstream `main` branch and the pre-correction integration branch expose search and an All/Expense type selector, but no transaction date/category filter controls. PR #54 now proposes start-date/end-date and category controls, plus matching API query support. The date-range API regression test and frontend build passed in CI run `38164448383`; browser-level filtering verification remains pending.

## QA-FIND-006 — CSV export workflow needs end-to-end verification
Classification: Correction proposed in PR #54; retest pending.

The backend exposes an authenticated CSV endpoint at `/api/expenses/export`, and PR #44 adds a client-side CSV download for the selected report. The Transactions page did not previously offer a direct export action; PR #54 now proposes one for the currently filtered transaction rows. Verify the downloaded file's headers, contents, formula handling, and user-data scope in a browser before closing this finding.

## QA-FIND-007 — Category authorization observation (consolidated)
Classification: Duplicate/overlapping observation. Status: Consolidated into QA-FIND-010.

The category write-authorization issue is tracked as the high-priority finding QA-FIND-010. Do not count this entry as a separate defect. The team still needs to confirm the intended global-category administration model before choosing the authorization implementation.

## QA-FIND-008 — Deployment target decision and evidence

Classification: Requirements/deployment decision. Status: Target decision recorded; deployment evidence pending.

The earlier audit flagged a mismatch between the capstone deployment requirement as it was initially understood and the AWS EC2 environment documented by the project. The QA owner has now reported that the project tutor approved AWS as an alternative deployment target. AWS EC2 is therefore the target used for this audit and the project documentation should consistently describe AWS.

This resolves the target-choice question for this audit; it does not prove that the latest reviewed commit was deployed successfully. Retain the tutor's approval with the submission records and collect AWS deployment evidence.

Required action: Align the deployment workflow, protected secret names, README, architecture/CI-CD documentation, and submission evidence with AWS EC2. Verify that the deployed instance is running the exact reviewed commit/image and that both public health checks work.

Closure evidence: Tutor approval retained with project records; successful AWS deployment workflow; EC2/container status; tested public URL; and timestamped screenshots/logs.

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

Impact: unauthenticated callers can mutate global categories that other accounts use. The risk includes unauthorized renames and delete attempts against referenced records. The category UI cannot be treated as a security boundary.

Required action: agree on the intended category administration model with the team. Then enforce authentication and authorization appropriate to that model, add negative tests for unauthenticated and unauthorized writes, and verify that category deletion cannot damage expenses or leave inconsistent records. Closure requires a documented shared-category policy, role/ownership checks in the API, and passing API/browser tests.

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


## QA-FIND-021 — Deployment target documentation needs to reflect the approved AWS decision

Classification: Documentation/configuration follow-up. Status: AWS decision recorded; consistency verification pending.

The upstream README and architecture documentation describe AWS EC2 as the current production environment. The QA owner reports that the tutor approved AWS as an alternative target. Earlier notes treating the AWS target as unresolved are superseded by this decision.

Source-review update — 2026-10-12: the correction branch now uses AWS EC2 deployment secrets (`AWS_EC2_HOST`, `AWS_EC2_USER`, `AWS_EC2_SSH_KEY`) and the README/Docker/CI-CD documentation identifies AWS EC2. Source-level target consistency is improved; the live deployment and actual running commit remain unverified.

Required action: Confirm the protected AWS secrets and variables are configured on the target repository, deploy the tested commit, and record the running image digest and public health/browser results.

Closure evidence: Reviewed documentation/workflow diff, successful AWS deployment, and proof the running service matches the tested commit.

## QA-FIND-022 — Docker Compose contains hard-coded database credentials
Classification: Security/configuration defect. Status: Open on upstream main; PR #54 replaces fixed values with required root environment variables, and CI run 38213904072 passes. Clean AWS setup and secret-rotation evidence remain pending. Priority: High before production deployment.

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
Classification: Security/configuration risk. Status: Correction proposed in PR #54; CI passed in run 38213583630; AWS startup/configuration retest pending. Priority: High before production release.

The Flask app assigns `SECRET_KEY` and `JWT_SECRET_KEY` directly from the `SECRET_KEY` environment variable without validating that it is present, sufficiently strong, or different from the placeholder value used in the example environment files. The example placeholder is acceptable only as a value that must be replaced for local setup; it must never be used in production.

Required action: define the production-mode configuration convention, reject missing/default/weak secrets at startup in production, document generation and rotation, and ensure CI uses a separate non-production test key. This audit does not establish that the live production secret is weak; it establishes that the application does not currently enforce a safe value.

Correction status update — 2026-10-12: PR #54 now validates production signing secrets at application startup. Production requires a strong, non-placeholder Flask secret and a separate strong JWT secret; missing, short, placeholder, or identical keys raise a clear startup error. CI tests cover missing/placeholder/short/shared keys, valid distinct keys, and non-production test configuration. CI run `38213583630` passed all eight jobs for source commit `fc96ad9bf7e075907eb31e4d9acee719263d3ccb`; the backend suite passed 47 tests, including the new secret-validation tests. Production startup validation is now CI-verified in this commit; deployed AWS configuration and live startup still require verification.

## QA-FIND-028 — PostgreSQL port configuration was ignored by the application
Classification: Configuration defect. Status: Code correction included in PR #54; non-default-port verification pending. Priority: Low.

The backend constructs its SQLAlchemy URL from PostgreSQL environment variables but hard-coded port 5432 instead of reading `POSTGRES_PORT`. This made the documented port setting ineffective for non-default database configurations. PR #54 now reads the configured port with 5432 as the default; CI and a non-default-port configuration test should verify the behavior.


## QA-FIND-029 — Authentication tests were coupled through the shared rate limiter
Classification: Test-isolation defect. Status: Retest PASS in CI run `38164448383`; production rate-limit storage remains open under QA-FIND-016. Priority: Medium.

The first expanded CI run returned HTTP 429 in otherwise unrelated registration/profile tests because multiple test cases shared the same process-local five-requests-per-minute registration limit. This was test-state interference, not evidence that the validation assertions themselves were wrong.

PR #54 resets rate-limit state between functional tests. CI run `38164448383` passed all 26 tests, including the cases that previously failed with HTTP 429. Rate-limit behavior should still be verified separately in a dedicated test with explicit limits and controlled state. Production still needs a shared rate-limit store for multi-worker deployment.


## QA-FIND-030 — Budget uniqueness is enforced only in application code
Classification: Data-integrity risk. Status: Database uniqueness migration and conflict handling are implemented in PR #54; CI passed in run 38213583630; populated AWS-volume and concurrency verification remain pending. Priority: Medium.

The budget API checks whether a budget already exists for a user, month, and category before inserting or updating it. The PostgreSQL schema does not define a corresponding uniqueness constraint/index for that business key. Two concurrent requests can therefore both pass the application check and create duplicate budgets.

Required action: inspect existing data for duplicates, then add an appropriate database-level uniqueness strategy for category-specific budgets and whole-month budgets (where `category_id` is NULL). The migration must account for PostgreSQL's NULL uniqueness behavior and must be tested against both a fresh database and an existing database before release.

Correction status update — 2026-10-11: PR #54 now adds `database/migrations/003_budget_uniqueness.sql`. It checks for pre-existing duplicates and then creates separate partial unique indexes for non-NULL category budgets and NULL-category whole-month budgets. The budget route now rolls back failed commits and maps SQLAlchemy IntegrityError to HTTP 409 for both create and update. CI tests now check both index names and verify that a duplicate whole-month budget returns 409 without creating a second row.

Remaining verification: CI must pass for the new migration and tests. The migration is deliberately designed to fail with a clear message if existing duplicate rows are found; the team must inspect and resolve such data before retrying. Test both fresh initialization and an existing persistent volume before release. Source changes alone do not close this finding.


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
The tutor-approved deployment target for this audit is AWS EC2. QA-FIND-008 records that decision; AWS deployment evidence is still required.
- The upstream `main` Nginx configuration explicitly maps `/api/health` to backend `/health`, but has no exact mapping for `/api/health/db`. PR #54 proposes the missing route and CD check. Runtime verification is still pending.
- The upstream `main` budget model has no database-level uniqueness constraint for (user, month, category), including the separate whole-month budget case when category is NULL. This remains QA-FIND-030; application-level pre-checks alone do not prevent concurrent duplicate inserts.

### PR #54 correction review

The PR #54 head branch contains transaction date-range/category UI and API query support, CSV formula neutralization, stricter JSON and field validation, a strict pytest collection gate, image-name configuration for Compose, a database health route, and baseline Nginx headers. Its recorded CI run reports 26 backend tests passing and zero npm audit vulnerabilities. These results apply to the tested correction commit, not upstream `main` or a live deployment.

Outstanding items explicitly remain: category write authorization, production-safe database credentials, fail-closed production signing-secret validation, shared production rate-limit storage, database-enforced budget uniqueness, VM GHCR pull authentication/visibility, AWS deployment evidence, and browser/live-deployment verification. No source-level correction should be promoted to PASS until its required retest evidence exists.

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
Classification: Security configuration defect. Status: Correction proposed in PR #54; CI passed in run 38213583630; AWS configuration retest pending. Priority: High.

Evidence: in backend/app.py, app.config["JWT_SECRET_KEY"] is assigned from os.getenv("SECRET_KEY"), while the CI workflow provides a separate JWT_SECRET environment variable. As written, the intended JWT-specific environment variable is ignored and both Flask SECRET_KEY and JWT signing use the SECRET_KEY value. This makes the configuration misleading and prevents operators from rotating/configuring the JWT key independently.

Why it matters: a production secret rotation may not change the JWT signing key as expected if the operator changes only JWT_SECRET. It also makes it harder to follow least-privilege/secret-separation practices and can leave tokens signed with an unintended key.

Correction now proposed in PR #54: backend/app.py reads JWT_SECRET_KEY first, then the existing JWT_SECRET variable used by CI, and falls back to SECRET_KEY only for backward compatibility when no dedicated JWT secret is configured. backend/.env.example now documents separate Flask and JWT placeholders. Correction status update — 2026-10-12: PR #54 now uses `JWT_SECRET_KEY` or `JWT_SECRET` as the dedicated JWT key, only falls back to `SECRET_KEY` outside production, and fails closed in production if the Flask key or dedicated JWT key is missing, weak, a placeholder, or the same value. Automated tests cover those cases and valid distinct values. CI run `38213583630` passed all eight jobs for commit `fc96ad9bf7e075907eb31e4d9acee719263d3ccb`; the backend suite passed 47 tests including the signing-secret cases. Production deployment configuration still needs verification.

Required regression tests:
- Production configuration fails startup when either required key is missing or is a placeholder.
- Valid distinct SECRET_KEY and JWT secret values are loaded into their respective Flask config keys.
- Changing JWT secret changes the JWT signing configuration; SECRET_KEY alone must not silently override it.
- Non-production test setup remains deterministic without weakening production validation.

Impact if left unresolved: operators may believe they rotated JWT_SECRET while the application continues signing JWTs with SECRET_KEY. This can undermine incident response and create a false sense that production key rotation was completed.

Closure evidence: correction merged to the intended target branch, passing configuration tests, secret-scan success, and a reviewed example/deployment configuration. Until the production fail-closed checks and tests are added, status remains RETEST PENDING. This finding overlaps the broader production-secret enforcement concern but is retained separately because the ignored JWT environment variable is a specific, directly evidenced configuration defect.

## QA-FIND-037 — Compose hard-codes database credentials in both services
Classification: Security/configuration. Priority: High; production release blocker. Status: Open on upstream main; PR #54 uses required environment variables and passes CI run 38213904072. Clean setup, AWS secret configuration, and credential-rotation confirmation remain pending.

Evidence reviewed in `docker-compose.yml` on `stephen/qa-transaction-fixes`: the backend environment block sets `POSTGRES_USER=expense_user`, `POSTGRES_PASSWORD=expense_password`, and `POSTGRES_DB=expense_db`; the PostgreSQL service repeats the same fixed values. The backend also loads `backend/.env`, but the later Compose `environment` entries explicitly set these database values, so the fixed Compose values override same-named values from the env file.

Why it matters: operators may believe they configured production database credentials in `backend/.env` while Compose injects the hard-coded values instead. The database may therefore run with predictable credentials even in a deployment intended to use secrets.

Required correction: use one documented source of configuration for both services, such as required Compose interpolation variables or a supported secrets mechanism. Do not silently default production to known credentials. Keep local defaults confined to a clearly local-only override file if needed. Rotate any credential that was used in a reachable environment.

Required tests: inspect the resolved Compose configuration without printing secret values; verify missing production values fail safely; verify both services receive the same configured values; start a fresh test stack; test an existing volume; verify no secret is emitted in logs.

Closure evidence: correction on the target branch, successful clean setup, configuration tests, and a secret scan. A README warning alone is not sufficient.

Correction status update — 2026-10-11: PR #54's correction branch now requires POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB through root Compose environment variables, updates the root .env.example, and updates the README/Docker setup steps. The source correction is committed, but the current CI run and clean-start configuration/runtime checks must pass before this finding can close. If the former fixed password was ever used on a reachable host, rotate it.

## QA-FIND-038 — Duplicate evidence consolidated into QA-FIND-010

This entry describes the same category-write authorization root cause already tracked by QA-FIND-010. Do not count it as a separate defect. QA-FIND-010 is the canonical finding and includes the required policy decision, role enforcement, negative tests, and closure evidence.

## QA-FIND-039 — Rate limiter has no configured shared production storage
Classification: Abuse protection / production configuration. Priority: High for multi-worker deployment. Status: Open.

Evidence reviewed in `backend/extensions.py`: the `Limiter` is initialized with `key_func=get_remote_address` and `default_limits=[]`, with no explicit `storage_uri` or shared storage configuration. The application error handler can return 429, but that alone does not prove that meaningful limits are configured or shared between workers.

Why it matters: with no default limits, protection depends entirely on route-specific decorators. If limits use process-local in-memory storage, separate workers/instances can each grant their own allowance and restarts reset counters. This can weaken protection against brute force or abusive traffic.

Required correction: inventory route-level limit decorators and identify which sensitive endpoints need limits (especially login/registration). Configure explicit, documented limits and shared production storage such as Redis if the app runs across workers/instances. Keep local test behavior explicit and define what happens if the shared store is unavailable.

Required tests: verify limits actually trigger on sensitive endpoints; verify counters are shared across multiple workers/instances; verify restart behavior; test/document shared-store outage behavior; ensure proxy configuration does not let callers spoof the address used for rate-limit keys.

Closure evidence: reviewed route policy, production configuration, multi-worker test results, and operational documentation. Do not mark this fixed merely because the 429 handler exists.

## QA-FIND-040 — Deployment publishes and deploys mutable latest image tags
Classification: Deployment reproducibility / release integrity. Priority: High. Status: Open.

Historical evidence from `.github/workflows/cd.yml` on `stephen/qa-transaction-fixes`: the publish job creates both `sha-<short commit>` and `latest` tags, while the earlier deployment script used mutable `latest` tags and moved the VM source checkout separately. The follow-up correction now targets AWS EC2 and selects the commit-tagged image; this change still needs CI and deployment verification.

Why it matters: the image deployed may not be the exact image produced from the commit whose CI run passed. Concurrent or later publishing can move `latest`, and the VM's source checkout can drift independently of the image. This complicates incident diagnosis and reliable rollback.

Required correction: pass the triggering, tested commit SHA through the deployment job and deploy commit-specific SHA-tagged images and either enforce registry tag immutability or pin the image digest. Pin the VM checkout to the same reviewed commit or remove unnecessary source checkout from the runtime deployment process. Record deployed image digests and implement a documented rollback to the prior known-good digest.

Required tests: workflow verifies the CI-tested SHA is the one published and deployed; VM pulls the intended commit-specific tags or pinned digests; running container image digest matches workflow output; rollback restores the prior version; a later `latest` publication cannot alter the selected release.

Closure evidence: workflow changes, successful release run showing commit and digest, VM/container evidence, and a tested rollback procedure.

## QA-FIND-041 — Database init scripts are manually replayed as migrations
Classification: Deployment reliability / schema migration. Priority: High. Status: Migrations 002–004 are applied explicitly before app restart and pass CI; a formal migration ledger plus populated-volume rollback/recovery proof remain pending.

Evidence reviewed in `.github/workflows/cd.yml`: deployment invokes `docker compose exec -T postgres ... psql ... -f /docker-entrypoint-initdb.d/002_user_settings.sql`. The same SQL file is mounted from `database/migrations` into the PostgreSQL init directory, where scripts are automatically run for a newly initialized data directory. The CD workflow comments that the script is idempotent, but that claim must be verified from the SQL contents and against an existing database.

Why it matters: PostgreSQL's init directory is not a general migration runner for already-initialized volumes. Manually replaying a script can fail if it contains non-idempotent DDL, and deployment can become partially updated if schema changes fail after images have been replaced. A false idempotency assumption risks failed deployments or schema/application mismatch.

Required correction: inspect and test the actual migration for repeatability; preferably use a versioned migration tool with recorded schema versions and explicit failure handling. Back up before production schema changes. Ensure migration failure stops the release and leaves a clear recovery/rollback path.

Required tests: clean database install; apply migration to a populated pre-migration database; replay it safely if repeatability is claimed; simulate migration failure and prove deployment stops; verify backup/restore and application compatibility.

Closure evidence: repeatable migration strategy, fresh/existing-volume test logs, schema version evidence, and tested recovery instructions.

Correction status update — 2026-10-11: PR #54 now applies migration 002 and the new idempotent budget uniqueness migration 003 explicitly on existing volumes. Migration 003 stops deployment with a clear error if duplicate legacy budgets are found. CI has been extended to exercise the duplicate-data guard on a separate test database. This reduces the known risk but does not close the finding until the current CI run passes and a populated existing database is tested. A versioned migration history and recovery proof remain release requirements.

## QA-FIND-042 — Budget creation converts all database failures into HTTP 500
Classification: API error handling / data integrity. Priority: Medium–High. Status: Known budget unique-index violations map to HTTP 409 and rollback/recovery tests pass in CI run 38213583630; unexpected-error runtime verification remains pending.

Evidence reviewed in `backend/routes/budgets.py` on `stephen/qa-transaction-fixes`: the budget creation handler catches every exception raised by `db.session.commit()`, rolls back, and returns the same generic HTTP 500 response. The handler does not distinguish an expected uniqueness conflict from an unexpected database outage or programming error.

Why it matters: after database-level uniqueness is added, a concurrent duplicate request will normally be rejected by the database. If the handler continues to map every commit error to 500, clients receive a server-failure response for a predictable conflict, and monitoring cannot distinguish client conflicts from genuine infrastructure failures. Conversely, returning a conflict for every exception would also conceal real failures.

Required correction: once the budget uniqueness migration is implemented, catch the specific database integrity exception for the relevant uniqueness constraint, roll back, and return a stable HTTP 409 response. Log unexpected exceptions safely on the server without returning SQL, credentials, or stack traces to clients; return a generic 500 for unexpected failures.

Required tests: duplicate budget returns 409; a simulated unexpected database failure returns 500; the SQLAlchemy session is rolled back and remains usable after either path; the response never exposes SQL or secrets.

Closure evidence: implementation commit, targeted tests for both expected and unexpected failures, and successful regression suite.

Correction status update — 2026-10-11: PR #54 now catches SQLAlchemy IntegrityError separately in both budget creation and update, rolls back the session, and returns HTTP 409 only when the database reports one of the two known budget unique-index names. Other integrity violations and unexpected exceptions return a generic HTTP 500. Tests cover the known-index classifier, duplicate general budget response, and simulated unexpected commit failure with rollback/session recovery. The current CI run must pass before this finding is closed.

## QA-FIND-043 — API tests do not establish database isolation between test cases
Classification: Test reliability / reproducibility. Priority: Medium. Status: An autouse guard rejects non-test database names; CI tests pass. Reliable cleanup/repeatability and negative non-test-database verification remain pending.

Evidence reviewed in `backend/tests/test_api_smoke.py` on `stephen/qa-transaction-fixes`: the client fixture toggles Flask testing and rate-limit settings and resets the limiter, but it does not itself create an isolated test database, wrap each test in a transaction that is rolled back, or remove created user/category records. Several tests register users and create globally named categories through the application's configured database.

Why it matters: test cases can leave records behind, collide on category names, depend on execution order, or touch a database other than the intended disposable test database if CI environment configuration changes. A passing run may become flaky when tests are repeated or run in parallel, and a misconfigured local test run could modify a non-test database.

Required correction: prove CI always points to a dedicated disposable test database. Prefer fixtures that create/drop schema or use per-test transactions and rollback; generate unique names where records are expected to persist for the test; clean up state reliably. Add a startup guard that refuses to run destructive test setup if the configured database is not explicitly identified as a test database.

Correction status update — 2026-10-11: PR #54 adds an autouse pytest session guard in backend/tests/conftest.py that refuses to run tests unless the configured database name contains a test/testing marker. CI run 38178811441 passed for the guard commit and collected/passed 31 backend tests against expense_management_test. This reduces the risk of accidentally targeting a normal database, but does not provide per-test transaction isolation or cleanup. The negative non-test-database case and repeated-run/cleanup behavior remain open.

Required tests: run the suite twice consecutively; run relevant tests in a different order or with parallelization where supported; confirm no leftover users/categories after teardown; intentionally point the test configuration at a non-test database and confirm the guard refuses to run.

Closure evidence: CI database service/configuration, isolated fixture implementation, repeated-run output, and proof that tests cannot target the production database accidentally.



## Deployment decision and follow-up verification — 2026-10-11

The QA owner reports that the project tutor approved AWS as an alternative deployment target. AWS EC2 is therefore the target used in this audit. Earlier entries that treated the target choice as unresolved are superseded by this decision; retain the tutor's approval with the project submission evidence.

A follow-up correction was committed to `.github/workflows/cd.yml` on the QA correction branch. It changes the deployment target to AWS EC2, uses AWS-specific secret names, checks out the commit associated with the deployment, and selects commit-tagged container images instead of the mutable latest tag. The workflow expects these GitHub Actions secrets: `AWS_EC2_HOST`, `AWS_EC2_USER`, and `AWS_EC2_SSH_KEY`, plus the existing protected deployment variables such as `DEPLOY_ENABLED`, `APP_URL`, and `DEPLOY_PATH` where configured.

This is a source correction only. Before closure, verify that the required AWS secrets/variables are configured, the EC2 host can fetch the intended commit and pull the GHCR images, the migration succeeds on the existing database volume, and both public health checks pass. Do not publish secret values in evidence.



## QA-FIND-044 — Authentication profile response is stored with the wrong object shape

Classification: Confirmed frontend/API contract defect on upstream main; correction present in PR #54 branch. Status: Retest pending.

Evidence: The backend `/api/auth/me` endpoint returns a standard response envelope containing the profile under `data`. The upstream main `frontend/src/Auth.jsx` assigns the entire API response to the current-user state instead of extracting the profile object. The same file's helper reads name fields directly from the current-user object, so the profile fields are not where the UI expects them to be. This can produce missing/incorrect name or initials and can break components that expect a direct user profile object.

The correction branch reads `response.data || response`, normalizes `full_name` into first/last name fields, and stores a consistent profile object. This is source-level correction evidence, not a browser retest.

Required action: Keep the normalized profile handling in the release branch and verify the current-user contract remains consistent between API response and frontend state.

Retest: Register or log in with a test account, refresh the page, reload the current-user endpoint, and confirm the signed-in state remains valid and the expected user name/initials display correctly.

Closure evidence: Tested commit SHA, API response sample with personal details redacted, browser screenshot, and passing automated/browser regression test where available.



## QA-FIND-045 — Editing a historical budget changes its month to the current month

Classification: Confirmed frontend/backend behavior defect on the reviewed source; correction proposed in PR #54. Status: Retest pending. Priority: Medium–High; financial record integrity.

Evidence: In upstream main, `frontend/src/pages/Budgets.jsx` builds the request month from the current date for both new and edited budgets. The backend `PUT /api/budgets/<budget_id>` accepts that month and assigns it to the existing budget record. Therefore, editing an older month's budget can move it into the current month instead of changing only its amount. This can distort historical budget reports and create confusing duplicate-budget conflicts.

Correction: The correction branch now preserves `editingBudget.month` when editing and uses the current month only when creating a new budget. Fixing commit: `666d79911d480eea2eec4e0d6e84711ef957ca97`.

Retest: Create or seed a budget for a past month, edit only its amount, save, reload the page, and verify the month remains unchanged. Also create a new budget and verify it still defaults to the current month. Check the API response and database row for both cases.

Closure evidence: CI result for the fixing commit, browser/API test output, before-and-after budget month values, and tested commit SHA. The source correction is not a pass until the retest succeeds.


## QA-FIND-046 — Budget form allows editing a spending value that is not saved

Classification: Confirmed UI/API contract mismatch on the reviewed source; correction proposed in PR #54. Status: Retest pending. Priority: Low–Medium; user clarity and data consistency.

Evidence: The budget modal displays an editable “Amount Already Spent” field, but the save payload contains only the category, budget amount, and month. The entered spending value is not sent to the API or persisted. Actual spending is derived from recorded expenses, so the editable field incorrectly suggests the user can set a value that the application ignores.

Correction: The correction branch makes the spending field read-only and adds helper text explaining that the value is calculated from recorded expenses. Fixing commit: `e767d59418efdd37b5221af27b421cb413689ea7`.

Retest: Open the create and edit budget modals. Confirm the spending value cannot be changed, helper text is visible, saving the budget updates only the spending limit, and the displayed spent amount matches the recorded expense data after reload.

Closure evidence: CI result for the fixing commit, browser screenshot, and comparison between displayed spending and the API/expense records. Source correction alone is not a pass.


## QA-FIND-047 — Duplicate evidence consolidated into QA-FIND-010

This entry repeats the unauthenticated category mutation finding. Do not count it as a separate defect. Use QA-FIND-010 as the canonical finding; QA-FIND-047 is retained only as a cross-reference so earlier review notes remain traceable.

## QA-FIND-048 — Frontend CI has no automated test script

Classification: Confirmed automated-coverage gap. Status: Open. Priority: Medium; release confidence.

Evidence: The reviewed `frontend/package.json` defines `dev`, `build`, `lint`, and `preview`, but no `test` script. The CI workflow uses `npm test --if-present`, which succeeds without running tests when the script is absent.

Impact: A green frontend CI result proves the configured lint/build checks passed, but it does not prove that login state, navigation, forms, budget editing, charts, or CSV-related UI interactions behave correctly.

Required correction: Add a suitable frontend test runner and tests for the highest-risk user flows, or add a documented browser automation job. Once a test script is introduced, CI should execute it as a required check rather than silently skipping it.

Retest: Verify the CI log explicitly shows tests executed and a non-zero test count. Include at least the profile refresh, expense-search navigation, budget create/edit, and validation cases. Add browser end-to-end coverage for the key complete user journeys.

Closure evidence: Test script and test files, CI log showing the test command and count, and results for the covered flows.

## QA-FIND-049 — Docker Compose port documentation disagrees with the actual port mapping

Classification: Documentation/reproducibility finding. Status: Correction proposed in PR #54; verify remaining documentation references. Priority: Low–Medium.

Evidence: The Compose file publishes Nginx as `80:80`, while parts of `docs/docker.md` describe `8080:80` and instruct the reader to open `localhost:8080`. The README describes `http://localhost/`. These instructions cannot all be correct for the same Compose configuration.

Impact: A new developer may open the wrong URL or assume the stack failed to start. This wastes setup time and can lead to inaccurate QA evidence.

Required correction: Keep the documented URL and port mapping consistent across Compose, README, Docker guide, and screenshots. If the host port is changed, update all references.

Retest: Start the stack from a clean checkout and follow only the written instructions. Confirm the stated URL returns the frontend and the documented API health route.

Closure evidence: Reviewed documentation diff and a clean-start result using the documented URL.

## QA-FIND-050 — Nginx security headers do not yet include a Content Security Policy

Classification: Security-hardening observation. Status: Open; CSP policy and HTTPS/HSTS behavior need review. Priority: Medium.

Evidence: The reviewed `nginx/default.conf` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`, but does not set a Content-Security-Policy header. HSTS is also not present in the reviewed config.

Impact: Without a suitable CSP, the browser has fewer restrictions against unexpected script/resource execution if an injection flaw is introduced. HSTS is relevant only when the public site is served over HTTPS; it must not be enabled blindly on a plain-HTTP endpoint.

Required correction: Review frontend asset requirements and add a tested, restrictive CSP that does not break the React app. Configure HSTS at the HTTPS termination layer only after confirming HTTPS is enforced and subdomain/preload scope is appropriate. Preserve the existing security headers.

Retest: Inspect response headers from the public HTTPS URL and run browser smoke tests for login, navigation, and API requests under the CSP. Confirm there are no unexplained CSP violations.

Closure evidence: Header capture from the deployed HTTPS endpoint, reviewed CSP policy, and browser test evidence. Do not report HSTS as enabled unless observed on HTTPS responses.


## QA-FIND-051 — Login/register rate limits may group all users behind Nginx

Classification: Confirmed proxy-aware rate-limit configuration gap. Status: Open. Priority: Medium–High; availability and abuse prevention.

Evidence: The authentication routes apply a limit of five requests per minute to registration and login. The limiter uses Flask-Limiter's `get_remote_address`. The reviewed backend does not configure trusted-proxy handling, while Nginx forwards requests to the backend and sets X-Forwarded-For. Without a deliberately configured trusted-proxy policy, Flask may see the Nginx container address as the remote address for all users. This can make legitimate users share the same small request limit and allow one client's repeated attempts to affect other users. The limiter also uses its default in-memory storage unless production storage is configured.

Impact: Login and registration can be throttled for unrelated users, and the rate limit can reset on restart or differ between workers. Rate limiting may therefore be both too broad and inconsistent in production.

Required correction: Backend/DevOps must configure proxy trust only for the known Nginx hop(s), using the correct trusted proxy count and ensuring the edge proxy overwrites/appends forwarding headers safely. Configure shared production rate-limit storage and document behavior if that store is unavailable. Do not blindly trust arbitrary client-supplied X-Forwarded-For values.

Retest: Send login/register attempts through the public Nginx endpoint from two independent client addresses. Confirm each client's limit is tracked separately, excess requests receive 429, and the second client remains usable. Repeat across workers/restarts to verify shared storage behavior.

Closure evidence: Reviewed proxy configuration, rate-limit storage configuration, automated or controlled test results from separate client addresses, response codes, and deployed commit/version.


## QA-FIND-052 — Category deletion maps every database failure to a conflict

Classification: API error handling / operational diagnosis. Status: Correction proposed in PR #54; CI and retest pending. Priority: Medium.

Evidence: Upstream main's category delete handler catches every exception from the database commit and returns HTTP 409 with a message saying the category is used by an expense. That response is only accurate for the relevant expense foreign-key violation. A database outage or unexpected programming error would be mislabeled as a user conflict.

Impact: Clients and monitoring cannot distinguish a category that is genuinely in use from a server/database failure. Users may be told to change their data when the actual problem is an unavailable database.

Correction: PR #54 now catches SQLAlchemy IntegrityError, checks for the specific foreign-key constraint name fk_expenses_category, and returns HTTP 409 only for that known case. Other integrity errors and unexpected exceptions return a generic HTTP 500. The handler rolls back before returning.

Retest: Attempt to delete a category referenced by an expense and verify HTTP 409 with the category-in-use message. Then simulate a database commit failure and verify HTTP 500, no internal error details in the response, the category remains available, and a subsequent valid delete succeeds.

Closure evidence: Passing CI for the fixing commit, API test results for both paths, session recovery result, and tested commit SHA.

Retest update — 2026-10-11: the first category-delete regression test exposed that SQLAlchemy tried to null a non-null expense category reference, producing HTTP 500 instead of 409. PR #54 now checks for referencing expenses before deletion and sets passive_deletes=True so the database RESTRICT constraint can handle a concurrent reference safely. CI run 38179293397 passed for code commit 2f13cac6da1a02a776f3cea206f98522e25eb940. The backend suite passed both category deletion tests, and all eight CI jobs passed. The remaining open part is runtime verification against the deployed database and user-facing flows.


## QA-FIND-053 — Docker build contexts lacked ignore rules for local environment files

Classification: Secret exposure / container build hygiene. Status: Source correction and sentinel-based CI verification passed on code commit 8f00242932980239c9ad77e0e811596755227e26; a real-secret exposure has not been observed. Priority: High if developers build images with local secrets present.

Evidence: The reviewed repository had no root, backend, or frontend .dockerignore file. The backend Dockerfile uses `COPY . .`, so a local `backend/.env` file could be sent in the Docker build context and copied into the image even though Git ignores it. The frontend build also uses `COPY . .`; local `.env.*` files or host `node_modules` could be sent to the build context, and Vite-prefixed environment values may be embedded in built assets.

Impact: A local secret can be included in a container image layer or published image, and host dependencies can make builds larger or less reproducible. A Git ignore rule alone does not exclude files from Docker build contexts.

Correction: PR #54 adds backend/.dockerignore to exclude environment files, Git metadata, Python caches/virtual environments, coverage output, and tests. It adds frontend/.dockerignore to exclude environment files, Git metadata, host node_modules, dist, coverage, and logs. CI checks that both ignore files exist and contain the required secret exclusions. A follow-up CI change now creates harmless backend/frontend sentinel environment files, loads the built images, and checks that the backend image does not contain /app/.env and the frontend bundle does not contain the sentinel variable. The ignore-rule check, image builds, and sentinel inspection passed in run 38179504988. The backend image did not contain /app/.env, and the frontend bundle did not contain the sentinel variable.

Retest: The latest CI workflow now builds with harmless sentinel environment files present and checks the resulting backend image/frontend bundle. Confirm that new CI run passes and verify both Docker builds still succeed.

Closure evidence: CI result for the ignore-rule check and image builds, reviewed ignore files, and a sentinel-based build-context test or equivalent evidence. Do not claim an actual secret was leaked unless evidence shows a real secret entered an image.




## QA-FIND-054 — CD restarts the application before applying database migrations

Classification: Deployment sequencing / release safety. Status: Source correction and CI order check passed; staging failure/recovery verification remains pending. Priority: High for schema-changing releases.

Evidence: The reviewed CD workflow previously ran `docker compose up -d --remove-orphans` before explicitly applying migrations 002 and 003. That command could replace the running backend/frontend containers before a migration succeeded.

Impact: If a migration fails—for example, migration 003 detects duplicate legacy budgets—the new application image may already be running against the old or partially upgraded schema. The deployment job then fails, but the application may already have changed version, making rollback and diagnosis harder.

Correction: PR #54 now starts only PostgreSQL, waits for it to become healthy, applies migrations 002 and 003, and restarts backend/frontend/Nginx only after both migrations succeed. CI also checks the command order.

Retest: Confirm the CI migration-order check passes. In a controlled staging environment, force migration 003 to fail using duplicate test data and verify the old application containers remain running and healthy. Then resolve the duplicate data, rerun deployment, and verify the intended commit is live.

Closure evidence: CI run 38179822312 passed the migration-order check. Staging failure/recovery evidence, deployed image/commit identity, and health-check results remain required; source ordering alone does not prove the AWS deployment behaves as expected.

## QA-FIND-055 — CD may attempt migrations before PostgreSQL is healthy

Classification: Deployment reliability. Status: Source correction and CI order check passed; staging cold-start verification remains pending. Priority: Medium–High.

Evidence: Before the latest correction, the CD script started PostgreSQL with `docker compose up -d postgres` and then immediately executed SQL migrations. Detached Compose startup does not necessarily wait until the database health check reports healthy.

Impact: On a slower restart or cold VM, the migration command can run before PostgreSQL accepts connections, causing deployment to fail even when the schema and migration are valid.

Correction: PR #54 now uses `docker compose up -d --wait postgres` before running migrations. CI's migration-order check requires this health wait before migrations and before the application restart.

Retest: Confirm the latest CI order check passes. In staging, restart PostgreSQL from a cold state and verify the workflow waits for health before applying migrations. Confirm the application services restart only after both migrations complete.

Closure evidence: CI run 38179822312 passed the order check. Staging deployment logs must still show database health before migration execution, followed by app restart and successful public health checks.

## CI status note — 2026-10-11

Latest CI run 38179822312 passed for code commit 81f1ac88449012b530c83a9d9c2317558f3c905c. All eight jobs passed: secret scan, component detection, database migrations, backend lint/tests, frontend lint/build, both Docker builds, and the aggregate check. The backend suite passed 33 tests. The database job applied migrations 001–003, verified the uniqueness indexes and legacy-duplicate guard, validated Compose environment interpolation, and checked that the CD workflow starts PostgreSQL with a health wait, applies migrations 002/003, and only then restarts app services.

Both Docker builds passed the .dockerignore rule checks and sentinel inspections: the backend image did not contain /app/.env, and the frontend bundle did not contain VITE_SECRET_SENTINEL. This proves the test sentinel files were excluded, not that an actual secret was previously leaked.

Important limitations: the frontend package still has no test script, so the optional frontend test step can pass without running frontend functional tests. CI does not prove live AWS deployment, a populated existing-volume migration, staging failure/recovery behavior, browser end-to-end behavior, the negative non-test-database guard case, category write authorization, proxy-aware production rate limiting, or public CSP/HSTS behavior. Those remain open and require their documented runtime evidence.


## QA-FIND-056 — Deleting a category can change a user's budget meaning

Classification: Confirmed data-integrity defect in the reviewed schema and category-delete flow. Status: Source correction and CI tests pass in run 38213583630; populated AWS-volume/runtime retest pending. Priority: High; financial data correctness.

Evidence: `database/migrations/001_initial_schema.sql` defines `fk_budgets_category` with `ON DELETE SET NULL`, and `backend/models/budget.py` mirrors that behavior. A budget whose `category_id` is cleared is treated by the API as a whole-month budget. The category-delete route checks whether expenses use the category, but it does not check whether budgets use it. Migration 003 now enforces one whole-month budget per user/month, so a category deletion can either silently reclassify an existing category budget or fail if that user already has a whole-month budget for the same month.

Impact: Users can lose the intended category link for a budget. Reports and budget warnings may then compare expenses against the wrong budget scope. If a uniqueness conflict occurs, the category deletion may fail with a generic server error instead of explaining the actual conflict.

Correction proposed in PR #54: The category-delete route checks for linked budgets and returns HTTP 409 with a clear message. Migration 004 changes the database foreign key to `ON DELETE RESTRICT`, protecting against concurrent deletes and preserving the relationship even if a request bypasses the pre-check. The SQLAlchemy model now uses `ondelete="RESTRICT"`. CI run `38212158351` passed for code commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`: all eight jobs passed, migration 004 was applied, the database job verified the `RESTRICT` rule and deployment migration order, and the backend suite passed 35 tests including the new category-budget regression.

Required retest: Run the new tests on the current correction commit. Test a category linked to a budget when no whole-month budget exists and when a whole-month budget already exists for the same user/month. In both cases, deletion must return 409 and the budget's category ID and amount must remain unchanged. Confirm migration 004 works on both a fresh database and a populated existing volume before deploying to AWS.

Closure evidence: Passing CI for the latest correction commit, verified `fk_budgets_category` rule is RESTRICT, API response and post-request database/API evidence, successful fresh/existing-volume migration logs, and AWS staging evidence showing the deployed commit. Source changes alone do not close the finding.


## Current CI status update — 2026-10-12

CI run [38212158351](https://github.com/AyomideADEJARE1/Expense-Management-Platform/actions/runs/38212158351) passed all eight jobs for correction commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`. The database job applied migrations 001–004, confirmed the budget-category foreign key uses `RESTRICT`, checked the CD migration order, and exercised the legacy duplicate-budget migration guard. The backend suite passed 35 tests; frontend lint/build, secret scan, both Docker builds, and the aggregate CI check passed.

This result supersedes the older CI checkpoint recorded earlier in this file for the current correction branch. It does **not** prove that migrations 002–004 succeeded on a populated AWS volume, that a migration-failure deployment preserves the old running app, that the latest image is live on AWS, or that browser end-to-end journeys pass. The frontend test command is still optional and the frontend package has no test script, so frontend functional test coverage remains open.


## QA-FIND-057 — Category create/update do not handle database commit failures

Classification: API error handling and data consistency. Status: Source correction and regression tests pass in CI run 38213583630; AWS/runtime retest pending. Priority: Medium.

Evidence: In the reviewed category API, create and update check whether the category name already exists, but the database commit was previously outside a guarded error handler. The database also enforces a unique category name. If two requests race after the pre-check, or the database rejects the commit for another reason, the route can raise an unhandled exception rather than return the documented conflict/server response. The failed SQLAlchemy transaction also requires rollback before the session can be used again.

Impact: A duplicate-name race can become a generic 500 rather than HTTP 409. Unexpected database failures can produce inconsistent API behavior and make recovery harder to diagnose.

Correction proposed in PR #54: Create and update now catch SQLAlchemy IntegrityError, roll back, and return HTTP 409 only when the database identifies the `uq_expense_category_name` constraint. Other integrity errors and unexpected exceptions return a generic HTTP 500 after rollback. Tests simulate the known unique-constraint race for both create and update, and a separate test verifies that an unexpected create failure returns a sanitized 500 and a later valid create succeeds.

Retest update — 2026-10-12: CI run `38212554474` passed all eight jobs for code commit `57c13c60386419d84594ce64d7db015351d105f5`. The backend suite passed 37 tests, including the new category-name conflict tests for create/update and recovery after an unexpected create failure. AWS/runtime checks remain separate requirements. Verify duplicate-name requests return 409; unrelated integrity/database failures return 500; no SQL or internal exception text is returned; and a valid request succeeds after rollback.

Closure evidence: Passing current CI run, tested commit SHA, API results for duplicate and unexpected-failure paths, and proof that the stored category remains unchanged after a failed update.


## Latest correction CI checkpoint — 2026-10-12

CI run [38212554474](https://github.com/AyomideADEJARE1/Expense-Management-Platform/actions/runs/38212554474) passed all eight jobs for correction commit `57c13c60386419d84594ce64d7db015351d105f5`. The backend suite passed 37 tests. The latest source includes migration 004 and category-budget deletion protection, plus category create/update conflict handling and rollback tests. Frontend lint/build, secret scanning, both Docker builds, database migrations, and the aggregate check passed.

This checkpoint supersedes the prior 35-test CI checkpoint for the correction branch. The frontend package still has no test script, so frontend functional tests may be skipped by the optional command. Populated AWS volume migration, staging failure/recovery, deployed image identity, public health checks, category write authorization, production rate limiting, CSP/HSTS, and browser end-to-end evidence remain open.


## QA-FIND-058 — Email uniqueness races return a server error instead of a conflict

Classification: API error handling and account consistency. Status: Source correction and regression tests pass in CI run 38213583630; AWS/runtime retest pending. Priority: Medium.

Evidence: Registration checks whether an email already exists before inserting a user, and profile update checks whether another user already owns the requested email. Both checks can race with another request. The database enforces unique email values, but the reviewed commit handlers previously mapped every commit exception to HTTP 500 instead of distinguishing a duplicate-email constraint violation.

Impact: A valid duplicate-email conflict caused by concurrent requests can be reported as a server failure. This gives clients the wrong result and makes normal conflict handling less reliable.

Correction proposed in PR #54: Registration and profile update now catch SQLAlchemy IntegrityError, roll back, and return HTTP 409 only when PostgreSQL reports the `users_email_key` constraint. Other integrity failures and unexpected exceptions still return a generic HTTP 500. Tests simulate the unique-constraint race for both routes and verify that an unexpected registration commit failure returns a sanitized 500 and a subsequent valid registration succeeds.

Retest update — 2026-10-12: CI run `38212818430` passed all eight jobs for correction commit `0207384272129a22c719425fee062a87fc0f29ae`. The backend suite passed 39 tests, including simulated email-constraint conflicts for registration/profile update and recovery after an unexpected registration commit failure. AWS/runtime checks remain separate requirements. Verify the duplicate-email race returns 409, the original profile email remains unchanged after a failed update, unrelated errors remain 500, and the session can handle a later valid request.

Closure evidence: Passing CI for the exact commit, API results for registration/profile conflict and recovery paths, and confirmation that no SQL or internal exception details are returned.


## Latest correction CI checkpoint — 2026-10-12 (supersedes earlier checkpoints)

CI run [38212818430](https://github.com/AyomideADEJARE1/Expense-Management-Platform/actions/runs/38212818430) passed all eight jobs for correction commit `0207384272129a22c719425fee062a87fc0f29ae`. The backend suite passed 39 tests. This run includes migrations 001–004, category-budget deletion protection, category create/update error handling, and email uniqueness conflict handling for registration/profile updates. Secret scanning, frontend lint/build, both Docker builds, database migration checks, and the aggregate CI check passed.

The frontend package still has no test script, so the optional frontend test command may skip functional tests. CI does not prove populated AWS-volume migration, staging failure/recovery, deployed image identity, public health checks, browser end-to-end behavior, category write authorization, production rate-limit storage/proxy handling, or public CSP/HSTS. These remain open until evidence is recorded.


## Latest code CI checkpoint — 2026-10-12

CI run [38213095648](https://github.com/AyomideADEJARE1/Expense-Management-Platform/actions/runs/38213095648) passed all eight jobs for code commit `2c7d244067d7ca3727f4c346995380dbc4a95fea`. This includes the README clarification after the previously passing 39-test correction run. The run passed database migrations, backend lint/tests, frontend lint/build, secret scanning, both Docker builds, and the aggregate check.

The latest application-code regression coverage includes category-budget deletion protection, category create/update commit error handling, and email uniqueness conflict/recovery. The frontend package still has no test script, so the optional frontend test step does not establish frontend functional coverage. AWS populated-volume migration, staging failure/recovery, deployed image identity, public health checks, and browser end-to-end verification remain pending.


## Latest code CI checkpoint — 2026-10-12 (secret validation)

CI run [38213583630](https://github.com/AyomideADEJARE1/Expense-Management-Platform/actions/runs/38213583630) passed all eight jobs for correction commit `fc96ad9bf7e075907eb31e4d9acee719263d3ccb`. The backend suite passed 47 tests. The new tests verify that production secret validation rejects missing, short, placeholder, and shared Flask/JWT keys, accepts distinct strong keys, and allows the explicit non-production test configuration. Database migrations, frontend lint/build, secret scan, both Docker builds, and the aggregate check passed.

This verifies the source behavior in CI, not the actual AWS environment. Before release, confirm AWS has distinct strong `SECRET_KEY` and `JWT_SECRET`/ `JWT_SECRET_KEY` values and that the running service starts with the intended production mode. Live deployment, existing-volume migration, public health, browser journeys, production rate-limit storage/proxy behavior, category write authorization, and CSP/HSTS remain open.


## Latest code CI checkpoint — 2026-10-12 (current correction head)

CI run [38213904072](https://github.com/AyomideADEJARE1/Expense-Management-Platform/actions/runs/38213904072) passed all eight jobs for correction commit `3bce1183a2916a62cca0018bccaeb8527adb8ebc`. The backend suite passed 47 tests. The run includes production signing-secret validation and the README explanation of production-mode behavior. Database migrations, frontend lint/build, secret scan, both Docker builds, and the aggregate check passed.

The latest green CI result does not prove that AWS is running this commit, that populated-volume migrations or deployment failure/recovery work in staging, or that public health and browser flows pass. The frontend package still has no test script; category write authorization, production rate-limit storage/proxy handling, CSP/HSTS, and live AWS evidence remain open.
