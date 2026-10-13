# Runtime Verification and Closure Plan

Date: 2026-10-12
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

Why it matters: Upstream `main` still permits anonymous category writes. PR #54 adds JWT guards and tests anonymous 401 responses, but categories remain global and any authenticated user can still modify them until an administrator/ownership policy is implemented.

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
Related finding: QA-FIND-012 and QA-FIND-031. Priority: High; deployment gate.

Why it matters: CI may publish images successfully while the AWS host cannot pull them because runner authentication does not transfer to the remote VM. A deployment must also use images corresponding to the tested commit.

Correction in PR #54: the remote deployment step uses the repository secrets `GHCR_READ_USERNAME` and `GHCR_READ_TOKEN`, logs in with `--password-stdin`, pulls commit-tagged images, and logs out on exit. CI checks the presence of this configuration. AWS authentication/pull is still an external runtime check.

Action: Configure a least-privilege token that can read both packages. Use commit-specific SHA-tagged images and either enforce registry tag immutability or pin the image digest; record the commit SHA and image digest. Confirm the VM checkout and running images correspond to the same reviewed release.

Pass evidence: Green current-head CI, VM successfully pulls both images from a clean auth state, deployment logs identify the commit-specific tag/digest, running containers match the expected release, and rollback instructions are tested.

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

Historical checkpoint — 2026-10-12: CI run `38217288387` passed all eight jobs and both pytest runs passed 57 tests for an earlier commit. Current correction status — 2026-10-13: CI run `38418979526` passed all eight jobs for current correction commit `ae54eec01018a728f97bd7c77f7ccbcad3a96a05`. Both consecutive backend runs passed all 71 tests, both Docker builds passed, and frontend lint/build plus nine frontend tests passed. The test-database guard and cleanup fixture are verified in CI. This does not remove the requirement to use a disposable database for local/staging tests.

Action: confirm CI uses a dedicated disposable database, preserve the negative test-database guard, and verify the row-cleanup fixture and two consecutive backend runs.

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

**Check:** Submit a canonical `YYYY-MM-DD` date and confirm create/update succeed. Try compact date `20261001` and week date `2026-W40-4` on create; both must return HTTP 400. For an existing expense, try updating with `20261011`; expect HTTP 400 and verify the saved date remains unchanged. Confirm date-range query parameters enforce the same hyphenated format.

**Current source correction:** PR #54 checks that parsing and re-serializing the submitted date returns exactly the same string. CI run `38219803561` passed all eight jobs for commit `92eefc22555c7c98df240014721084e2f41698f8`; both pytest runs passed all 58 tests, including compact/week-date rejection and the rejected-update preservation check.

**Pass evidence:** Passing CI for the exact code commit, request/response results for accepted/rejected formats, and the unchanged stored date after a rejected update. This API test does not replace browser verification of date defaults and report grouping.
 
## RV-30 — Enforce the documented month format on budget writes

**Related finding:** QA-FIND-060.

**Check:** Create a budget using a canonical first-of-month value such as `2026-10-01` and confirm it succeeds. Try to create another budget using a compact month value such as `20261101`; it must return HTTP 400. Attempt to update the existing budget using the compact value and confirm HTTP 400, then fetch it and verify the original month is unchanged.

**Current source correction:** PR #54 now requires `parsed_month.isoformat() == month` on both budget create and update, in addition to checking that the day is 1. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the new regression assertions.

**Pass evidence:** Passing CI for the exact commit, successful canonical request, rejected compact create/update requests, and a read-back confirming no change after the rejected update. This API contract gate can be verified in CI; it does not replace AWS deployment and browser end-to-end checks.


## RV-31 — Confirm whether the UI must support whole-month budgets

**Related finding:** QA-FIND-061.

**Decision required:** The backend/database support budgets with `category_id = NULL`, but the browser form requires a category. The dashboard calculation also matches expenses only when category IDs match, so a null-category budget counts no normal expenses. Confirm the capstone's intended behavior before treating this as a defect.

**If overall monthly budgets are required:** Add an explicit overall-budget choice in the form and test that it sends `category_id: null`. Create an overall and a category-specific budget for the same month, verify both persist, test duplicate rejection and edits, and confirm the overall budget counts all same-month expenses while category budgets count only matching-category expenses.

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


## RV-34 — Remove API-response debug logs from the browser bundle

**Related finding:** QA-FIND-064.

