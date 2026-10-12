# Expense Tracker — QA Team Action Summary

**Project name:** Expense Tracker  
**Project explanation:** A web application for recording expenses, managing budgets, viewing reports, and exporting transaction data.  
**Enhanced version:** QA findings, corrections, and deployment checks for the Expense Tracker capstone.

## Why this document exists

This document tells the team what is wrong, why it matters, and who needs to act. Read the short action first. The detailed QA findings contain the supporting evidence and test steps.

**Status rule:** “Found” means the code has a problem. “Correction proposed” means code has been changed but still needs review and tests. “CI passed” means automated checks passed for the named commit. “Runtime pending” means the app still needs to be run and checked. These statuses must not be treated as the same thing.

## Actions for the team

### 1. Backend: protect category changes
**What happens:** The category API allows create, edit, and delete requests without checking who is making the request.

**Why it matters:** Someone who should not manage categories may change categories used by other users.

**Backend owner:** Decide whether categories are shared and admin-managed or belong to individual users. Add the correct login/role or ownership checks and tests. Do not simply block all category changes without providing an authorized way to manage them.

**QA check:** Requests without permission must fail. An authorized administrator or owner must still be able to make allowed changes.

### 2. Backend and database owner: verify budget uniqueness correction
**What happens:** The original route checked for duplicate budgets in application code only, which could allow concurrent requests to race.

**Why it matters:** Duplicate budgets can distort spending limits and reports.

**Correction status:** PR #54 adds database unique indexes for category and whole-month budgets, maps the known uniqueness conflict to HTTP 409, rolls back failed commits, and preserves generic HTTP 500 responses for unexpected failures. CI run 38219803561 passed all 58 backend tests twice and verified the migrations in the CI database.

**QA check still required:** Verify duplicate behavior against a populated AWS database, including concurrent requests and whole-month budgets. Retain response codes and row-count evidence.

### 3. Backend/configuration owner: verify external database credentials
**What happens:** The original Compose file used fixed database credentials.

**Correction status:** PR #54 now requires POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB from the root environment configuration. CI resolves the Compose file with test values and checks that the legacy fixed password is absent.

**Why it matters:** Fixed credentials can be reused unintentionally and are not safe for production.

**QA check still required:** Verify a clean startup using documented variables, ensure missing values stop Compose, and confirm AWS secrets are set without exposing them in logs. Rotate any real credentials that were previously exposed or reused.

### 4. Backend owner: verify production signing-secret configuration
**What happens:** The original app ignored the dedicated JWT secret and did not fail closed for weak production signing keys.

**Correction status:** PR #54 now reads the dedicated JWT secret variables and rejects missing, weak, placeholder, or shared Flask/JWT secrets in production. CI run 38219803561 passed all 58 backend tests twice.

**Why it matters:** Secret rotation would be unreliable and weak signing keys could allow forged or misused sessions.

**QA check still required:** Confirm AWS uses distinct strong SECRET_KEY and JWT_SECRET/JWT_SECRET_KEY values and the service starts in production mode. Do not expose secret values in screenshots or logs.

### 5. Backend/test owner: make tests safe to repeat
**What happens:** The original fixture did not prove that test data was isolated and cleaned up.

**Why it matters:** A test may pass once but fail the next time because old users or categories remain. A wrong local configuration could also point tests at a database that should not be changed.

**Correction status:** The correction branch uses a dedicated test database, rejects unsafe database names, truncates test tables and resets identities after each test, and runs the backend suite twice. CI run 38219803561 passed all eight jobs and both 58-test runs.

**QA check still required:** Confirm local/staging test database configuration is separate from production and retain the database guard, cleanup implementation, and repeated CI test results.

### 6. DevOps owner: prove the running image matches the tested commit
**What happens:** The original CD workflow used a moving latest tag and separately updated the VM source checkout. PR #54 now selects commit-specific SHA image tags for the successful CI commit.

**Why it matters:** A VM could otherwise run a different build from the one QA reviewed.

**Correction status:** CI run 38219803561 passed the source-level deployment checks.

**QA check still required:** On AWS, compare the CI commit SHA, published image digest, and running container version. Confirm the deployed source/image cannot drift, retain rollback evidence, and verify the VM runs the expected image after restart. SHA-tag use alone does not prove that the tag is immutable.

### 7. DevOps owner: verify migrations on existing databases
**What happens:** PostgreSQL initialization scripts do not automatically run again for an already-created data volume, so the deployment workflow applies migration files explicitly.

**Why it matters:** A new database may work while an existing deployment fails during an update. A failed migration can leave the application and database out of step.

