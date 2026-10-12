# Runtime Verification and Closure Plan

Date: 2026-10-11
Applies to: Expense Management Platform capstone
Reference branches: upstream main, upstream integration/deployable-main, QA fork PR #53 and correction PR #54.

## Purpose

Passing CI establishes that the tested commit passed the automated jobs that ran. It does not establish that the deployed application is reachable, that Nginx routes requests correctly, that production secrets are safe, or that a browser workflow works end to end. The checks below are required before closing the associated QA findings.

## Release-blocking items and required decisions

### RV-01 — Deploy to the approved AWS target and prove it is running

Related finding: QA-FIND-008 / QA-FIND-021. Priority: Release blocker until deployment evidence exists.

Decision: The QA owner reports that the project tutor approved AWS as an alternative deployment target. AWS EC2 is the target for this audit and is also the environment described by the upstream README. Retain the tutor's approval with the capstone submission records.

Why it matters: Approval of the target does not prove that the reviewed application commit is deployed. A workflow may be configured for a different environment, use stale secrets, or deploy a different image from the one tested by CI.

Action: Align the CD workflow, protected secret names, README, architecture/CI-CD documentation, and evidence with AWS EC2. Configure the required AWS host/user/SSH-key secrets. Deploy the exact tested commit using its commit-tagged images, and record the public application URL, instance/container status, and deployment version.

Pass evidence: Retained tutor approval; successful workflow run for the intended commit; AWS EC2/container status; public URL response; both public health checks; and timestamped screenshots/logs with secrets redacted. The target decision is recorded; deployment verification remains open until this evidence exists.

### RV-02 — Remove hard-coded database credentials
Related finding: QA-FIND-035 and existing configuration finding QA-FIND-022. Priority: High; release blocker for production deployment.

Why it matters: Fixed credentials committed to source are visible to anyone with repository access and are easy to reuse accidentally. If reused in a deployed environment, an attacker or unauthorized user who learns them may gain database access. Keeping a README warning while the Compose file still contains the credentials does not remove the risk.

Action: Use required environment interpolation or the deployment platform's secret mechanism for PostgreSQL user/password/database settings. Provide a safe example environment file containing placeholders only. Fail closed when required production values are missing or weak. Ensure the backend and database service receive the same configured values without printing secrets to logs. Rotate any real credential if one was ever committed or reused outside local development.

Pass evidence: Source scan shows no operational password literals; a fresh local setup works using the documented example/configuration; startup fails safely when required production values are absent; deployment uses protected secrets; and existing volumes are tested without data loss.

### RV-03 — Decide and enforce category write authorization
Related finding: QA-FIND-010 / QA-FIND-032. Priority: High; security blocker.

Why it matters: Category POST, PUT, and DELETE currently modify shared global records without an authentication/authorization guard. A remote caller may alter the categories all users see or attempt deletion of a category used by expenses. This is not solved by validating the JSON fields.

Action: The team must decide whether categories are global and administrator-managed or individually owned. For global categories, require authentication plus an explicit administrator/maintainer role for writes. For user-owned categories, scope writes and reads to the authenticated owner and adjust expense/budget references accordingly. Do not add a guard that blocks all legitimate category administration without defining how authorized management will work.

Required tests: Unauthenticated POST/PUT/DELETE rejected with 401; authenticated ordinary user cannot perform admin-only writes (403); authorized administrator can create/update/delete; invalid payload receives 400; duplicate name receives the documented conflict response; deleting a referenced category returns a controlled conflict and preserves the expense/budget records.

Pass evidence: Approved policy, implementation commit, passing automated negative/positive tests, and manual API/browser verification.

### RV-04 — Enforce budget uniqueness in PostgreSQL
Related finding: QA-FIND-030 / QA-FIND-033. Priority: High; data-integrity blocker.

Why it matters: Application-level “does this budget exist?” checks are not atomic. Two concurrent requests for the same user/month/category can both pass the check and insert duplicates. Duplicate budgets can make budget totals and dashboard utilization misleading. A normal unique constraint may also fail to prevent duplicates where category_id is NULL, depending on PostgreSQL semantics.

Action: Inspect current production/test data for duplicates before adding constraints. Add a migration-backed uniqueness strategy for both non-null category budgets and whole-month budgets with NULL category (for example, separate partial unique indexes where supported). Catch uniqueness violations, roll back the session, and return a stable 409 conflict response. Keep the application pre-check only as a user-friendly early response, not as the integrity guarantee.