**Check:** Search the active frontend source for `console.log` calls that print API response objects. Confirm the categories, expenses, and budgets response logs are absent. Run frontend lint/build CI and load the dashboard to verify categories, expenses, and budgets still render.

**Current source correction:** The three API response log statements were removed from `frontend/src/App.jsx`. The current correction CI is pending.

**Pass evidence:** Passing CI for the exact commit, a source search showing those response logs are absent, and a browser smoke-test record showing the dashboard still loads.


## RV-35 — Verify local-calendar dates across timezone boundaries

**Related finding:** QA-FIND-065.

**Check:** Record the browser timezone and local time. At a time when the local calendar date differs from UTC, verify the dashboard queries the local `YYYY-MM`, a new expense defaults to the local date, and Reports groups an API date such as `2026-10-01` under October 2026 rather than the previous month. Repeat in a timezone west of UTC to verify date-only parsing is stable.

**Current source correction:** The dashboard now derives the current month from local year/month fields; Transactions uses a local-date helper; Reports parses date-only values as local midnight. Frontend automated tests are not configured, so browser verification remains necessary.

**Pass evidence:** Passing frontend lint/build for the exact commit, recorded timezone/local date, dashboard request month, new-expense default date, and report grouping for a known date-only transaction.


## RV-36 — Apply the saved currency preference across financial screens

**Related finding:** QA-FIND-059.

**Check:** Set the profile currency to each supported option (NGN, USD, EUR, GBP), then inspect Dashboard, Transactions, Budgets, Reports, dashboard chart tooltips, budget overview, and budget search results. All monetary labels should use the selected currency symbol consistently. Change back to NGN and confirm the display updates without changing the underlying numeric amounts.

**Current source correction:** PR #54 adds a shared currency-symbol helper, passes the saved user currency to financial pages, and replaces hardcoded naira formatting with the shared formatter. Frontend lint/build is pending for the latest commit; automated frontend tests are not configured.

**Pass evidence:** Passing frontend lint/build for the exact commit and browser screenshots for all supported currencies across the named screens. Keep this gate open until browser evidence is recorded.


## RV-37 — Verify Settings phone-number persistence

**Related finding:** QA-FIND-067.

**Check:** On a clean database, confirm migration 005 creates nullable `users.phone`. On an existing database with a test user, apply migration 005 and confirm the user's other profile and expense data remain unchanged. Through the profile API and browser Settings page, save `+234 803 123 4567`, reload the page, and confirm it persists. Verify blank input clears the field; non-string, over-30-character, and control-character values return HTTP 400 and do not overwrite the stored number.

**Current source correction:** PR #54 adds migration 005, the model field, API validation/response data, frontend request payload, and a backend regression test. CI also checks that the column exists and that CD applies migration 005 after migration 004 but before restarting app services. CI run `38219803561` passed all eight jobs for branch-head commit `92eefc22555c7c98df240014721084e2f41698f8`; 58 backend tests passed on two consecutive runs and the CI database verified migration 005. Existing-volume AWS and browser checks remain pending.

**Pass evidence:** Passing CI for the exact commit, clean/existing-database migration evidence, API read-back, and AWS staging/browser verification after deployment.


## RV-38 — Confirm notification preferences cause the promised behavior

**Related finding:** QA-FIND-068.

**Check:** First confirm the agreed scope: real notifications or inactive preference controls. If real notifications are required, enable in-app and email alerts separately and trigger a deterministic test. Verify delivery to the correct user when enabled and no delivery when disabled. Test weekly scheduling, duplicate prevention, retries/failures, and user isolation. If delivery is out of scope, confirm the UI clearly says the settings are not active and does not imply messages will be sent.

**Current source evidence:** The reviewed profile API stores `notifications_enabled` and `email_alerts_enabled`, but the repository has no identified mail-sending dependency, notification worker/scheduler, or push-delivery implementation. The scope decision and runtime behavior remain unverified.

**Pass evidence:** Written scope decision; if implemented, automated tests plus a staging delivery record; otherwise, approved UI wording and browser evidence that no active-delivery promise remains.


## Latest branch-head CI checkpoint — 2026-10-12
Run `38219803561` passed all eight jobs for commit `92eefc22555c7c98df240014721084e2f41698f8`. Both backend test passes completed with 58 passed tests. CI applied migrations 001–005, verified the budget-category `RESTRICT` rule and `users.phone`, and checked migration ordering before app restart. This does not close the existing AWS volume, live deployment, public health, browser, production rate-limit, CSP/HSTS, or notification-delivery gates.