**Correction status:** The current workflow waits for PostgreSQL, applies migrations 002–005 before restarting application services, and CI checks the ordering. Migration 004 protects category-linked budgets; migration 005 adds the optional phone column. The workflow still replays SQL files rather than maintaining a formal migration ledger.

**QA check still required:** Test migration 005 on a populated AWS volume, retain a backup/restore plan, and simulate a migration failure to prove the old application remains running and recovery is documented.

### 8. Team lead/DevOps: use AWS as the approved deployment target
**Decision recorded for this audit:** The QA owner reports that the project tutor approved AWS as an alternative deployment target. The upstream README also identifies AWS EC2 as the current production environment.

**What happens:** The correction branch and current documentation identify AWS EC2 and use AWS-specific deployment secret names. However, source configuration alone does not prove that the AWS VM has the required secrets, that deployment is enabled, or that the latest tested image is live.

**Why it matters:** The team could report deployment success while the VM is unavailable, running an older image, or unable to pull the intended package.

**Required correction:** Confirm the protected AWS secrets/variables, deploy the exact tested commit-specific image, and capture the running digest and public health checks. Do not claim deployment success just because workflow code exists.

**How QA will verify:** Confirm the AWS job targets the intended EC2 host, deploys the reviewed commit, and completes application and database health checks.

**Evidence to close:** Retain the tutor's approval with submission records, workflow run, EC2/container status, timestamped public URL checks, and screenshots showing the deployed version.

### 9. Backend/DevOps owner: verify both health checks through Nginx
**What happens:** The original public database-health route was missing. PR #54 now maps both /api/health and /api/health/db to the backend and checks both after deployment.

**Why it matters:** A backend-only health check does not prove the public proxy route works or that the database is ready.

**Correction status:** CI passed the source-level health-route and deployment-order checks.

**QA check still required:** Call both public AWS endpoints with the database healthy and unavailable. Record status codes, safe response bodies, and deployment logs. Do not mark this complete from source inspection alone.

### 10. Frontend and backend owners: complete the user-flow checks
**What happens:** Passing code checks does not prove that registration, transactions, filters, CSV export, budgets, reports, and dashboard totals work together in a browser.

**Why it matters:** Users may see wrong totals, fail to export the selected transactions, or access another user's data if the API and UI do not work together correctly.

**Frontend owner:** Check the page behavior, loading/error messages, filters, export button, and displayed totals.

**Backend owner:** Check API validation, authentication, ownership, response codes, and database results.

**QA owner:** Test with two test accounts and known sample records. Compare the browser results with the API and database results. Never use real personal financial data for these tests.

## Additional findings requiring team action

### 11. DevOps: confirm the AWS VM can pull the published images
**What happens:** The CD workflow publishes images to GitHub Container Registry (GHCR), but source configuration does not prove the AWS VM can pull them.

**Why it matters:** A successful image build can be followed by a failed deployment if the package is private or the VM lacks registry access.

**Required correction:** Decide whether packages are public or private. If private, configure least-privilege read access on the EC2 VM and authenticate without exposing tokens.

**QA verification and closure evidence:** Pull both images from the target VM, deploy the intended commit-specific tag or pinned digest, and retain logs with secrets redacted plus the deployed image digest.

### 12. Backend/security: configure shared production rate limiting
**What happens:** Flask-Limiter reports that production rate-limit storage is in memory.

**Why it matters:** Limits held in one process are not shared across multiple workers or instances and can reset after restart.

**Required correction:** Configure a supported shared production store, such as Redis, with protected credentials and documented outage behavior. Keep in-memory storage scoped to local development and tests.

**QA verification and closure evidence:** Test requests across workers and retain production configuration, results, and monitoring/failure-behavior evidence.

### 13. Backend/database: verify budget-save conflict handling
**What happens:** The original budget route mapped every commit error to HTTP 500.

**Correction status:** PR #54 now rolls back failed commits, maps only known budget uniqueness violations to HTTP 409, and returns a generic 500 for unexpected errors. CI run 38219803561 passed the budget conflict and session-recovery tests.

**Why it matters:** Duplicate budgets are expected conflicts; unexpected failures must remain server errors and must not poison the next request.

**QA verification and closure evidence:** Recheck duplicate and concurrent budget requests against AWS, then submit a valid budget after a conflict. Retain response codes, row counts, and sanitized-error evidence.

### 14. Backend/test owner: verify test-database isolation
**What happens:** The original test fixture did not prove isolation or cleanup.

**Correction status:** The correction branch uses a dedicated test database, rejects unsafe database names, truncates test tables and resets identities after each test, and runs the full backend suite twice. CI run 38219803561 passed all eight jobs and both 58-test runs.