Required tests: Same user/month/category duplicate is rejected; same user/month/NULL-category duplicate is rejected; different users may create their own matching budgets; different categories in the same month are allowed if that is the intended rule; simultaneous duplicate requests result in exactly one created row; migration works against a fresh database and an existing volume containing no duplicates.

Correction status update — 2026-10-11: PR #54 now adds migration 003 with duplicate-data checks and separate partial unique indexes for categorized and NULL-category budgets. CI now checks that both indexes exist, verifies duplicate general budgets return HTTP 409, and uses a separate database to prove legacy duplicate rows block the migration with a clear diagnostic. The budget route now maps IntegrityError to HTTP 409 and rolls back.

Pass evidence: Current CI passes the migration and regression tests; database indexes are verified; a populated existing volume is tested; concurrent requests result in exactly one row; and dashboard totals are checked against known records. Do not close this gate from source changes alone.

### RV-05 — Verify application and database health through Nginx
Related finding: QA-FIND-034 and deployment health-check finding QA-FIND-012. Priority: High; deployment gate.

Why it matters: A health endpoint that works only when called directly inside the backend container does not prove the public reverse-proxy route works. If /api/health/db is forwarded as /api/health/db instead of /health/db, the public database check may return 404 even when PostgreSQL is healthy. If CD checks the wrong path, it can either reject a healthy deployment or miss a real failure.

Action: Keep explicit exact Nginx mappings from /api/health to backend /health and /api/health/db to /health/db. Start the full Compose stack and check the public endpoints from outside the containers. Verify both success and failure behavior; the DB endpoint must return non-success when the database cannot be reached. Ensure deployment waits for database readiness before migration and health checks.

Required tests: Through the public Nginx port, /api/health returns 200 and status=ok; /api/health/db returns 200 and database=connected when DB is reachable; invalid/unavailable DB makes DB health fail; CD stops and reports failure if either endpoint fails. Record response status/body and run ID.

Pass evidence: Successful Compose/Nginx runtime test and a deployment workflow run whose two health checks both pass. A source mapping alone is not enough to close the finding.

### RV-06 — Make production signing-secret validation fail closed
Related finding: Existing production-secret finding noted in PR #53/#54. Priority: High; security blocker.

Why it matters: If Flask/JWT signing keys are missing, weak, or predictable in production, token integrity and session security can be compromised. A local development default must never silently become a production secret.

Correction status update — 2026-10-12: PR #54 adds startup validation. Production now requires a strong, non-placeholder Flask secret and a separate strong JWT secret. Missing, short, placeholder, or identical values raise a startup error; non-production test configuration remains allowed. Tests have been added, and the current source CI run is pending.

Action: Confirm the new tests pass and verify the production startup check uses the deployed environment mode.

Pass evidence: Automated configuration tests prove production startup fails for missing/placeholder keys and succeeds with valid configured keys; secret scanning passes; no secret values appear in logs.

### RV-07 — Configure shared production rate-limit storage
Related finding: Existing rate-limit finding in PR #54. Priority: High for multi-worker production.

Why it matters: In-memory rate limits are local to a process. With multiple workers or multiple instances, a caller can receive separate allowances from each worker and limits reset on restart. This weakens abuse protection and can create inconsistent user experience.

Action: Configure a shared supported backend such as Redis for production, with credentials supplied as secrets and connectivity monitored. Keep in-memory storage only for local development/test, and fail or warn according to an explicit production policy rather than silently using process-local storage.

Pass evidence: Production config uses shared storage; test requests across workers share the same limit; Redis outage behavior is documented and monitored; no credentials are logged.

### RV-08 — Verify GHCR image access and deploy the exact tested commit
Related finding: QA-FIND-012 and deployment workflow verification. Priority: High; deployment gate.

Why it matters: CI may build and publish an image successfully while the VM cannot pull it because the package is private or the VM has not authenticated. A deployment can also pull a moving latest tag that is not the exact commit tested by CI.

Action: Decide whether GHCR packages are public or private. For private packages, provision least-privilege read access on the VM and test login non-interactively. Use commit-specific SHA-tagged images and either enforce registry tag immutability or pin the image digest; record the commit SHA and image digest. Confirm the VM's checkout and image correspond to the same reviewed release.