## RV-39 — Verify currency changes do not misrepresent historical amounts

**Related finding:** QA-FIND-069.

**Check:** Create an expense and a budget while the account currency is NGN. Change the preferred currency to USD and revisit Transactions, Budgets, Dashboard, and Reports. Record whether numeric values change or only symbols change. Compare the behavior with the approved product decision. If the application converts values, verify the chosen rate, rate timestamp, rounding, and historical-record policy; if it is display-only, verify the UI warns users that values are not converted.

**Current source evidence:** The user model stores a single currency preference; expense and budget records do not store currency. The frontend formats existing numeric values with the selected currency symbol. A written product decision is required before QA can call this behavior correct.

**Pass evidence:** Written currency semantics, passing tests for the approved behavior, and browser evidence across all financial screens. Do not infer conversion from a changed currency symbol.


## RV-40 — Verify the configured budget alert threshold

**Related finding:** QA-FIND-070.

**Check:** Confirm the intended threshold behavior with the product team. If alerts are required, set thresholds to 50%, 80%, and 100%; add expenses that put spending just below, exactly at, and just above each threshold. Verify when the alert appears, that it is not duplicated for the same budget/period, that notification preferences are honored, and that different users/budgets remain isolated. Test a spending decrease and later threshold crossing. If alerts are out of scope, verify the setting is removed or clearly described as inactive.

**Current source evidence:** The API persists the budget_threshold field, but the reviewed budget/dashboard components do not read it. Budget status currently uses the 100% limit boundary. App also passes an empty notification list to the notification UI. A product decision is needed before expected behavior can be finalized.

**Pass evidence:** Written threshold rules, automated boundary and duplicate-prevention tests if implemented, and browser evidence showing the agreed alert behavior or revised UI wording.


## RV-41 — Verify automatic recovery after AWS VM/Docker restart

**Related finding:** QA-FIND-071.

**Check:** Deploy the reviewed commit to AWS staging and record the running container IDs/image tags. Reboot the EC2 VM or restart Docker. Do not SSH in to manually run Compose. Verify PostgreSQL, backend, frontend, and Nginx return to healthy status, both public health endpoints recover, and the expected commit-specific images remain in use. Confirm saved test users, expenses, and budgets still exist. Verify startup recovery does not bypass migration ordering.

**Current source correction:** PR #54 adds `restart: unless-stopped` to all four Compose services. CI run `38221595123` passed all eight jobs and verified all four policies in the resolved Compose configuration. AWS reboot recovery has not been demonstrated; confirm Docker starts on boot and the stack becomes healthy without manual intervention.

**Pass evidence:** Restart/recovery timestamps, container health and image versions before/after, successful public health checks, and data-persistence results.


## Latest code CI checkpoint — 2026-10-12
Run `38221595123` passed all eight jobs for source-branch head `72ff22992e8561b5c85422f664854a7bce964ff7`; 58 backend tests passed twice. CI verified migrations 001–005, the users.phone column, the budget-category RESTRICT rule, and restart policies for all four Compose services. Actual AWS reboot recovery, populated-volume migration, live deployment/health, browser journeys, production rate-limit storage/proxy handling, CSP/HSTS, currency semantics, and notification delivery remain open.


## RV-42 — Restore an off-host database backup and verify data integrity

**Related finding:** QA-FIND-072.

**Check:** Obtain the approved AWS backup/snapshot configuration and restore a recent backup into an isolated database. Do not overwrite production. Compare expected users, expenses, categories, budgets, and representative monthly totals against the source backup metadata or a known test dataset. Record the backup timestamp/recovery point and time taken to restore. Verify a pre-migration backup can be restored before any destructive schema/data change.

**Current source evidence:** PostgreSQL uses a named Compose volume on the VM. The reviewed repository does not define a scheduled off-host backup or a tested restore workflow; an external AWS backup may exist but requires evidence.

**Pass evidence:** Backup schedule/retention and access policy, redacted successful restore logs, data-integrity results, and documented recovery point/recovery time. Do not close based only on a claim that snapshots are enabled.


## RV-43 — Verify per-client rate limits through Nginx and shared storage

**Finding:** QA-FIND-073. **Owner:** Backend + DevOps. **Status:** Open.