**Why it matters:** Tests must not depend on leftover records or risk touching a live database.

**QA verification and closure evidence:** Retain the CI database guard, cleanup implementation, both passing test runs, and evidence that local/staging tests cannot point to production data.

### 15. Frontend/backend: normalize the signed-in user profile

**What happens:** The API returns the current profile inside a response object, but upstream main stores the whole response as the user profile. The UI then looks for name fields on the wrong object.

**Why it matters:** The account name or initials may be missing, and components that expect a direct profile object may behave incorrectly. The correction branch extracts and normalizes the profile, but it still needs browser retesting.

**Required correction:** Keep the normalized response handling in the release branch and maintain one clear API-to-frontend profile shape.

**How QA will verify:** Log in, refresh the page, and confirm the session stays valid and the expected account name/initials display correctly.

**Evidence to close:** Tested commit SHA, redacted API response, browser screenshot, and a passing regression test where available.

### 16. Frontend: verify expense search navigation

**What happens:** Upstream main uses a misspelled tab identifier for expense search results, while the page uses the correctly spelled Transactions identifier. The correction branch fixes the identifier.

**Why it matters:** Selecting a search result may set a tab that does not exist, leaving the user unable to open the intended transaction view from search.

**Required correction:** Keep the corrected identifier and add a regression check for selecting an expense result.

**How QA will verify:** Search for a known expense, select its result, and confirm the Transactions page opens and shows the intended record.

**Evidence to close:** Tested commit SHA, browser screenshot/video, and a passing regression check where available.

### 17. Frontend/backend: preserve the month when editing an older budget

**What happens:** The upstream frontend sends the current month when saving any budget, including an edit to an older budget. The backend accepts that month and updates the existing record.

**Why it matters:** Editing a historical budget can move it into the current month, making historical budget reports inaccurate and causing confusing duplicate-budget conflicts.

**Required correction:** When editing, send the budget's existing month. Use the current month only when creating a new budget. The correction branch now preserves the existing month; retesting is still required.

**How QA will verify:** Edit the amount on a budget from a past month, save, reload, and confirm the month has not changed. Then create a new budget and confirm it defaults to the current month.

**Evidence to close:** Tested commit SHA, browser/API result, and before-and-after month values.

### 18. Frontend: make calculated spending clear in the budget form

**What happens:** The budget form allows the user to edit “Amount Already Spent,” but the save request does not send that value. Spending is calculated from recorded expenses, so the input suggests a change can be saved when it cannot.

**Why it matters:** Users may think they changed spending figures when the application ignores the entry.

**Required correction:** Keep the spending field read-only and explain that it is calculated from recorded expenses. The correction branch now does this; browser retesting is still required.

**How QA will verify:** Open create/edit budget forms, confirm the field cannot be edited, save a budget, and compare the displayed spent amount with the actual expense records after reload.

**Evidence to close:** Tested commit SHA, browser screenshot, and comparison with API/expense data.

### 19. Backend/security: protect category changes

**What happens:** The category API allows category creation, editing, and deletion without requiring a signed-in user or checking a role.

**Why it matters:** Anyone who can reach the API may try to change shared categories used by multiple accounts. This can affect what other users see or prevent deletion when a category is already in use.

**Required correction:** Confirm whether categories are shared and administrator-managed or owned by each user. Then enforce the selected policy on every category write endpoint. Frontend button visibility is not a security control.

**How QA will verify:** Try POST, PUT, and DELETE without a token, as a normal signed-in user, and as the permitted role. Confirm unauthorized requests are rejected and one user's changes cannot affect another user's data.

**Evidence to close:** Agreed category policy, code diff, automated authorization tests, tested commit SHA, and redacted API results.

### 20. Backend/DevOps: remove fixed database credentials

**What happens:** Upstream main contains fixed PostgreSQL credentials in Compose. The correction branch now requires values from the root environment file and updates the setup instructions.

**Why it matters:** Fixed credentials are easily reused across environments and make production secrets harder to manage safely.

**Required correction:** Keep the environment-variable configuration, set a unique local password, use protected AWS deployment configuration, and rotate the old password if it was used in a shared/deployed environment.

**How QA will verify:** Run Compose configuration with a configured environment file; confirm it fails clearly when required values are missing; start the services and check application/database health.

**Evidence to close:** Sanitized Compose output, successful startup and health checks, CI result for the correction commit, and confirmation that no real secrets were committed.

### 21. Frontend: add automated UI tests

**What happens:** The frontend package has no test script, while CI uses npm test with if-present behavior. Therefore, CI can pass without executing frontend tests.

**Why it matters:** A green build does not prove that login state, navigation, budget editing, or key screens work when users interact with them.