Pass evidence: VM successfully pulls both images; deployment logs identify the commit-specific tag/digest; running containers report the expected release; rollback instructions are documented and tested.

### RV-09 — Validate migrations on both fresh and existing databases
Related finding: Existing migration/volume concern noted in PR #53/#54. Priority: High; data-loss prevention.

Why it matters: PostgreSQL init scripts under /docker-entrypoint-initdb.d run only when the data directory is first initialized. A migration added there may not run against an existing persistent volume. Re-running a SQL file manually can also fail or cause problems if it is not idempotent.

Action: Define one repeatable migration mechanism for fresh and existing environments. Back up the database before production schema changes. Test the documented deployment command against both a fresh database and a copy of an existing volume. Ensure failed migrations stop deployment rather than continuing to restart the app against an incompatible schema.

Pass evidence: Fresh-install migration pass; existing-volume migration pass; schema version/columns verified; backup/restore or rollback procedure recorded.

## Browser and functional regression matrix

Run these tests against the deployed candidate using two separate test accounts and known seed data. Never use real personal financial records.

| ID | Test | Expected result | Why it matters |
|---|---|---|---|
| BR-01 | Register, log in, log out, and access a protected route without a token | Correct success responses; protected route rejects missing/invalid/expired token | Prevents account/session failures and unauthorized access |
| BR-02 | User A creates an expense; User B lists, retrieves, updates, deletes, and exports | B cannot read, alter, delete, or export A's record | Prevents exposure or destruction of private financial data |
| BR-03 | Create/edit/delete an expense with valid and invalid amounts, dates, and categories | Valid operations persist; invalid values return controlled 4xx responses | Prevents corrupt records and unhandled server errors |
| BR-04 | Apply date range and category filters, individually and together | UI results and API results agree; empty range is handled clearly | Prevents misleading reports and missing/extra expenses |
| BR-05 | Export filtered transactions to CSV | Correct headers/rows, respects active filters and ownership, text formula prefixes neutralized | Prevents data leakage and spreadsheet formula injection |
| BR-06 | Create budget for category and whole month; repeat and submit concurrent duplicates | Duplicates rejected at application and database levels; totals remain correct | Protects data integrity and dashboard accuracy |
| BR-07 | Delete a category referenced by an expense | Controlled conflict or documented safe behavior; no orphaned/broken expense | Prevents referential integrity failures |
| BR-08 | Compare dashboard summary, category chart, budget overview, and raw records | Totals match known test fixtures | Prevents incorrect financial decisions based on UI totals |
| BR-09 | Reload page and sign in again after restart | Persisted data remains; authentication behaves as designed | Detects frontend-only or transient state mistaken for persistence |
| BR-10 | Open README links and follow setup/deployment steps on a clean environment | Steps work without undocumented local state | Makes the project reproducible for the assessor |
| BR-11 | Log in, refresh, and load the current-user profile | Name/initials and signed-in state match the API profile; refresh does not break the session | Detects a mismatch between the API response envelope and frontend user state |
| BR-12 | Search for an existing expense and select the result | Transactions view opens and the selected record is visible | Prevents search navigation from pointing to a nonexistent tab |
| BR-13 | Edit the amount on a budget from a past month, save, and reload | The budget month remains unchanged; a newly created budget defaults to the current month | Prevents editing from silently rewriting historical budget periods |

For each browser test, retain: date/time, environment and deployed commit, steps, expected result, actual result, pass/fail, screenshot or sanitized response, and defect ID for failures.

## Closure rules

1. Confirmed source defect: close only after the correction is on the relevant target branch and its regression test passes.
2. Runtime verification required: close only after a test has actually been executed against the full Compose/Nginx stack or deployed environment and evidence is recorded.
3. Requirements decision required: keep open until the instructor/team decision is documented.
4. Security/data-integrity blocker: do not recommend production release while the item remains open.
5. CI green: record the exact commit and run. Never describe it as proof that browser or live deployment testing passed.
6. No evidence/no pass: an unexecuted check remains PENDING, not PASS.

## RV-10 — Honor and verify the dedicated JWT signing secret
Related finding: QA-FIND-036. Priority: High; security configuration blocker.

Why it matters: The previous app configuration read SECRET_KEY for JWT_SECRET_KEY even though CI and operators can supply JWT_SECRET separately. An operator could rotate JWT_SECRET and believe token signing had changed while the app continued using SECRET_KEY.