**Source-level concern:** PR #54 now configures `ProxyFix(x_for=1, x_proto=1)` and adds a unit test that verifies the rightmost forwarded address is selected for the documented single Nginx hop. Confirm that assumption against the actual AWS topology. The limiter still has no explicit shared storage URI, so in-memory counters reset on restart and are not shared across replicas.

**Procedure:**
1. Record the approved production rate-limit policy, Nginx proxy topology, and shared-store service/configuration. Do not put credentials in evidence.
2. From two distinct test clients through the public AWS endpoint, make login attempts below and above the configured limit. Record status codes and timestamps.
3. Confirm one client's requests do not consume the other client's quota.
4. Send a forged `X-Forwarded-For` header from an untrusted client and confirm it cannot choose an arbitrary rate-limit identity.
5. Restart the backend and verify counter behavior matches the approved policy. If the deployment runs more than one backend instance, confirm both use the same counter store.
6. Verify expected HTTP 429 responses and that the API does not disclose store credentials or internal connection details.

**Pass evidence:** Configuration review; automated tests for trusted proxy handling, independent clients, and forged-header resistance; redacted shared-store configuration evidence; AWS request/response logs showing independent counters, restart behavior, and expected 429 results.

**Fail conditions:** All clients share one proxy counter; forwarded headers can be spoofed; counters unexpectedly reset or diverge between instances; no shared store is configured for a multi-instance deployment; or 429 behavior does not match the documented policy. A green CI run alone does not close this gate.


## RV-44 — Verify email change identity and verification flow

**Finding:** QA-FIND-074. **Owner:** Backend + product/security. **Status:** Open.

**Procedure:**
1. Record the approved email-change policy and whether email delivery is in scope.
2. Attempt to change the account email with a valid JWT but without the required re-authentication. Verify the expected rejection if re-authentication is required.
3. Request an email change to a new address. Before verifying it, log out/in with the old and new addresses and confirm the old address remains active until the verification step succeeds.
4. Test duplicate address, invalid/expired/reused verification token, request throttling, and a valid one-time verification.
5. Confirm the old address is notified where required and that token/session behavior follows the approved policy.

**Pass evidence:** Approved policy, automated test results, redacted email delivery/verification trace, and staging API/browser evidence for rejected and successful changes.

**Fail conditions:** An unverified new email becomes the login identity, a verification token can be reused or never expires, duplicate-email races return the wrong result, or the implementation contradicts the written policy.


## RV-45 — Verify the approved password policy is enforced

**Finding:** QA-FIND-075. **Owner:** Backend + product/security. **Status:** Open.

**Procedure:** Record the approved minimum and maximum password lengths. Submit registration requests with values below, at, and above those limits, plus empty, whitespace-only, non-string, and oversized values. Confirm invalid requests return the documented client error and do not create a user. Confirm an accepted password can authenticate and that the UI gives the same guidance as the API. Do not test or store real user passwords.

**Pass evidence:** Approved policy, passing automated boundary tests, exact commit SHA, browser validation evidence, and proof that rejected registration leaves no account record.

**Fail conditions:** A password outside the agreed policy is accepted, invalid input produces a server error, the UI and API disagree, or a rejected registration leaves a user record.

## RV-46 — Verify password change/recovery scope and security

**Finding:** QA-FIND-076. **Owner:** Team lead + backend/security. **Status:** Open pending scope decision.

**Procedure:** First record whether self-service password change and reset are required. If implemented, verify current-password checks, successful rotation, rejection of an incorrect current password, old-password rejection after rotation, single-use/expiring reset tokens, rate limiting, and non-disclosure of account existence. Use a controlled test mailbox; never place credentials or reset tokens in audit evidence. If explicitly out of scope, verify the limitation is documented and the UI does not imply a recovery feature exists.

**Pass evidence:** Written scope decision; if in scope, passing security tests and redacted staging evidence of the complete flow; if out of scope, approved documentation/UI wording.

**Fail conditions:** A password can be changed without the required authorization, a reset token can be reused or does not expire, recovery responses disclose account existence, or the team claims self-service recovery without a working tested path.


## Latest CI checkpoint — 2026-10-12

Code CI run 38270547450 passed all eight jobs for correction commit 8d5fddc6c163a3f48986d22b770bd76d4547a81c. Backend lint passed and the backend suite passed 59 tests twice, including the trusted-proxy regression test. Migrations 001–005, the budget-category RESTRICT rule, the phone column, and migration ordering were checked; frontend lint/build, secret scanning, both Docker builds, and aggregate CI passed. CI still warns that Flask-Limiter uses in-memory storage. The proxy code correction is source/CI-verified for one Nginx hop, but shared production storage and AWS topology/runtime checks remain open. This checkpoint does not close any gate requiring populated AWS database, public health, browser flows, reboot recovery, or backup restore.