**Required correction:** Add a frontend test runner and tests for profile refresh, expense search, budget create/edit, and validation. Add browser end-to-end tests for the main user journeys.

**How QA will verify:** Check CI logs for a test command that actually runs and reports a non-zero test count.

**Evidence to close:** Test files, package script, CI run showing tests executed, and results for key flows.

### 22. DevOps/documentation: make the port and startup instructions consistent

**What happens:** The Compose file maps Nginx to host port 80, but the Docker guide previously described port 8080. Setup instructions also did not clearly require the root environment file used for Compose database values.

**Why it matters:** A developer following the wrong URL may think the application is down or collect evidence from the wrong endpoint.

**Required correction:** Keep Compose, README, Docker guide, and examples consistent. Copy the example environment file to the root environment file, configure both root and backend environment files, and follow the URL stated in the docs.

**How QA will verify:** Start from a clean checkout and follow only the documented instructions. Confirm the stated URL and health endpoints respond.

**Evidence to close:** Documentation diff, sanitized Compose config, and clean-start test results.

### 23. DevOps/security: review browser security headers

**What happens:** Nginx sets several security headers, but the reviewed configuration does not include Content-Security-Policy or HSTS.

**Why it matters:** CSP can limit the impact of unexpected script/resource execution. HSTS helps enforce HTTPS, but it should only be set after HTTPS is confirmed at the public endpoint.

**Required correction:** Define and test a CSP compatible with the React app. Configure HSTS at the HTTPS termination layer only after confirming HTTPS behavior and scope.

**How QA will verify:** Inspect response headers on the public HTTPS endpoint and run login, navigation, and API browser tests with CSP enabled.

**Evidence to close:** Header capture, reviewed CSP configuration, and browser results. Do not claim HSTS is enabled unless it is observed on HTTPS responses.

### 24. Backend/DevOps: make authentication rate limits proxy-aware

**What happens:** Login and registration are limited to five requests per minute, but the limiter uses the request's remote address. Behind Nginx, that address may be the proxy address shared by all users. The default in-memory store also does not share limits reliably across workers or restarts.

**Why it matters:** One user's repeated requests may throttle unrelated users, while limits may reset or differ between workers.

**Required correction:** Trust only the known Nginx proxy hop(s), ensure forwarding headers are handled safely, and configure shared production rate-limit storage. Do not trust arbitrary client-supplied forwarding headers.

**How QA will verify:** Send login/register requests through the public Nginx endpoint from two independent client addresses. Confirm one client's limit does not throttle the other and that repeated requests return 429 as expected. Repeat across workers/restarts.

**Evidence to close:** Reviewed proxy/storage configuration, separate-client test results, response codes, and deployed commit/version.

### 25. Frontend: make the budget spending value read-only

**What happens:** The budget form previously displayed an editable spending value, but the save request did not send or store it. Actual spending is calculated from recorded expenses.

**Why it matters:** The form suggests users can set a value that the system ignores, which can confuse users and make the budget display seem inconsistent.

**Required correction:** Keep the spending value read-only and explain that it is calculated from recorded expenses. The correction branch already contains this source change; browser retesting is still pending.

**How QA will verify:** Open create and edit budget forms, confirm the spending value cannot be changed, save a budget, reload, and compare the displayed spending with recorded expense data.

**Evidence to close:** CI result for the fixing commit, browser screenshot, and comparison against expense/API records.

### 26. Backend: return the right error when category deletion fails

**What happens:** The category-delete route previously returned HTTP 409 for every database exception, even when the database itself failed. HTTP 409 should be used when an expense actually references the category.

**Why it matters:** Users and monitoring may be told to change their data when the real problem is a server/database failure.

**Required correction:** Check whether any expense references the category before deleting it. Return HTTP 409 for that known conflict, and return a generic HTTP 500 for unexpected database failures. Roll back the session and do not expose internal database details. The correction branch now checks for references and lets the database enforce the RESTRICT constraint if a race occurs.

**How QA will verify:** Delete a category that is used by an expense and confirm 409. Then simulate a database failure during deletion and confirm 500, no sensitive error details, the category still exists, and a later valid delete succeeds.

**Evidence to close:** Passing CI, API results for both cases, session recovery result, and tested commit SHA.

### 27. DevOps: keep local secrets out of Docker images

**What happens:** The backend and frontend Dockerfiles copy source directories into their build stages. Without .dockerignore files, a local environment file can enter the build context even when Git ignores it.

**Why it matters:** Local secrets may be copied into an image layer or a published image. Host node_modules can also make frontend builds larger and less reproducible.