Correction status update — 2026-10-12: PR #54 now reads `JWT_SECRET_KEY` first, then `JWT_SECRET`; production cannot use `SECRET_KEY` as a fallback and must provide distinct strong keys. The new tests cover missing, placeholder, short, shared, and valid distinct values. The current source CI result is pending.

Pass evidence: automated tests show that distinct Flask and JWT values populate distinct config keys; production fails when either is missing/placeholder; test environment remains deterministic; CI and secret scan pass. Until those tests and fail-closed behavior exist, QA-FIND-036 remains RETEST PENDING.

## RV-11 — Handle budget uniqueness conflicts distinctly from server failures
Related finding: QA-FIND-042. Priority: Medium–High.

Why it matters: the budget route currently catches all commit exceptions and returns HTTP 500. Once a database uniqueness constraint is added, an expected duplicate is a conflict, not an internal server failure. Treating all errors alike makes client behavior and monitoring inaccurate.

Correction status update — 2026-10-11: PR #54 now catches SQLAlchemy IntegrityError separately for budget create/update, rolls back, and returns HTTP 409 only for the two known budget unique-index names. Other integrity violations remain generic HTTP 500 responses. Tests cover the classifier, duplicate conflict, and a simulated unexpected commit failure with rollback, sanitized output, and subsequent session recovery.

Action: verify the new tests pass on the current commit and confirm no SQL, credentials, or stack traces are returned.

Pass evidence: automated tests show duplicates return 409, simulated unexpected database errors return 500, session rollback succeeds, and no sensitive details appear in client responses.

## RV-12 — Isolate API tests from persistent and production data
Related finding: QA-FIND-043. Priority: Medium; test reliability gate.

Why it matters: the API test fixture toggles test mode and resets rate limiting, but does not itself isolate the database or clean up records created by registration/category tests. Repeated or reordered runs can collide with leftovers, and a misconfigured local environment could target an unintended database.

Correction status update — 2026-10-12: PR #54 now uses an explicit test-database name guard that rejects production/staging/live markers, truncates the test tables and resets identities after each API test, and adds tests for guard behavior. CI now runs the backend suite twice consecutively. The latest correction CI is pending; keep this gate open until both runs pass.

Action: confirm CI uses a dedicated disposable database, add or execute a negative check with a non-test database name, and establish cleanup or disposable-database behavior for repeatable runs.

Pass evidence: the current CI passes the guard on expense_management_test; the suite passes twice consecutively and in altered order; test-created records are cleaned up; and a non-test database configuration is rejected before any mutation.



## RV-13 — Keep the current-user profile contract consistent
Related finding: QA-FIND-044. Priority: Medium; user-facing regression.

Why it matters: The current-user endpoint returns a response envelope with the profile nested under `data`. Upstream main stores the whole response object in frontend user state, while the UI reads profile fields directly. This can leave the signed-in name/initials missing and can break components that rely on a normalized profile object.

Source correction present in PR #54 branch: the frontend extracts `response.data || response`, then normalizes the full name into first/last name fields before setting user state.

Action: Keep the correction in the reviewed release branch and ensure the API contract and frontend state shape remain consistent.

Pass evidence: Automated or browser test logs show login and page refresh succeed; the displayed name/initials match the test account; and no user-profile fields are undefined in the rendered UI. Record the tested commit and sanitized evidence.


## RV-14 — Preserve the original month when editing a budget
Related finding: QA-FIND-045. Priority: Medium–High; financial record integrity.

Why it matters: The upstream frontend constructs the current month for both create and edit requests. The backend update route accepts the supplied month and writes it to the existing budget, so editing an older budget can move it into the current month.

Source correction present in PR #54 branch: the frontend now uses the existing budget's month when editing and defaults to the current month only for new budgets. Fixing commit: `666d79911d480eea2eec4e0d6e84711ef957ca97`.

Action: Verify the edit flow against a historical budget, not only a newly created current-month budget.

Pass evidence: Browser/API test showing the month before edit and after reload is identical; a new budget uses the current month; CI passes for the fixing commit; record the tested commit SHA.



## RV-15 — Category API authorization
Related finding: QA-FIND-010. Priority: High.

Test unauthenticated POST, PUT, and DELETE requests to the category API. They must be rejected. Repeat as a normal signed-in user and as the role authorized by the team's written category policy. Verify changes do not affect another user's category records where categories are user-owned. Do not close this gate until the intended global/shared versus user-owned category policy is documented.