## RV-47 — Verify partial profile updates preserve omitted name fields

**Finding:** QA-FIND-077. **Owner:** Backend + frontend + QA. **Status:** Open pending current-head CI and browser retest.

**Procedure:**
1. Register a test account with a two-part name.
2. Send an authenticated profile update containing only first_name. Read /api/auth/me and confirm last_name remains unchanged.
3. Send an authenticated profile update containing only last_name. Read /api/auth/me and confirm first_name remains unchanged.
4. Test a one-part existing name, whitespace-only first name, non-string name values, and a full name over the supported length.
5. In the browser, save a first-name-only and last-name-only change if the UI supports partial updates; reload and confirm the saved profile is consistent.

**Pass evidence:** Current-head CI result, API request/response and read-back evidence, and browser save/reload proof.

**Fail conditions:** An omitted name part becomes blank or changes unexpectedly, invalid input is accepted, or the browser state differs from the persisted profile.


## Latest code CI checkpoint — 2026-10-12

CI run 38271222415 passed all eight jobs for correction commit 2316a358ca37495ecc41eff8aaf48f888654e5b8. Backend lint passed and the backend suite passed 60 tests twice, including trusted-proxy and partial-profile-name regression tests. Migrations 001–005, the budget-category RESTRICT rule, the phone column, and migration order passed CI; frontend lint/build, secret scan, both Docker builds, and aggregate CI passed. Flask-Limiter still warns that it uses in-memory storage. This does not close AWS populated-volume migration, live deployment, public health, browser, reboot recovery, backup restore, or shared rate-limit storage gates.


## RV-48 — Category deletion handles concurrent budget references
**Purpose:** Confirm a budget foreign-key conflict during category deletion is reported as a normal conflict, not a server error.

**Procedure:** CI simulates the race by allowing the pre-check to pass and then raising a PostgreSQL-style `fk_budgets_category` integrity error at commit. Verify HTTP 409, a clear reference-conflict message, and that the category still exists. Also verify unexpected database errors still return HTTP 500. On AWS staging, attempt a safe concurrent create/delete test only if a disposable category and budget can be used.

**Current correction:** PR #54 now recognizes both `fk_expenses_category` and `fk_budgets_category` as expected reference conflicts. The regression test was added in commit `ea775178ea545b48bfea9cdaadd77b7b0965d4b8`; CI run `38272033341` passed all eight jobs for the prior commit. The test is now parameterized for both expense and budget foreign-key races in commit `7b6690db8543822254efdbe8caa3f32d3ac3b265`; CI retest is pending. AWS concurrency verification remains pending.

**Pass evidence:** Passing CI for the exact commit, regression output, HTTP status/body, and category read-back. Do not mark AWS concurrency verification complete without staging evidence.


## Latest code CI checkpoint — 2026-10-12

CI run 38272033341 passed all eight jobs for correction commit ea775178ea545b48bfea9cdaadd77b7b0965d4b8. Backend lint passed and 61 tests passed twice, including the budget foreign-key race regression. Migrations 001–005, budget-category RESTRICT, the phone column, and migration order passed CI; frontend lint/build, secret scan, both Docker builds, and aggregate CI passed. Flask-Limiter still warns that storage is in-memory. This does not close AWS populated-volume migration, live deployment, public health, browser, reboot recovery, backup restore, or shared rate-limit storage gates.



## RV-49 — Verify whole-month budget totals and frontend regression tests

**Finding:** QA-FIND-079. **Owner:** Frontend + QA. **Status:** CI passed for code head `77620d6547cad3ee3774657df9dd0b9256ed9ff6`; browser verification remains open.

**Source-level correction:** PR #54 adds `calculateBudgetSpent` in `frontend/src/utils/budgetSpending.js`, tests in `frontend/tests/budgetSpending.test.js`, and a `npm test` script. CI run `38273922288` passed all eight jobs for commit `77620d6547cad3ee3774657df9dd0b9256ed9ff6`; the frontend step executed all seven Node tests successfully, including budget calculation and search tests. Browser verification is still required before closure.