**Required correction:** The correction branch adds backend/.dockerignore and frontend/.dockerignore to exclude environment files. The frontend ignore file also excludes node_modules, generated output, and logs. CI checks that the ignore files and required rules exist.

**How QA will verify:** CI now builds with harmless sentinel environment files present, loads the images, and checks that the backend image has no /app/.env and the frontend bundle has no sentinel variable. Confirm the new CI run passes.

**Evidence to close:** Ignore-file diff, CI run, successful image builds, and sentinel-based verification where available.

### 28. DevOps: apply database migrations before restarting the app

**What happens:** The deployment workflow previously restarted all services before applying the database migrations.

**Why it matters:** If a migration fails, the new app version may already be running against the old schema, leaving the release partly deployed.

**Required correction:** Start the database, apply migrations 002 and 003, and only restart backend/frontend/Nginx after both migrations succeed. The correction branch now uses this order, applies migrations 002–004, and adds a CI check for the command sequence.

**How QA will verify:** Confirm the CI order check passes. In staging, deliberately make migration 003 fail and verify the existing app version remains running; then resolve the test data, redeploy, and confirm the intended commit and health checks.

**Evidence to close:** Passing CI order check, staging failure/recovery proof, deployed image/commit identity, and health results.

### 29. DevOps: wait until PostgreSQL is healthy before migrations

**What happens:** The deployment script previously started PostgreSQL in detached mode and immediately ran migrations. The database might not yet be ready to accept connections.

**Why it matters:** A valid deployment can fail during a slow database restart simply because the migration command ran too early.

**Required correction:** Start PostgreSQL with a health wait, apply migrations 002–004, and only then restart backend/frontend/Nginx. The correction branch now uses Compose's wait option and CI checks the order.

**How QA will verify:** Confirm CI passes the deployment-order check and, in staging, restart PostgreSQL from a cold state and verify migrations begin only after the database is healthy.

**Evidence to close:** CI result, staging logs showing database readiness before migrations, and successful application/database health checks.

### 30. Backend/database: prevent category deletion from changing budget meaning
**What happens:** The original budget-category foreign key uses `ON DELETE SET NULL`. If a category is deleted while a budget references it, that budget may become a whole-month budget; if a whole-month budget already exists for the same user/month, the uniqueness index may instead make deletion fail.

**Why it matters:** The saved budget can change meaning without the user editing it. Budget totals, alerts, and reports may then be misleading.

**Required correction:** PR #54 now checks for budgets that reference a category, returns HTTP 409 when any exist, changes the SQLAlchemy model to `ON DELETE RESTRICT`, and adds migration 004 to enforce the same rule in PostgreSQL. CI checks the foreign-key rule and the migration order. CI run `38212158351` passed all eight jobs for commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`, including the new API/constraint tests and migration order check. Fresh/existing AWS volume verification is still pending.

**How QA will verify:** Create a category-linked budget, try to delete the category, and confirm HTTP 409. Verify the budget remains and its category ID and amount do not change. Repeat when a whole-month budget also exists. Test migration 004 on a clean database and a populated AWS volume.

**Evidence to close:** Passing CI for the latest commit, database constraint reports `RESTRICT`, before/after API/database evidence, fresh/existing-volume migration logs, and AWS staging version/health evidence.

### 31. Backend: handle category create/update commit errors
**What happens:** Category create/update check for duplicate names before saving, but the database commit previously had no error handler. Two requests can race after the pre-check, and the database unique constraint can reject one request.

**Why it matters:** A duplicate-name race may return an unhandled 500 instead of HTTP 409. Unexpected database errors also need rollback before the session can recover.

**Required correction:** PR #54 now catches SQLAlchemy integrity errors, rolls back, and returns HTTP 409 only for the named category-name unique constraint. Other integrity failures and unexpected errors return a generic HTTP 500. Tests simulate the unique-constraint race for create and update and test recovery after an unexpected create failure.

**How QA will verify:** Confirm duplicate constraint failures return 409; an unexpected commit failure returns a sanitized 500; a failed update preserves the old category name; and a later valid request succeeds.

**Evidence to close:** Passing CI for the latest commit, API results for both conflict/error paths, and proof the failed update did not change stored data.

### 32. Backend: return a conflict for duplicate-email races
**What happens:** Registration and profile update check whether an email already exists before saving. Two requests can race after that check, and PostgreSQL can reject the second commit because email is unique.

**Why it matters:** A normal duplicate-email conflict may be reported as HTTP 500 instead of HTTP 409. A failed update must also preserve the existing email and roll back safely.