Pass evidence: Policy decision, API responses for each role, automated tests, and tested commit SHA.

## RV-16 — Compose credential configuration
Related finding: QA-FIND-037. Priority: High.

From a clean checkout, copy the root example environment file to .env, set a unique local database password, and run docker compose config. Confirm the rendered configuration uses the supplied values, contains no embedded fixed password, and does not expose secret values in captured logs. Repeat with required values absent and confirm Compose fails before services start. Start the stack and verify both application and database health endpoints.

Pass evidence: Sanitized config, startup/health results, CI run for the exact correction commit, and confirmation that real secrets are not tracked.

## RV-17 — Confirm frontend automated tests execute
Related finding: QA-FIND-048. Priority: Medium.

Inspect frontend/package.json and the CI logs. The current package has no test script, so npm test with if-present behavior can skip tests. Closure requires a test script and CI logs showing a non-zero number of tests executed. Include profile refresh, expense-search navigation, and budget create/edit cases.

Pass evidence: Test files, package script, CI test output, and tested commit SHA.

## RV-18 — Verify documented port and clean-start steps
Related finding: QA-FIND-049. Priority: Low–Medium.

Follow README and Docker guide instructions from a clean checkout, configure the required environment files, start Compose, and use the exact URL documented for the host port. Confirm the frontend and public health routes respond.

Pass evidence: Sanitized startup output, docker compose ps, tested URLs, and documentation diff.

## RV-19 — Inspect public security headers and CSP
Related finding: QA-FIND-050. Priority: Medium.

Inspect headers from the deployed public HTTPS endpoint. Verify the existing headers remain present, review CSP compatibility with the React app, and test login/navigation/API calls with CSP enabled. Only expect HSTS after HTTPS is confirmed and the deployment layer is configured to emit it.

Pass evidence: Header capture, CSP policy, browser test results, and tested deployment/version. Do not treat source configuration alone as runtime proof.


## RV-20 — Verify rate limits through the reverse proxy
Related finding: QA-FIND-051. Priority: Medium–High.

Login and registration have per-route limits, but the backend uses get_remote_address without explicit trusted-proxy configuration and the default limiter storage is in memory. Through the deployed Nginx endpoint, test two independent client addresses. Verify one client's repeated requests do not throttle the other, excess requests return 429, and limits behave consistently across workers/restarts. Confirm forwarding headers cannot be spoofed to bypass limits.

Pass evidence: Reviewed trusted-proxy count and Nginx forwarding configuration, shared production store configuration, controlled test results, response codes, and deployed version.


## RV-21 — Verify budget spending is derived from recorded expenses
Related finding: QA-FIND-046. Priority: Low–Medium.

Open both new-budget and edit-budget forms. Confirm the "Amount Already Spent" value is read-only and helper text explains that it is calculated from recorded expenses. Save a budget, reload, and compare the displayed spending value with the relevant expense records and API response.

Pass evidence: CI result for the correction commit, browser screenshot, and a before/after comparison against recorded expenses. Do not mark the finding closed from source review alone.


## RV-22 — Verify category deletion error classification and recovery
Related finding: QA-FIND-052. Priority: Medium.

Test deletion of a category referenced by an expense. The API should return HTTP 409 with the category-in-use message. Then simulate an unexpected database commit failure during category deletion and verify a generic HTTP 500, rollback, no internal error details in the response, and that the category still exists and can be deleted after recovery.

Pass evidence: Current CI passes both new tests; response codes and sanitized bodies are captured; a subsequent valid operation succeeds.


## RV-23 — Verify Docker build contexts exclude local secrets
Related finding: QA-FIND-053. Priority: High when building/publishing images from a developer workspace.

Check that backend/.dockerignore and frontend/.dockerignore exclude .env and .env.*. Confirm frontend/.dockerignore excludes node_modules and generated output. CI now validates these required patterns. For stronger closure evidence, create harmless sentinel environment files in a disposable workspace, build both images, and verify the sentinel values are absent from image layers and frontend assets.

Pass evidence: current CI ignore-rule check and Docker builds pass; sentinel-based image/bundle inspection is recorded where feasible. Do not claim an actual secret was exposed without evidence.


## RV-24 — Verify migrations complete before application restart
Related finding: QA-FIND-054. Priority: High.