**Procedure:**
1. Run the frontend test command and confirm the CI job executes (not skips) `npm test`.
2. Confirm whole-month budget tests add all same-month expense categories and exclude other months.
3. Confirm category-budget tests count only the matching category.
4. Because the browser form's support for creating whole-month budgets remains an unresolved product-scope decision (QA-FIND-061), create a whole-month test budget through the authenticated API or seed it in a disposable test database, then load it in the browser. Do not treat this as proof that the UI can create that budget.
5. Confirm spent amount, percent spent, remaining amount, and exceeded/on-track status are correct.
6. Repeat with a category-specific budget and confirm only its matching category is counted.

**Pass evidence:** Current-head CI success, test output showing the test count, and redacted browser evidence with expected and displayed totals.

**Fail conditions:** Whole-month budget shows zero despite expenses, includes another month's expense, a category budget includes other categories, or CI skips the frontend tests. UI creation of whole-month budgets remains governed separately by QA-FIND-061 and its product decision gate.


## RV-50 — Verify a clean Docker setup using both environment files
**Purpose:** Confirm a new team member can follow the Docker guide and start the application without an undocumented prerequisite.

**Procedure:** In a disposable clean checkout, ensure the root `.env` and `backend/.env` are absent. Follow `docs/docker.md` exactly: copy both example files, replace the root database-password placeholder, set distinct strong Flask/JWT secrets in the backend file, then run the documented Compose startup command. Check all four services and both public health routes. Never include actual secrets in captured output.

**Current correction:** PR #54 adds the missing `cp backend/.env.example backend/.env` instruction and explains the separate secret settings. Clean-start execution has not been observed yet.

**Pass evidence:** Current CI result, recorded setup commands, `docker compose ps` showing all four services healthy, and successful local health checks. The code/CI result alone does not close the clean-start gate.


## Latest code CI checkpoint — 2026-10-12

CI run 38272803374 passed all eight jobs for correction commit f58bd3fbc4e75ae224c3bb3981a704d3c3ba1c45. Backend lint passed and 62 tests passed twice; the frontend suite executed four Node tests and all four passed, including whole-month and category-specific budget spending. Migrations 001–005, budget-category RESTRICT, the phone column, and migration order passed CI; frontend lint/build, secret scan, both Docker builds, and aggregate CI passed. npm audit reported zero vulnerabilities. Flask-Limiter still warns that storage is in-memory. This does not close AWS populated-volume migration, live deployment, public health, browser, reboot recovery, backup restore, or shared rate-limit storage gates.


## Latest CI checkpoint — 2026-10-12
Run `38272803374` passed all eight jobs for correction commit `f58bd3fbc4e75ae224c3bb3981a704d3c3ba1c45`. Backend tests passed 62 tests twice. Frontend CI executed the newly added budget-spending tests: 4 passed, 0 failed. Database migrations, secret scan, frontend lint/build, both Docker builds, and aggregate CI passed. This does not close AWS or browser-runtime gates.


## RV-51 — Verify global search filters budget results correctly

**Finding:** QA-FIND-081. **Owner:** Frontend + QA. **Status:** CI passed for code head `77620d6547cad3ee3774657df9dd0b9256ed9ff6`; browser retest remains open.

**Procedure:**
1. Create or load budgets for at least two categories and two months.
2. Search by one category name; verify only the matching category budget is included.
3. Search by month; verify only budgets whose month/limit text matches appear.
4. Search for unrelated text; verify no budgets appear unless the text genuinely matches a title or subtitle.
5. If a whole-month budget exists, verify it displays a clear “Overall Monthly Budget” title.
6. Confirm matching expense and category search results still work.

**CI evidence:** Run `38273922288` passed all eight jobs for code head `77620d6547cad3ee3774657df9dd0b9256ed9ff6`; all seven frontend Node tests passed and backend tests passed 62 tests twice. **Still required:** Browser evidence for category/month/non-matching searches.

**Fail conditions:** Unrelated budgets are returned, matching budgets are omitted, or the change breaks expense/category search.


## Latest code CI checkpoint — 2026-10-12