**Required correction:** PR #54 now catches SQLAlchemy integrity errors, rolls back, and returns HTTP 409 only for the named `users_email_key` constraint. Other integrity errors and unexpected failures remain generic HTTP 500 responses. Tests simulate the conflict on registration and profile update, plus an unexpected registration commit failure and recovery.

**How QA will verify:** Confirm the duplicate conflict returns 409, a failed profile update leaves the original email unchanged, unexpected failures return a sanitized 500, and a later valid registration succeeds.

**Evidence to close:** Passing CI for the latest commit, API results for conflict and recovery tests, and the exact tested commit SHA.

### 33. Backend: enforce one date format for expense create/update
**What happens:** Expense create/update previously accepted some ISO date formats other than the documented `YYYY-MM-DD`, while the date-range filters enforce the exact format.

**Why it matters:** The same API treats a date differently depending on whether it is used to save an expense or filter expenses. That makes integration and error handling inconsistent.

**Required correction:** PR #54 now checks that parsing the date and converting it back produces exactly the submitted string. The regression test checks that compact dates are rejected on create and update and that a failed update leaves the saved date unchanged.

**How QA will verify:** Confirm canonical `YYYY-MM-DD` dates succeed; compact/noncanonical formats return HTTP 400 for both create and update; and a rejected update does not alter the saved date.

**Evidence to close:** Passing current CI for the exact commit, API results for both invalid requests, and a read-back confirming the original date remains unchanged. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the new expense date regression test.

### 34. Backend: enforce the documented budget month format
**What happens:** Budget create/update previously accepted compact date strings such as `20261101`, although the API says the month must use `YYYY-MM-DD` and be the first day of the month.

**Why it matters:** The API accepts undocumented input, which makes client-side validation and integration inconsistent.

**Required correction:** PR #54 now checks both that the date is the first of the month and that converting it back to ISO format exactly matches the submitted value. Tests cover compact date rejection for create and update.

**How QA will verify:** A canonical value such as `2026-10-01` succeeds; compact/noncanonical values return HTTP 400; after a rejected update, the saved budget month remains unchanged.

**Evidence to close:** Passing current CI for the exact commit, API results for create/update, and read-back showing no change after the rejected update. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the budget month regression assertions.

### 35. Team lead + frontend/backend: decide whether overall monthly budgets are required
**What happens:** The API/database support a whole-month budget with no category, but the browser form requires a category and cannot submit it. The dashboard also matches expenses only when an expense category ID equals the budget category ID; when the budget category is null, normal expenses are not counted.

**Why it matters:** If the capstone expects an overall monthly spending limit, a user cannot create it through the interface, and an API-created overall budget would show zero spending. If the app is intentionally category-only, the extra API/database capability may be unnecessary and should be documented.

**Required decision:** Confirm whether overall monthly budgets are in scope. If yes, add an explicit “Overall monthly budget” option that sends `category_id: null`, count all same-month expenses for its spent amount, and show it distinctly in the budget list/dashboard. If no, record the category-only decision and align documentation/API scope.

**How QA will verify:** For overall-budget support, create both an overall and category budget for the same month, check persistence, duplicate rejection, editing, and dashboard totals; the overall budget must count all same-month expenses while a category budget counts only matching-category expenses. For category-only scope, verify the requirements and UI text clearly state the rule.

**Evidence to close:** A recorded team requirement decision plus browser/API results or updated scope documentation. This remains an observation until the requirement is confirmed.

### 36. Backend: validate month filters and summary query formats
**What happens:** Expense filtering and monthly/category summaries previously converted the year/month pieces to integers without enforcing the exact `YYYY-MM` format. Inputs such as `2026-1` or `2026-010` could be interpreted as valid months.

**Why it matters:** Invalid values may be silently interpreted instead of rejected, making filtering and reporting behavior inconsistent.

**Required correction:** PR #54 now validates the exact four-digit-year/two-digit-month pattern on the expense list and both summary endpoints. Tests cover valid totals and malformed month values.

**How QA will verify:** With known expense records, verify the valid month filter and both summary endpoints return expected data. Confirm `2026-1` and `2026-010` return HTTP 400 on all three endpoints.

**Evidence to close:** Passing current CI for the exact commit, responses for valid/invalid query values, and expected-vs-actual summary totals. CI run `38216409164` passed all eight jobs for commit `7c3eb3a08464ff9b97ce854f5a105383db8646cb`; Flake8 and all 48 backend tests passed, including the month-query/summary regression test.

### 37. Backend: reject category names that exceed 100 characters
**What happens:** The database limits category names to 100 characters, but the API previously did not enforce that limit before saving.

**Why it matters:** A client input error can reach the database and return HTTP 500 instead of a clear HTTP 400. A failed update must leave the current category name intact.