CI now checks that the CD workflow starts PostgreSQL, applies migration 002, applies migration 003, and only then restarts backend/frontend/Nginx. Confirm that check passes. In a controlled staging environment, create duplicate legacy budget data so migration 003 fails, then verify the currently running app version remains up and healthy. After resolving the test data, redeploy and verify the new image/commit and health checks.

Pass evidence: CI order check, staging failure/recovery evidence, deployed commit/image identity, and public health checks. Do not mark this gate passed from source order alone.


## RV-25 — Verify PostgreSQL is healthy before migration execution
Related finding: QA-FIND-055. Priority: Medium–High.

CI run `38212158351` passed for commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`. It verified migrations 001–004, and the CD order check requires PostgreSQL health wait, then migrations 002–004, then application-service restart. In staging, restart PostgreSQL from a cold state and verify the migration commands begin only after the database health check is successful.

Pass evidence: CI run `38212158351` and the order check, plus staging deployment logs showing the health wait, successful migrations, and application/database health checks. CI passing alone does not close the AWS runtime gate.


## RV-26 — Preserve budget category links when deleting categories
Related finding: QA-FIND-056. Priority: High.

Source correction in PR #54 adds a route-level check for linked budgets, changes the database foreign key to `ON DELETE RESTRICT` through migration 004, updates the SQLAlchemy model, and adds API/database constraint tests. CI run `38212158351` passed for commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`, including the route test, constraint-rule test, and database migration/order checks. AWS existing-volume and browser verification remain pending.

Run the API test with a category-linked budget and confirm category deletion returns HTTP 409. Confirm the budget remains present with the same category ID and amount. Repeat where a whole-month budget already exists for the same user/month; the result must still be a clear 409, not an unhandled 500. Verify migration 004 on a clean database and a populated existing AWS staging volume.

Pass evidence: passing CI for the exact correction commit; `fk_budgets_category` reports `RESTRICT`; before/after API or database evidence shows no budget field changed; fresh/existing-volume migration logs; and AWS staging commit/image identity plus public health checks.


