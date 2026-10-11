# Runtime Verification and Closure Plan

Date: 2026-10-11
Applies to: Expense Management Platform capstone
Reference branches: upstream main, upstream integration/deployable-main, QA fork PR #53 and correction PR #54.

## Purpose

Passing CI establishes that the tested commit passed the automated jobs that ran. It does not establish that the deployed application is reachable, that Nginx routes requests correctly, that production secrets are safe, or that a browser workflow works end to end. The checks below are required before closing the associated QA findings.

## Release-blocking items and required decisions

### RV-01 — Choose and prove the deployment target
Related finding: QA-FIND-008. Priority: Release blocker.

Why it matters: The supplied capstone specification explicitly requires Azure VM deployment. The upstream README documents AWS EC2. Merely having an Azure workflow is not evidence that the app was deployed to Azure. If the wrong target is submitted, the project can fail the stated infrastructure requirement even when the app works.

Action: The team must confirm the target with the instructor. If Azure is required, configure the Azure VM secrets/variables, deploy the reviewed commit, and record the public app URL/IP and VM evidence. If the instructor approves AWS instead, record that approval and update the requirement traceability/README to reflect the decision; do not silently substitute one cloud for another.

Pass evidence: Written target decision; deployment workflow run for the intended target; timestamped URL/IP response; VM/container status; and demonstration screenshots. No target decision means this remains open.

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

Pass evidence: Migration applied successfully, database indexes/constraints verified, regression/concurrency tests pass, and dashboard totals are checked against known records.

### RV-05 — Verify application and database health through Nginx
Related finding: QA-FIND-034 and deployment health-check finding QA-FIND-012. Priority: High; deployment gate.

Why it matters: A health endpoint that works only when called directly inside the backend container does not prove the public reverse-proxy route works. If /api/health/db is forwarded as /api/health/db instead of /health/db, the public database check may return 404 even when PostgreSQL is healthy. If CD checks the wrong path, it can either reject a healthy deployment or miss a real failure.

Action: Keep explicit exact Nginx mappings from /api/health to backend /health and /api/health/db to /health/db. Start the full Compose stack and check the public endpoints from outside the containers. Verify both success and failure behavior; the DB endpoint must return non-success when the database cannot be reached. Ensure deployment waits for database readiness before migration and health checks.

Required tests: Through the public Nginx port, /api/health returns 200 and status=ok; /api/health/db returns 200 and database=connected when DB is reachable; invalid/unavailable DB makes DB health fail; CD stops and reports failure if either endpoint fails. Record response status/body and run ID.

Pass evidence: Successful Compose/Nginx runtime test and a deployment workflow run whose two health checks both pass. A source mapping alone is not enough to close the finding.

### RV-06 — Make production signing-secret validation fail closed
Related finding: Existing production-secret finding noted in PR #53/#54. Priority: High; security blocker.

Why it matters: If Flask/JWT signing keys are missing, weak, or predictable in production, token integrity and session security can be compromised. A local development default must never silently become a production secret.

Action: Validate required secrets at production startup. Reject absent, placeholder, known-default, or insufficiently strong keys; do not log their values. Keep test/development values explicitly scoped to non-production test configuration. Confirm whether SECRET_KEY and JWT_SECRET_KEY should be distinct, and wire each config key to its intended environment variable.

Pass evidence: Automated configuration tests prove production startup fails for missing/placeholder keys and succeeds with valid configured keys; secret scanning passes; no secret values appear in logs.

### RV-07 — Configure shared production rate-limit storage
Related finding: Existing rate-limit finding in PR #54. Priority: High for multi-worker production.

Why it matters: In-memory rate limits are local to a process. With multiple workers or multiple instances, a caller can receive separate allowances from each worker and limits reset on restart. This weakens abuse protection and can create inconsistent user experience.

Action: Configure a shared supported backend such as Redis for production, with credentials supplied as secrets and connectivity monitored. Keep in-memory storage only for local development/test, and fail or warn according to an explicit production policy rather than silently using process-local storage.

Pass evidence: Production config uses shared storage; test requests across workers share the same limit; Redis outage behavior is documented and monitored; no credentials are logged.

### RV-08 — Verify GHCR image access and deploy the exact tested commit
Related finding: QA-FIND-012 and deployment workflow verification. Priority: High; deployment gate.

Why it matters: CI may build and publish an image successfully while the VM cannot pull it because the package is private or the VM has not authenticated. A deployment can also pull a moving latest tag that is not the exact commit tested by CI.

Action: Decide whether GHCR packages are public or private. For private packages, provision least-privilege read access on the VM and test login non-interactively. Prefer immutable SHA-tagged images for deployment and record the commit SHA/image digest. Confirm the VM's checkout and image correspond to the same reviewed release.

Pass evidence: VM successfully pulls both images; deployment logs identify the immutable tag/digest; running containers report the expected release; rollback instructions are documented and tested.

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

Source correction now proposed in PR #54: app.py reads JWT_SECRET_KEY first, then JWT_SECRET, and uses SECRET_KEY only as a backward-compatible fallback if no dedicated JWT variable is set. The example environment file now documents separate Flask and JWT secret placeholders.

Remaining action: remove the production ambiguity by requiring a dedicated JWT signing secret in production; reject missing or placeholder values and add configuration tests proving that the dedicated variable is used. The compatibility fallback must not allow production to start without the dedicated JWT key.

Pass evidence: automated tests show that distinct Flask and JWT values populate distinct config keys; production fails when either is missing/placeholder; test environment remains deterministic; CI and secret scan pass. Until those tests and fail-closed behavior exist, QA-FIND-036 remains RETEST PENDING.

## RV-11 — Handle budget uniqueness conflicts distinctly from server failures
Related finding: QA-FIND-042. Priority: Medium–High.

Why it matters: the budget route currently catches all commit exceptions and returns HTTP 500. Once a database uniqueness constraint is added, an expected duplicate is a conflict, not an internal server failure. Treating all errors alike makes client behavior and monitoring inaccurate.

Action: catch the specific integrity exception for the budget uniqueness constraint, roll back the session, and return HTTP 409. Preserve HTTP 500 for unexpected database failures and log them safely without exposing SQL or secrets.

Pass evidence: automated tests show duplicates return 409, simulated unexpected database errors return 500, session rollback succeeds, and no sensitive details appear in client responses.

## RV-12 — Isolate API tests from persistent and production data
Related finding: QA-FIND-043. Priority: Medium; test reliability gate.

Why it matters: the API test fixture toggles test mode and resets rate limiting, but does not itself isolate the database or clean up records created by registration/category tests. Repeated or reordered runs can collide with leftovers, and a misconfigured local environment could target an unintended database.

Action: confirm CI uses a dedicated disposable database; introduce safe transaction/schema cleanup or equivalent isolated fixtures; and add a guard that refuses destructive test setup unless the database is explicitly identified as a test database.

Pass evidence: the suite passes twice consecutively and in altered order; test-created records are cleaned up; and a non-test database configuration is rejected before any mutation.