**Required correction:** PR #54 now validates the 100-character limit in category create/update and adds a regression test for oversized names.

**How QA will verify:** A valid name up to 100 characters is accepted if unique; 101-character names return HTTP 400 for create/update; a rejected update leaves the original name unchanged.

**Evidence to close:** Passing current CI for the exact commit, boundary-value API responses, and a read-back confirming the name did not change. Current CI is pending.

### 38. Frontend: remove API-response debug logging
**What happens:** The dashboard previously logged the full categories, expenses, and budgets API responses to the browser console.

**Why it matters:** The responses include financial details such as amounts, dates, descriptions, and budget limits. Printing them adds avoidable exposure during screen-sharing/support and creates noisy production output.

**Required correction:** PR #54 removes the three response-level `console.log` statements from `frontend/src/App.jsx`.

**How QA will verify:** Confirm the active frontend source no longer logs these response objects, frontend lint/build passes, and the dashboard still renders categories, expenses, and budgets in a browser.

**Evidence to close:** Passing current CI for the exact commit, source-search result, and browser smoke-test evidence. Current CI is pending.

### 39. Frontend: use local calendar dates consistently
**What happens:** The dashboard and transaction form previously used UTC date strings for the current month/default date. Reports parsed date-only values as UTC and then read local month fields.

**Why it matters:** Near midnight or month boundaries, the dashboard may request the wrong month, a new expense may default to the previous local date, or Reports may group an expense into the previous month in timezones west of UTC.

**Required correction:** PR #54 now builds the dashboard month from local year/month fields, uses a local-calendar date helper in Transactions, and parses report date-only values as local midnight.

**How QA will verify:** Record the browser timezone and local date; at a timezone boundary, verify the dashboard month, new-expense default date, and report grouping match the local/API date. Repeat in a timezone west of UTC.

**Evidence to close:** Passing frontend lint/build for the exact commit and browser results with timezone, local date, dashboard query, default form date, and report month recorded. Frontend automated tests are not currently configured.

### 40. Frontend: apply the saved currency preference consistently
**What happens:** The profile supports NGN, USD, EUR, and GBP, but several financial screens previously hardcoded the naira symbol. The dashboard chart tooltip also used the formatter's default currency instead of the saved preference.

**Why it matters:** A user can select USD, EUR, or GBP in Settings but still see ₦ in Budgets, Transactions, Reports, or dashboard widgets. This makes the displayed amounts inconsistent with the selected preference.

**Required correction:** PR #54 adds a shared currency-symbol helper, passes the saved user currency to financial pages, and uses the shared formatter for budget amounts, transaction amounts, report totals, dashboard widgets, chart tooltips, and budget search results.

**How QA will verify:** Save each supported currency and inspect Dashboard, Transactions, Budgets, Reports, dashboard chart tooltips, and budget search results. All amount labels must match the selected currency. Switching back to NGN must update the display without changing numeric values.

**Evidence to close:** Passing frontend lint/build for the exact commit and browser screenshots for each supported currency across the named screens. Automated frontend tests are not currently configured, so browser evidence is required.

### 41. Backend/frontend/DevOps: make the Settings phone field persist
**What happens:** Settings showed a Phone Number field, but the backend did not store or return the value. The save message could appear even though the phone number disappeared after reload.

**Why it matters:** A visible editable field must either save reliably or be clearly marked as unsupported. Silent data loss makes profile settings unreliable.

**Required correction:** PR #54 adds migration 005 for nullable `users.phone`, validates and returns the value in the profile API, sends it from the frontend, and checks migration 005 in CI and deployment ordering.

**How QA will verify:** Run CI, then test fresh and existing databases. Save a phone number and reload the profile; verify the exact value remains. Test blank input, non-string input, more than 30 characters, and control characters. Rejected updates must leave the previous value unchanged.

**Evidence to close:** Passing CI for the exact commit, schema/migration logs, API read-back, and AWS staging/browser evidence.

### 42. Product/backend: decide whether notification controls must send real alerts
**What happens:** Settings offers in-app push notifications and weekly summary email alerts, but the reviewed code stores the preference flags without a delivery service, scheduler, or browser-push implementation.

**Why it matters:** A saved checkbox can look like a working feature even when no notification is delivered.

**Required correction:** Confirm whether alerts are required. If yes, implement and test the delivery process, schedule/trigger rules, failures/retries, and per-user preferences. If not, label the controls clearly as inactive preferences or remove them until the feature is supported.

**How QA will verify:** For a real implementation, trigger test notifications with each preference on and off, verify correct recipient and delivery behavior, and test failures/retries and duplicate prevention. For out-of-scope alerts, verify the UI does not promise active delivery.