## Latest CI checkpoint — 2026-10-12
Run `38212158351` passed all eight jobs for commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`; the backend suite passed 35 tests. The database job applied migrations 001–004 and verified the category-budget foreign key is RESTRICT. This is CI evidence only. Do not mark AWS staging, populated-volume migration, failure/recovery, public health, or browser journey gates as passed without their own recorded results.


## RV-27 — Verify category create/update error handling and session recovery
Related finding: QA-FIND-057. Priority: Medium.

PR #54 now catches database commit errors in category create/update, rolls back, and returns HTTP 409 only for the named category-name unique constraint. Other integrity errors and unexpected exceptions return a generic HTTP 500. Automated tests simulate the known constraint conflict for both create and update, plus an unexpected create failure followed by a successful request.

Pass evidence: latest CI passes the category error tests; duplicate conflict returns 409; unexpected failure returns sanitized 500; a failed update leaves the original category name unchanged; and a later valid request succeeds. Do not close this gate from source review alone.


Latest source CI checkpoint: run `38212554474` passed all eight jobs for commit `57c13c60386419d84594ce64d7db015351d105f5`; 37 backend tests passed. This does not close any gate that requires AWS staging, populated-volume migration, public health, or browser evidence.


## RV-28 — Verify email uniqueness conflict handling and recovery
Related finding: QA-FIND-058. Priority: Medium.

PR #54 now catches the database email unique constraint for registration and profile updates, rolls back, and returns HTTP 409 for that known conflict. Other integrity errors and unexpected failures remain generic HTTP 500 responses. CI run `38212818430` passed all eight jobs for commit `0207384272129a22c719425fee062a87fc0f29ae`; the backend suite passed 39 tests, including the new email conflict/recovery tests. AWS runtime checks remain pending.

Pass evidence: current CI passes the new tests; registration/profile email conflict returns 409; the original profile email remains unchanged after a failed update; unexpected errors expose no internal details; and a later valid registration succeeds. Do not close this gate from source review alone.


Latest correction CI checkpoint: run `38212818430` passed all eight jobs for commit `0207384272129a22c719425fee062a87fc0f29ae`; 39 backend tests passed. This does not close AWS runtime, populated-volume migration, public health, or browser journey gates.


Latest code CI checkpoint: run `38213095648` passed all eight jobs for commit `2c7d244067d7ca3727f4c346995380dbc4a95fea`. This confirms CI for the current correction source, including the README update; it does not close AWS staging, populated-volume migration, live health, or browser verification gates.


Latest code CI checkpoint: run `38213904072` passed all eight jobs for commit `3bce1183a2916a62cca0018bccaeb8527adb8ebc`; 47 backend tests passed. Production AWS secret configuration and live startup still need verification.


Latest correction CI result: run `38213904072` passed all eight jobs for commit `3bce1183a2916a62cca0018bccaeb8527adb8ebc`; 47 backend tests passed. AWS runtime evidence remains pending.


## RV-29 — Enforce the documented date format on expense writes

**Related finding:** QA-FIND-059.

**Check:** Through the API, create an expense with `2026-10-12` and confirm it succeeds. Attempt to create and update an expense with a compact or otherwise noncanonical date such as `20261012`; each must return HTTP 400. After a rejected update, fetch the expense and confirm the original date is unchanged.

**Current source correction:** PR #54 compares `date.fromisoformat(value).isoformat()` to the submitted value in both create and update. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the new regression test.

**Pass evidence:** Passing current CI and the exact commit SHA, successful canonical-date request, rejected noncanonical create/update responses, and the unchanged stored date after a rejected update. AWS runtime testing is optional for this input-contract gate unless the deployed API differs from the tested commit; live browser journeys remain a separate release gate.


## RV-30 — Enforce the documented month format on budget writes

**Related finding:** QA-FIND-060.

**Check:** Create a budget using a canonical first-of-month value such as `2026-10-01` and confirm it succeeds. Try to create another budget using a compact month value such as `20261101`; it must return HTTP 400. Attempt to update the existing budget using the compact value and confirm HTTP 400, then fetch it and verify the original month is unchanged.

**Current source correction:** PR #54 now requires `parsed_month.isoformat() == month` on both budget create and update, in addition to checking that the day is 1. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the new regression assertions.

**Pass evidence:** Passing CI for the exact commit, successful canonical request, rejected compact create/update requests, and a read-back confirming no change after the rejected update. This API contract gate can be verified in CI; it does not replace AWS deployment and browser end-to-end checks.


## RV-31 — Confirm whether the UI must support whole-month budgets

**Related finding:** QA-FIND-061.

**Decision required:** The backend/database support budgets with `category_id = NULL`, but the browser form requires a category. Confirm the capstone's intended behavior before treating this as a defect.

**If overall monthly budgets are required:** Add an explicit overall-budget choice in the form and test that it sends `category_id: null`. Create an overall and a category-specific budget for the same month, verify both persist, test duplicate rejection and edits, and confirm dashboard totals/counts are correct.

**If category-only budgets are intended:** Record the decision in the requirements documentation and ensure the UI/API documentation consistently describes the scope.

**Pass evidence:** Written requirement decision and either successful browser/API tests or updated scope documentation. Keep status as OBSERVATION until that decision is made.


## RV-32 — Validate month filters and summary endpoints consistently

**Related finding:** QA-FIND-062.

**Check:** With a user who has known October 2026 expenses, confirm `/api/expenses?month=2026-10`, `/api/summaries/monthly?month=2026-10`, and `/api/summaries/category?month=2026-10` return expected data/totals. Send `month=2026-1` and `month=2026-010` to all three endpoints; each must return HTTP 400.

**Current source correction:** The three endpoints now validate the exact `YYYY-MM` format before converting year/month components. Regression tests cover invalid formats and verify monthly/category totals against a known expense. CI run `38216409164` passed all eight jobs for commit `7c3eb3a08464ff9b97ce854f5a105383db8646cb`; Flake8 and all 48 backend tests passed, including the month-query/summary regression test.

**Pass evidence:** Passing CI for the exact commit, recorded responses for valid and invalid values, and expected-vs-actual summary totals. If the live deployment does not match the tested commit, repeat the API checks against the deployed version before release.


## RV-33 — Validate category-name length before database writes

**Related finding:** QA-FIND-063.

**Check:** Submit a valid category name of 100 characters and confirm it is accepted if unique. Submit a 101-character name for create and update; both must return HTTP 400. After the rejected update, fetch the category and confirm its original name remains unchanged.

**Current source correction:** PR #54 now checks the 100-character limit on both create and update. Regression coverage has been added; the latest CI run is pending.

**Pass evidence:** Passing CI for the exact commit, responses for 100- and 101-character values, and a read-back proving a rejected update did not modify the record.