CI run 38273922288 passed all eight jobs for correction commit 77620d6547cad3ee3774657df9dd0b9256ed9ff6. Backend lint passed and 62 backend tests passed twice. The frontend Node suite passed all seven tests, including whole-month spending, category-specific spending, and budget-search filtering. Migrations 001–005, budget-category RESTRICT, the phone column, and migration order passed CI; frontend lint/build, secret scan, both Docker builds, and aggregate CI passed. npm audit reported zero vulnerabilities. Flask-Limiter still warns that storage is in-memory. The whole-month spending calculation is CI-verified, but creating a whole-month budget through the browser remains a scope decision and must not be marked as implemented. AWS runtime/browser, populated-volume migration, reboot recovery, backup restore, and shared rate-limit storage remain open.


## RV-52 — Verify formula protection in both CSV export paths
**Owner:** Frontend/QA. **Environment:** CI plus browser verification.

**Steps:** Confirm `Transactions.jsx` and `Reports.jsx` import and use the shared `escapeCsvCell` helper for every exported cell. Run the frontend Node tests and lint/build. In a browser, create or use a disposable test expense with description `=1+1`, export it from both Transactions and Reports, and inspect the downloaded CSV.

**CI status:** Passed in run `38276034129` for commit `97e6515f00c15e240532da653235421a2c6fb055`; all nine frontend Node tests and frontend lint/build passed.

**Pass criteria:** Formula-leading values are prefixed so spreadsheet software treats them as text; embedded quotes remain valid CSV; ordinary date and amount cells remain correctly quoted; both export paths behave consistently. Browser-download verification is still open.

**Evidence:** CI run ID, exact commit SHA, test output, and sanitized sample rows from both downloads. Do not open a deliberately unsafe test export in a spreadsheet application; inspect the CSV as text.


## RV-53 — Verify report CSV download completes before Blob URL cleanup
**Owner:** Frontend/QA. **Environment:** Browser test on the deployed/staging app or local integrated stack.

**CI status:** Run `38276034129` passed all eight jobs for commit `97e6515f00c15e240532da653235421a2c6fb055`; frontend lint/build and all nine Node tests passed.

**Steps:** Export a report with a few rows and another with many rows. Repeat exports. Confirm the file downloads, opens as text, contains all expected rows, and does not trigger console errors. Confirm the cleanup code delays `URL.revokeObjectURL` rather than revoking synchronously after `click()`.

**Pass criteria:** All exports complete consistently with correct row counts and contents in each supported browser tested. CI verifies the helper and build but does not close browser download verification.

**Evidence:** Browser/version, sanitized test data, expected versus actual row count, and download confirmation. CI passing alone does not close this gate.


## RV-54 — Verify debug mode is disabled outside development/test
**Owner:** Backend/security. **Environment:** CI; production entry-point source review.

**Steps:** Run the parameterized `debug_mode_enabled` tests for production, prod, development, dev, testing, test, and empty environment values. Review the backend Dockerfile to confirm it still starts Gunicorn rather than `python app.py`.

**Pass criteria:** Debug is enabled only for the explicit development/test values; production, prod, and empty/unknown values return false. The production container entry point remains Gunicorn.

**CI status:** Run `38277037377` passed all eight jobs for commit `8151bb56e730c6f6eb0205691b334a121abc934e`; the backend suite passed 69 tests, including the parameterized debug-mode cases.

**Evidence:** CI run ID, commit SHA, parameterized test result, and reviewed Docker entry point. Do not claim a live AWS debugger check unless the deployed environment was actually inspected.


## RV-55 — Verify UTF-8 text in Reports CSV downloads
**Owner:** Frontend/QA. **Environment:** Browser and supported spreadsheet application.

**Steps:** Create disposable report data containing non-ASCII characters in a category name or description. Export the report and confirm the Blob begins with a UTF-8 BOM and the downloaded file preserves the characters when opened/imported.

**CI status:** Run `38277483412` passed all eight jobs for commit `2cc775b4ddc514e8dea5c6c1d80d633d47991ff1`.

**Pass criteria:** The exported report contains the expected Unicode text and opens without encoding corruption in the supported spreadsheet workflow.

**Evidence:** Browser/application versions, test value, downloaded file inspection, and successful display/import result. Do not include real user financial data in evidence.


## RV-56 — Verify least-privilege PostgreSQL runtime permissions
**Owner:** Database/DevOps/backend. **Environment:** CI plus disposable AWS staging database.

**Steps:** Inspect the database role used by the backend and compare it with the bootstrap/migration role. Run the application CRUD suite using the restricted runtime role. Attempt prohibited operations such as creating a role/database, dropping unrelated objects, and changing schema ownership. Separately verify the migration job uses the administrative role and can complete migrations 002–006 on both a fresh database and a disposable populated copy.