**Evidence to close:** Written scope decision, passing automated tests, and staging delivery evidence or approved UI wording.

### 43. Product/backend: define currency behavior before changing account currency
**What happens:** Expense and budget records store numeric amounts without a currency per record. The profile has one preferred currency, and the UI changes the displayed symbol without converting saved amounts.

**Why it matters:** A value recorded as 10,000 NGN could later display as $10,000 after the preference changes, even though no conversion occurred. This can mislead users and distort the meaning of historical reports.

**Required decision:** Confirm whether currency is a display label for a single-currency account or whether users can convert/mix currencies. For display-only behavior, warn clearly before changing currency and consider locking it after financial records exist. For conversion/mixed-currency support, define per-record currency, approved exchange-rate source/time policy, rounding, and a reviewed migration for existing records.

**How QA will verify:** Record an expense and budget under NGN, switch to USD, then inspect Transactions, Budgets, Dashboard, and Reports. Confirm behavior matches the written decision. If conversion exists, test known rates and rounding and confirm totals remain consistent.

**Evidence to close:** Written product decision, approved UI/data-model behavior, regression tests, and browser evidence across financial screens.

## Release checklist

Do not mark a check as passed until evidence is attached.

- [ ] Category permissions are implemented and tested for anonymous users, ordinary users, and the permitted role.
- [ ] Database-enforced budget uniqueness is implemented and tested, including NULL-category budgets and concurrent requests.
- [ ] Budget conflicts return HTTP 409; unexpected errors remain server errors and failed sessions are rolled back.
- [ ] Budget spending is read-only and matches recorded expenses after reload.
- [ ] Production database and JWT secrets are required and are not sample values.
- [ ] Tests use an isolated database and pass repeatedly.
- [ ] CI is green for the exact release commit, backend tests are collected, and frontend tests execute rather than being silently skipped.
- [ ] Migrations 002–005 succeed on fresh and existing databases; migration 004 enforces `ON DELETE RESTRICT` for category-linked budgets, and migration 005 creates `users.phone`.
- [ ] Deployment applies migrations before restarting backend/frontend/Nginx.
- [ ] AWS is the documented and approved deployment target, and the deployed AWS VM is evidenced.
- [ ] The running image matches the tested commit.
- [ ] The AWS VM can pull the published images using the intended permissions.
- [ ] Both health endpoints work through Nginx.
- [ ] Production rate limits use the approved shared storage configuration and are verified per client through the Nginx proxy.
- [ ] Registration, current-user profile display, expense search navigation, expense ownership, filters, CSV export, budget creation/editing (including historical month preservation and read-only calculated spending), and dashboard totals pass browser testing.
- [ ] Public HTTPS security headers are checked and the approved CSP is tested.
- [ ] Screenshots, workflow run links, commit SHA, and test results are attached.

**Current overall status:** CI run `38219803561` passed all eight jobs for correction commit `92eefc22555c7c98df240014721084e2f41698f8`. The backend suite ran twice and both runs passed all 58 tests. The database job applied migrations 001–005 and verified the budget-category restriction and `users.phone` column; frontend lint/build, secret scan, both Docker builds, and the aggregate check passed. Subsequent changes to the QA documentation branch have a separate CI run in progress. This is CI evidence only. AWS populated-volume migration, live deployment/health, browser end-to-end flows, and notification delivery remain unverified. The frontend package still has no test script, so frontend functional tests can be skipped by the optional CI command.

**Latest date-validation addition:** Action 40 expands verification for existing finding QA-FIND-059. CI run `38219803561` passed with the compact/week-date create checks and rejected-update preservation check included. Deployed AWS API/browser verification remains pending.


**Latest profile correction:** Action 41 and QA-FIND-067 track phone persistence through migration 005. CI run `38219803561` passed all eight jobs for branch-head commit `92eefc22555c7c98df240014721084e2f41698f8`, including 58 backend tests on two consecutive runs and migration 005 schema/order checks. The populated AWS database migration and browser save/reload check remain open.


**Notification status:** QA-FIND-068 is open pending a product decision. Stored preference flags are not proof of actual alert delivery.


**Latest CI note:** Run `38219803561` passed all eight jobs for the branch-head commit `92eefc22555c7c98df240014721084e2f41698f8`. The backend suite passed 58 tests twice; migrations 001–005, the `users.phone` column, and deployment order were checked. Existing-volume AWS migration, live deployment/health, browser flows, and notification delivery are still pending.


**Currency behavior:** QA-FIND-069 remains open for a product decision. Changing the symbol is not the same as converting historical amounts.