**Pass criteria:** Backend runtime credentials are distinct from administrative credentials; normal application CRUD works; privileged database operations fail for the runtime role; migrations succeed using the administrative role; failure/rollback procedures are documented.

**Evidence:** Sanitized role/grant listing, test results, migration logs, and AWS staging commit/schema evidence. Never include passwords or secret values in evidence. Do not close based on source inspection alone.


## RV-57 — Verify the documented AWS URL and architecture against production
**Owner:** Team lead/DevOps. **Environment:** Deployed AWS environment and repository.

**Steps:** The README proposed in PR #54 includes the production domain recorded in the previous main README and embeds the architecture image already present in `docs/`. Test the domain from outside the EC2 host, check `/api/health` and `/api/health/db`, record the running commit/image digest, and compare the diagram with the actual AWS topology. Update the URL or diagram only if runtime evidence shows a mismatch.

**Pass criteria:** The URL resolves to the reviewed application; both health checks pass; the deployed commit/image is recorded; and the diagram matches the actual cloud entry point, host/network, Nginx, frontend, Flask API, PostgreSQL, and CI/CD flow.

**Evidence:** Timestamped URL and sanitized health responses, deployed commit/image digest, and the diagram path/commit. README text or source inspection alone does not close the runtime gate.


### Status update — RV-56 (2026-10-13)
CI run `38381389211` passed all eight jobs for code commit `85871877850b81b367be2acb1135dced73a95255`. The database job applied migrations 001–006 and confirmed the application role has required table/sequence privileges while prohibited role/database/schema creation fails. The backend suite passed 69 tests and the frontend suite passed nine tests. This closes the CI portion of RV-56 only. A disposable populated AWS database, actual deployment, and post-deployment CRUD/privilege checks are still required.


### Documentation source check — 2026-10-13
The README and architecture document are updated in PR #54 to use AWS EC2, the current Compose host port 80, the existing architecture image, the restricted runtime database account, and the current CI/CD migration path. This is documentation/source evidence only; the public domain and live AWS release still need runtime verification.


## Test-isolation checkpoint — 2026-10-13
Current PR #54 commit 04fe7f2ea0942c467b1c0af29d7e60d63b3791e2 has passed the first 71-test backend run. The workflow's second repeatability run and both Docker builds must finish before the current correction head is marked green. The fixture clears rows before each test; it does not reset database identity sequences, so test IDs must not be assumed to start at one.


## Latest green correction checkpoint — 2026-10-13
CI run 38418489243 passed all eight jobs for commit 905f5db2ff17d968e220f890d90007ce74a42cc2. Backend lint passed and both consecutive runs passed 71 tests. Frontend lint/build and nine Node tests passed; npm audit reported zero vulnerabilities. The database job applied migrations 001–006 and verified the restricted runtime role. Both Docker builds, secret scanning, and aggregate CI passed. AWS existing-volume migration, live deployment, public health checks, and browser journeys remain pending.


## Documentation ownership checkpoint — 2026-10-13
PR #54 is the sole owner of the root README and architecture document changes. PR #53 contains QA findings, traceability, test planning, runtime gates, and the release checklist only. This removes duplicated root-document changes across the two open PRs. Live AWS verification remains pending.


## Repository metadata alignment
The repository's GitHub About description still names the previous cloud target even though the root README, architecture guide, and CD workflow on PR #54 use AWS EC2. QA-FIND-087 and team action 59 record the required repository-admin update. This is metadata outside the code files; the team must update the repository description and retain evidence. PR #53 remains open and unmerged.


## Current correction branch checkpoint — 2026-10-13
CI run `38418979526` passed all eight jobs for `ae54eec01018a728f97bd7c77f7ccbcad3a96a05`: database migration/role checks, secret scan, component detection, backend lint and tests, frontend lint/tests/build, both Docker builds, and aggregate `ci-success`. The backend suite passed 71 tests and the frontend Node tests ran successfully; npm audit reported zero vulnerabilities. This confirms the CI environment only. AWS existing-volume migration, actual deployment/image version, public health checks, browser flows/downloads, reboot recovery, backup restore, and shared production rate-limit storage remain open.

## Audit register hygiene
Two duplicate category-write authorization placeholders were removed from QA/QA_FINDINGS.md; QA-FIND-010 remains the canonical entry. The register now has 85 distinct findings/observations. IDs remain stable to preserve traceability; numbering gaps are intentional.
