# Expense Tracker — QA Team Action Summary

**Project name:** Expense Tracker  
**Project explanation:** A web application for recording expenses, managing budgets, viewing reports, and exporting transaction data.  
**Enhanced version:** QA findings, corrections, and deployment checks for the Expense Tracker capstone.

## Why this document exists

This document tells the team what is wrong, why it matters, and who needs to act. Read the short action first. The detailed QA findings contain the supporting evidence and test steps.

**Status rule:** “Found” means the code has a problem. “Correction proposed” means code has been changed but still needs review and tests. “CI passed” means automated checks passed for the named commit. “Runtime pending” means the app still needs to be run and checked. These statuses must not be treated as the same thing.

**Current audit size:** 87 numbered findings/observations, 59 distinct team actions, and 48 runtime verification gates. CI run `38418979526` passed all eight jobs for correction commit `ae54eec01018a728f97bd7c77f7ccbcad3a96a05`, which also includes the professional README and AWS architecture updates: 71 backend tests passed twice, nine frontend tests passed, npm audit reported zero vulnerabilities, migrations 001–006 and runtime-role checks passed, secret scanning and both Docker builds passed. Flask-Limiter still warns about in-memory storage. AWS live/runtime evidence remains separate from CI evidence.

## Actions for the team

### 1. Backend: complete category-write authorization
**What happens:** Upstream `main` still allows category mutations without authentication. PR #54 adds JWT authentication to category POST/PUT/DELETE and tests anonymous requests, but all categories remain shared and there is no administrator/owner policy.

**Why it matters:** Requiring login blocks anonymous changes, but any signed-in user can still affect categories seen by other accounts.

**Backend owner:** First verify the PR #54 guard and anonymous 401 tests. Then decide whether categories are admin-managed shared records or per-user records, and implement the matching role/ownership checks. Do not treat login alone as full authorization.

**QA check:** Anonymous writes must return 401. Authenticated non-admin users must not be able to make changes outside the chosen policy; authorized users must still be able to manage categories. Verify referenced-category deletion remains protected.

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

**Correction status:** The correction branch guards the database name and clears rows from budgets, expenses, categories, and users before each test. CI run 38418489243 passed all eight jobs and both 71-test backend runs. The repeatability/cleanup portion is verified in CI; local/staging tests must still use a disposable test database.

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

**Required correction:** Confirm the protected AWS secrets/variables, deploy the exact tested commit-specific image, and capture the running digest and public health checks. Update the GitHub repository About/description metadata so it also names AWS EC2. Do not claim deployment success just because workflow code exists.

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

### 11. DevOps: authenticate the AWS VM to GHCR
**What happens:** CI publishes images to GitHub Container Registry (GHCR), but the runner's login does not authenticate the AWS host.

**Why it matters:** A successful build can still be followed by a failed deployment if the packages are private and the VM has no registry credentials.

**Required correction:** PR #54 now forwards `GHCR_READ_USERNAME` and `GHCR_READ_TOKEN` to the remote deployment step, logs in with `--password-stdin`, pulls commit-tagged images, and logs out on exit. CI checks that this login remains in the workflow. Add the two secrets to the repository settings using a least-privilege read-only package token.

**Required correction:** Decide whether packages are public or private. If private, configure least-privilege read access on the EC2 VM and authenticate without exposing tokens.

**QA verification and closure evidence:** Pull both images from the target VM, deploy the intended commit-specific tag or pinned digest, and retain logs with secrets redacted plus the deployed image digest.

### 12. Backend/security: shared rate-limit storage (consolidated)

The missing shared production store remains open and is tracked in action 47 alongside the proxy-identity and AWS runtime checks. Configure the approved shared store, protect its credentials, and document outage behavior. This is not a separate completed task.

### 13. Backend/database: verify budget-save conflict handling
**What happens:** The original budget route mapped every commit error to HTTP 500.

**Correction status:** PR #54 now rolls back failed commits, maps only known budget uniqueness violations to HTTP 409, and returns a generic 500 for unexpected errors. CI run 38219803561 passed the budget conflict and session-recovery tests.

**Why it matters:** Duplicate budgets are expected conflicts; unexpected failures must remain server errors and must not poison the next request.

**QA verification and closure evidence:** Recheck duplicate and concurrent budget requests against AWS, then submit a valid budget after a conflict. Retain response codes, row counts, and sanitized-error evidence.

### 14. Frontend/backend: normalize the signed-in user profile

**What happens:** The API returns the current profile inside a response object, but upstream main stores the whole response as the user profile. The UI then looks for name fields on the wrong object.

**Why it matters:** The account name or initials may be missing, and components that expect a direct profile object may behave incorrectly. The correction branch extracts and normalizes the profile, but it still needs browser retesting.

**Required correction:** Keep the normalized response handling in the release branch and maintain one clear API-to-frontend profile shape.

**How QA will verify:** Log in, refresh the page, and confirm the session stays valid and the expected account name/initials display correctly.

**Evidence to close:** Tested commit SHA, redacted API response, browser screenshot, and a passing regression test where available.

### 15. Frontend: verify expense search navigation

**What happens:** Upstream main uses a misspelled tab identifier for expense search results, while the page uses the correctly spelled Transactions identifier. The correction branch fixes the identifier.

**Why it matters:** Selecting a search result may set a tab that does not exist, leaving the user unable to open the intended transaction view from search.

**Required correction:** Keep the corrected identifier and add a regression check for selecting an expense result.

**How QA will verify:** Search for a known expense, select its result, and confirm the Transactions page opens and shows the intended record.

**Evidence to close:** Tested commit SHA, browser screenshot/video, and a passing regression check where available.

### 16. Frontend/backend: preserve the month when editing an older budget

**What happens:** The upstream frontend sends the current month when saving any budget, including an edit to an older budget. The backend accepts that month and updates the existing record.

**Why it matters:** Editing a historical budget can move it into the current month, making historical budget reports inaccurate and causing confusing duplicate-budget conflicts.

**Required correction:** When editing, send the budget's existing month. Use the current month only when creating a new budget. The correction branch now preserves the existing month; retesting is still required.

**How QA will verify:** Edit the amount on a budget from a past month, save, reload, and confirm the month has not changed. Then create a new budget and confirm it defaults to the current month.

**Evidence to close:** Tested commit SHA, browser/API result, and before-and-after month values.

### 17. Frontend: make calculated spending clear in the budget form

**What happens:** The budget form allows the user to edit “Amount Already Spent,” but the save request does not send that value. Spending is calculated from recorded expenses, so the input suggests a change can be saved when it cannot.

**Why it matters:** Users may think they changed spending figures when the application ignores the entry.

**Required correction:** Keep the spending field read-only and explain that it is calculated from recorded expenses. The correction branch now does this; browser retesting is still required.

**How QA will verify:** Open create/edit budget forms, confirm the field cannot be edited, save a budget, and compare the displayed spent amount with the actual expense records after reload.

**Evidence to close:** Tested commit SHA, browser screenshot, and comparison with API/expense data.

### 18. Frontend: add automated UI tests

**What happens:** The frontend package has no test script, while CI uses npm test with if-present behavior. Therefore, CI can pass without executing frontend tests.

**Why it matters:** A green build does not prove that login state, navigation, budget editing, or key screens work when users interact with them.

**Required correction:** Add a frontend test runner and tests for profile refresh, expense search, budget create/edit, and validation. Add browser end-to-end tests for the main user journeys.

**How QA will verify:** Check CI logs for a test command that actually runs and reports a non-zero test count.

**Evidence to close:** Test files, package script, CI run showing tests executed, and results for key flows.

### 19. DevOps/documentation: make the port and startup instructions consistent

**What happens:** The Compose file maps Nginx to host port 80, but the Docker guide previously described port 8080. Setup instructions also did not clearly require the root environment file used for Compose database values.

**Why it matters:** A developer following the wrong URL may think the application is down or collect evidence from the wrong endpoint.

**Required correction:** Keep Compose, README, Docker guide, and examples consistent. Copy the example environment file to the root environment file, configure both root and backend environment files, and follow the URL stated in the docs.

**How QA will verify:** Start from a clean checkout and follow only the documented instructions. Confirm the stated URL and health endpoints respond.

**Evidence to close:** Documentation diff, sanitized Compose config, and clean-start test results.

### 20. DevOps/security: review browser security headers

**What happens:** Nginx sets several security headers, but the reviewed configuration does not include Content-Security-Policy or HSTS.

**Why it matters:** CSP can limit the impact of unexpected script/resource execution. HSTS helps enforce HTTPS, but it should only be set after HTTPS is confirmed at the public endpoint.

**Required correction:** Define and test a CSP compatible with the React app. Configure HSTS at the HTTPS termination layer only after confirming HTTPS behavior and scope.

**How QA will verify:** Inspect response headers on the public HTTPS endpoint and run login, navigation, and API browser tests with CSP enabled.

**Evidence to close:** Header capture, reviewed CSP configuration, and browser results. Do not claim HSTS is enabled unless it is observed on HTTPS responses.

### 21. Backend/DevOps: make authentication rate limits proxy-aware (consolidated)

PR #54 now configures ProxyFix for one trusted Nginx hop and includes a unit test for forwarded client identity. The AWS topology check and shared-store requirement remain open under action 47. Do not close this action until the public AWS test proves independent client quotas and safe forwarding-header handling.

### 22. Frontend: make the budget spending value read-only

**What happens:** The budget form previously displayed an editable spending value, but the save request did not send or store it. Actual spending is calculated from recorded expenses.

**Why it matters:** The form suggests users can set a value that the system ignores, which can confuse users and make the budget display seem inconsistent.

**Required correction:** Keep the spending value read-only and explain that it is calculated from recorded expenses. The correction branch already contains this source change; browser retesting is still pending.

**How QA will verify:** Open create and edit budget forms, confirm the spending value cannot be changed, save a budget, reload, and compare the displayed spending with recorded expense data.

**Evidence to close:** CI result for the fixing commit, browser screenshot, and comparison against expense/API records.

### 23. Backend: return the right error when category deletion fails

**What happens:** The category-delete route previously returned HTTP 409 for every database exception, even when the database itself failed. HTTP 409 should be used when an expense actually references the category.

**Why it matters:** Users and monitoring may be told to change their data when the real problem is a server/database failure.

**Required correction:** Check whether any expense references the category before deleting it. Return HTTP 409 for that known conflict, and return a generic HTTP 500 for unexpected database failures. Roll back the session and do not expose internal database details. The correction branch now checks for references and lets the database enforce the RESTRICT constraint if a race occurs.

**How QA will verify:** Delete a category that is used by an expense and confirm 409. Then simulate a database failure during deletion and confirm 500, no sensitive error details, the category still exists, and a later valid delete succeeds.

**Evidence to close:** Passing CI, API results for both cases, session recovery result, and tested commit SHA.

### 24. DevOps: keep local secrets out of Docker images

**What happens:** The backend and frontend Dockerfiles copy source directories into their build stages. Without .dockerignore files, a local environment file can enter the build context even when Git ignores it.

**Why it matters:** Local secrets may be copied into an image layer or a published image. Host node_modules can also make frontend builds larger and less reproducible.

**Required correction:** The correction branch adds backend/.dockerignore and frontend/.dockerignore to exclude environment files. The frontend ignore file also excludes node_modules, generated output, and logs. CI checks that the ignore files and required rules exist.

**How QA will verify:** CI now builds with harmless sentinel environment files present, loads the images, and checks that the backend image has no /app/.env and the frontend bundle has no sentinel variable. Confirm the new CI run passes.

**Evidence to close:** Ignore-file diff, CI run, successful image builds, and sentinel-based verification where available.

### 25. DevOps: apply database migrations before restarting the app

**What happens:** The deployment workflow previously restarted all services before applying the database migrations.

**Why it matters:** If a migration fails, the new app version may already be running against the old schema, leaving the release partly deployed.

**Required correction:** Start the database, apply migrations 002 and 003, and only restart backend/frontend/Nginx after both migrations succeed. The correction branch now uses this order, applies migrations 002–004, and adds a CI check for the command sequence.

**How QA will verify:** Confirm the CI order check passes. In staging, deliberately make migration 003 fail and verify the existing app version remains running; then resolve the test data, redeploy, and confirm the intended commit and health checks.

**Evidence to close:** Passing CI order check, staging failure/recovery proof, deployed image/commit identity, and health results.

### 26. DevOps: wait until PostgreSQL is healthy before migrations

**What happens:** The deployment script previously started PostgreSQL in detached mode and immediately ran migrations. The database might not yet be ready to accept connections.

**Why it matters:** A valid deployment can fail during a slow database restart simply because the migration command ran too early.

**Required correction:** Start PostgreSQL with a health wait, apply migrations 002–004, and only then restart backend/frontend/Nginx. The correction branch now uses Compose's wait option and CI checks the order.

**How QA will verify:** Confirm CI passes the deployment-order check and, in staging, restart PostgreSQL from a cold state and verify migrations begin only after the database is healthy.

**Evidence to close:** CI result, staging logs showing database readiness before migrations, and successful application/database health checks.

### 27. Backend/database: prevent category deletion from changing budget meaning
**What happens:** The original budget-category foreign key uses `ON DELETE SET NULL`. If a category is deleted while a budget references it, that budget may become a whole-month budget; if a whole-month budget already exists for the same user/month, the uniqueness index may instead make deletion fail.

**Why it matters:** The saved budget can change meaning without the user editing it. Budget totals, alerts, and reports may then be misleading.

**Required correction:** PR #54 now checks for budgets that reference a category, returns HTTP 409 when any exist, changes the SQLAlchemy model to `ON DELETE RESTRICT`, and adds migration 004 to enforce the same rule in PostgreSQL. CI checks the foreign-key rule and the migration order. CI run `38212158351` passed all eight jobs for commit `927e35eaf3af827d8b52ef93f6f883c6bfcaa667`, including the new API/constraint tests and migration order check. Fresh/existing AWS volume verification is still pending.

**How QA will verify:** Create a category-linked budget, try to delete the category, and confirm HTTP 409. Verify the budget remains and its category ID and amount do not change. Repeat when a whole-month budget also exists. Test migration 004 on a clean database and a populated AWS volume.

**Evidence to close:** Passing CI for the latest commit, database constraint reports `RESTRICT`, before/after API/database evidence, fresh/existing-volume migration logs, and AWS staging version/health evidence.

### 28. Backend: handle category create/update commit errors
**What happens:** Category create/update check for duplicate names before saving, but the database commit previously had no error handler. Two requests can race after the pre-check, and the database unique constraint can reject one request.

**Why it matters:** A duplicate-name race may return an unhandled 500 instead of HTTP 409. Unexpected database errors also need rollback before the session can recover.

**Required correction:** PR #54 now catches SQLAlchemy integrity errors, rolls back, and returns HTTP 409 only for the named category-name unique constraint. Other integrity failures and unexpected errors return a generic HTTP 500. Tests simulate the unique-constraint race for create and update and test recovery after an unexpected create failure.

**How QA will verify:** Confirm duplicate constraint failures return 409; an unexpected commit failure returns a sanitized 500; a failed update preserves the old category name; and a later valid request succeeds.

**Evidence to close:** Passing CI for the latest commit, API results for both conflict/error paths, and proof the failed update did not change stored data.

### 29. Backend: return a conflict for duplicate-email races
**What happens:** Registration and profile update check whether an email already exists before saving. Two requests can race after that check, and PostgreSQL can reject the second commit because email is unique.

**Why it matters:** A normal duplicate-email conflict may be reported as HTTP 500 instead of HTTP 409. A failed update must also preserve the existing email and roll back safely.

**Required correction:** PR #54 now catches SQLAlchemy integrity errors, rolls back, and returns HTTP 409 only for the named `users_email_key` constraint. Other integrity errors and unexpected failures remain generic HTTP 500 responses. Tests simulate the conflict on registration and profile update, plus an unexpected registration commit failure and recovery.

**How QA will verify:** Confirm the duplicate conflict returns 409, a failed profile update leaves the original email unchanged, unexpected failures return a sanitized 500, and a later valid registration succeeds.

**Evidence to close:** Passing CI for the latest commit, API results for conflict and recovery tests, and the exact tested commit SHA.

### 30. Backend: enforce one date format for expense create/update
**What happens:** Expense create/update previously accepted some ISO date formats other than the documented `YYYY-MM-DD`, while the date-range filters enforce the exact format.

**Why it matters:** The same API treats a date differently depending on whether it is used to save an expense or filter expenses. That makes integration and error handling inconsistent.

**Required correction:** PR #54 now checks that parsing the date and converting it back produces exactly the submitted string. The regression test checks that compact dates are rejected on create and update and that a failed update leaves the saved date unchanged.

**How QA will verify:** Confirm canonical `YYYY-MM-DD` dates succeed; compact/noncanonical formats return HTTP 400 for both create and update; and a rejected update does not alter the saved date.

**Evidence to close:** Passing current CI for the exact commit, API results for both invalid requests, and a read-back confirming the original date remains unchanged. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the new expense date regression test.

### 31. Backend: enforce the documented budget month format
**What happens:** Budget create/update previously accepted compact date strings such as `20261101`, although the API says the month must use `YYYY-MM-DD` and be the first day of the month.

**Why it matters:** The API accepts undocumented input, which makes client-side validation and integration inconsistent.

**Required correction:** PR #54 now checks both that the date is the first of the month and that converting it back to ISO format exactly matches the submitted value. Tests cover compact date rejection for create and update.

**How QA will verify:** A canonical value such as `2026-10-01` succeeds; compact/noncanonical values return HTTP 400; after a rejected update, the saved budget month remains unchanged.

**Evidence to close:** Passing current CI for the exact commit, API results for create/update, and read-back showing no change after the rejected update. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including the budget month regression assertions.

### 32. Team lead + frontend/backend: decide whether overall monthly budgets are required

**What happens:** The API/database support budgets with no category, but the browser form still requires a category and cannot create an overall monthly budget. The dashboard spending calculation has now been corrected in PR #54 to count all expenses in the same month for a whole-month budget; CI run `38272803374` passed the four new frontend tests.

**Why it matters:** If the capstone expects an overall monthly spending limit, users still cannot configure it through the interface. If the intended feature is category-only, the unused API/database support needs a documented scope decision.

**Required decision:** Confirm whether overall monthly budgets are in scope. If yes, add an explicit “Overall monthly budget” option that sends `category_id: null` and displays the budget distinctly. If no, record the category-only decision and align the UI and API documentation.

**How QA will verify:** If supported, create an overall and a category budget for the same month, check persistence, duplicate rejection, editing, and totals. The overall budget must count all same-month expenses; a category budget must count only its category. If category-only is intended, verify the written scope decision and UI wording.

**Evidence required:** Written product decision, passing browser/API tests or updated scope documentation, and a screenshot or recorded run showing the final behavior. CI does not prove the UI can create an overall budget.


### 33. Backend: validate month filters and summary query formats
**What happens:** Expense filtering and monthly/category summaries previously converted the year/month pieces to integers without enforcing the exact `YYYY-MM` format. Inputs such as `2026-1` or `2026-010` could be interpreted as valid months.

**Why it matters:** Invalid values may be silently interpreted instead of rejected, making filtering and reporting behavior inconsistent.

**Required correction:** PR #54 now validates the exact four-digit-year/two-digit-month pattern on the expense list and both summary endpoints. Tests cover valid totals and malformed month values.

**How QA will verify:** With known expense records, verify the valid month filter and both summary endpoints return expected data. Confirm `2026-1` and `2026-010` return HTTP 400 on all three endpoints.

**Evidence to close:** Passing current CI for the exact commit, responses for valid/invalid query values, and expected-vs-actual summary totals. CI run `38216409164` passed all eight jobs for commit `7c3eb3a08464ff9b97ce854f5a105383db8646cb`; Flake8 and all 48 backend tests passed, including the month-query/summary regression test.

### 34. Backend: reject category names that exceed 100 characters
**What happens:** The database limits category names to 100 characters, but the API previously did not enforce that limit before saving.

**Why it matters:** A client input error can reach the database and return HTTP 500 instead of a clear HTTP 400. A failed update must leave the current category name intact.

**Required correction:** PR #54 now validates the 100-character limit in category create/update and adds a regression test for oversized names.

**How QA will verify:** A valid name up to 100 characters is accepted if unique; 101-character names return HTTP 400 for create/update; a rejected update leaves the original name unchanged.

**Evidence to close:** Passing current CI for the exact commit, boundary-value API responses, and a read-back confirming the name did not change. Current CI is pending.

### 35. Frontend: remove API-response debug logging
**What happens:** The dashboard previously logged the full categories, expenses, and budgets API responses to the browser console.

**Why it matters:** The responses include financial details such as amounts, dates, descriptions, and budget limits. Printing them adds avoidable exposure during screen-sharing/support and creates noisy production output.

**Required correction:** PR #54 removes the three response-level `console.log` statements from `frontend/src/App.jsx`.

**How QA will verify:** Confirm the active frontend source no longer logs these response objects, frontend lint/build passes, and the dashboard still renders categories, expenses, and budgets in a browser.

**Evidence to close:** Passing current CI for the exact commit, source-search result, and browser smoke-test evidence. Current CI is pending.

### 36. Frontend: use local calendar dates consistently
**What happens:** The dashboard and transaction form previously used UTC date strings for the current month/default date. Reports parsed date-only values as UTC and then read local month fields.

**Why it matters:** Near midnight or month boundaries, the dashboard may request the wrong month, a new expense may default to the previous local date, or Reports may group an expense into the previous month in timezones west of UTC.

**Required correction:** PR #54 now builds the dashboard month from local year/month fields, uses a local-calendar date helper in Transactions, and parses report date-only values as local midnight.

**How QA will verify:** Record the browser timezone and local date; at a timezone boundary, verify the dashboard month, new-expense default date, and report grouping match the local/API date. Repeat in a timezone west of UTC.

**Evidence to close:** Passing frontend lint/build for the exact commit and browser results with timezone, local date, dashboard query, default form date, and report month recorded. Frontend automated tests are not currently configured.

### 37. Frontend: apply the saved currency preference consistently
**What happens:** The profile supports NGN, USD, EUR, and GBP, but several financial screens previously hardcoded the naira symbol. The dashboard chart tooltip also used the formatter's default currency instead of the saved preference.

**Why it matters:** A user can select USD, EUR, or GBP in Settings but still see ₦ in Budgets, Transactions, Reports, or dashboard widgets. This makes the displayed amounts inconsistent with the selected preference.

**Required correction:** PR #54 adds a shared currency-symbol helper, passes the saved user currency to financial pages, and uses the shared formatter for budget amounts, transaction amounts, report totals, dashboard widgets, chart tooltips, and budget search results.

**How QA will verify:** Save each supported currency and inspect Dashboard, Transactions, Budgets, Reports, dashboard chart tooltips, and budget search results. All amount labels must match the selected currency. Switching back to NGN must update the display without changing numeric values.

**Evidence to close:** Passing frontend lint/build for the exact commit and browser screenshots for each supported currency across the named screens. Automated frontend tests are not currently configured, so browser evidence is required.

### 38. Backend/frontend/DevOps: make the Settings phone field persist
**What happens:** Settings showed a Phone Number field, but the backend did not store or return the value. The save message could appear even though the phone number disappeared after reload.

**Why it matters:** A visible editable field must either save reliably or be clearly marked as unsupported. Silent data loss makes profile settings unreliable.

**Required correction:** PR #54 adds migration 005 for nullable `users.phone`, validates and returns the value in the profile API, sends it from the frontend, and checks migration 005 in CI and deployment ordering.

**How QA will verify:** Run CI, then test fresh and existing databases. Save a phone number and reload the profile; verify the exact value remains. Test blank input, non-string input, more than 30 characters, and control characters. Rejected updates must leave the previous value unchanged.

**Evidence to close:** Passing CI for the exact commit, schema/migration logs, API read-back, and AWS staging/browser evidence.

### 39. Product/backend: decide whether notification controls must send real alerts
**What happens:** Settings offers in-app push notifications and weekly summary email alerts, but the reviewed code stores the preference flags without a delivery service, scheduler, or browser-push implementation.

**Why it matters:** A saved checkbox can look like a working feature even when no notification is delivered.

**Required correction:** Confirm whether alerts are required. If yes, implement and test the delivery process, schedule/trigger rules, failures/retries, and per-user preferences. If not, label the controls clearly as inactive preferences or remove them until the feature is supported.

**How QA will verify:** For a real implementation, trigger test notifications with each preference on and off, verify correct recipient and delivery behavior, and test failures/retries and duplicate prevention. For out-of-scope alerts, verify the UI does not promise active delivery.

**Evidence to close:** Written scope decision, passing automated tests, and staging delivery evidence or approved UI wording.

### 40. Product/backend: define currency behavior before changing account currency
**What happens:** Expense and budget records store numeric amounts without a currency per record. The profile has one preferred currency, and the UI changes the displayed symbol without converting saved amounts.

**Why it matters:** A value recorded as 10,000 NGN could later display as $10,000 after the preference changes, even though no conversion occurred. This can mislead users and distort the meaning of historical reports.

**Required decision:** Confirm whether currency is a display label for a single-currency account or whether users can convert/mix currencies. For display-only behavior, warn clearly before changing currency and consider locking it after financial records exist. For conversion/mixed-currency support, define per-record currency, approved exchange-rate source/time policy, rounding, and a reviewed migration for existing records.

**How QA will verify:** Record an expense and budget under NGN, switch to USD, then inspect Transactions, Budgets, Dashboard, and Reports. Confirm behavior matches the written decision. If conversion exists, test known rates and rounding and confirm totals remain consistent.

**Evidence to close:** Written product decision, approved UI/data-model behavior, regression tests, and browser evidence across financial screens.

### 41. Product/backend: connect the budget alert threshold to real behavior
**What happens:** Settings saves a “Budget Alert Threshold (%)”, but the budget and dashboard components do not use that value. The visible budget status changes at 100% of the limit, not at the user's selected threshold.

**Why it matters:** A user who chooses 80% may expect an early warning, but the setting currently has no effect.

**Required decision/correction:** Confirm whether the threshold should trigger an alert. If yes, implement a defined threshold rule, prevent duplicate alerts for the same budget/period, honor notification preferences, and decide how alerts behave if spending later falls below and crosses the threshold again. If not, remove or relabel the setting so it does not imply active alerts.

**How QA will verify:** Set thresholds such as 50%, 80%, and 100%; create expenses just below, at, and above each threshold; verify the agreed warning behavior and no repeated alerts. Check separate users and budgets.

**Evidence to close:** Written threshold rules, passing boundary/duplicate-prevention tests, and browser evidence or approved revised settings wording.

### 42. DevOps: make the AWS stack recover after a VM reboot
**What happens:** The original Compose services had no restart policies. PR #54 now adds `restart: unless-stopped` to PostgreSQL, backend, frontend, and Nginx, and CI checks for all four. AWS reboot recovery still needs a staging test.

**Why it matters:** A normal VM reboot or Docker daemon restart may leave the application offline until someone manually starts it.

**Required correction:** Review the new restart policies and verify the AWS host starts Docker on boot. If a staging reboot shows ordering failures, add a systemd unit to start Compose and wait for database/application health. Preserve the rule that migrations must finish before the new app starts.

**How QA will verify:** In AWS staging, reboot the VM or restart Docker. Confirm the stack returns without manual SSH commands, the database data persists, both public health endpoints recover, and the running image still matches the intended commit.

**Evidence to close:** Compose/systemd configuration, reboot and recovery logs, container/image version evidence, health checks, and a test-record persistence check.

### 43. DevOps: prove database backups can be restored
**What happens:** The application stores PostgreSQL data in a Compose volume on the AWS VM. The repository does not show a scheduled off-host backup, retention policy, or tested restore process. An AWS snapshot or backup may exist outside the repository, but it has not been evidenced here.

**Why it matters:** VM/volume loss or a bad migration could permanently lose expense and budget records if there is no usable recovery copy.

**Required correction:** Document the actual backup method. Use an approved encrypted off-host backup or managed snapshot, define schedule/retention/access controls, and take a recoverable backup before production migrations. Do not keep the only backup on the same VM/volume or commit dumps to Git.

**How QA will verify:** Restore a recent backup into an isolated database. Compare known user/expense/budget counts and representative totals. Record recovery point and recovery time; confirm logs do not expose credentials.

**Evidence to close:** Backup schedule/configuration, retention/access policy, redacted successful restore log, data-integrity checks, and pre-migration backup recovery evidence.

### 44. Backend/DevOps: make rate limits correct for real clients
**What happens:** PR #54 now configures Flask `ProxyFix` for exactly one trusted Nginx hop and adds a unit test for forwarded client identity. The deployment topology still needs runtime confirmation. The limiter still uses in-memory storage, which resets on restart and is not shared between backend instances.

**Why it matters:** One user's login attempts can block other users, while restarts or multiple instances can weaken abuse protection.

**Required correction:** Review the new one-hop `ProxyFix` configuration against the actual AWS topology, prevent direct/untrusted access from spoofing forwarded headers, and configure approved shared rate-limit storage for AWS through environment settings. Keep local development configuration separate.

**How QA will verify:** Through AWS/Nginx, test two distinct clients, verify independent counters and the expected 429 limit, try spoofed forwarded headers, restart the backend, and verify the counter behavior. If more than one backend instance is used, verify counters are shared.

**Evidence to close:** Reviewed configuration, CI tests for client identity and spoofed headers, shared-store configuration, and AWS staging logs showing independent limits, restart behavior, and expected 429 responses.

### 45. Backend/product/security: protect account email changes
**What happens:** The authenticated profile endpoint saves a new login email immediately after basic validation and uniqueness checking. It does not require the current password/recent re-authentication or verify control of the new address.

**Why it matters:** A typo can change the account's login identity, and a stolen valid session could change the email before the account owner notices.

**Required correction:** Agree on the identity-change policy. Prefer current-password/recent re-authentication, an expiring one-time verification link, keeping the old email active until verification, notification to the old address, rate limiting, and a clear session/token policy. If email delivery is outside scope, document that decision and do not treat an unverified address as a verified identity.

**How QA will verify:** Test change attempts without re-authentication, pending/unverified address, expired/reused verification tokens, duplicate addresses, valid verification, and rate limits. Confirm the old email remains active until successful verification.

**Evidence to close:** Written policy, automated API tests, verification/expiry/duplicate tests, and a staging browser/API trace of a successful and rejected change.

### 46. Backend + product/security: define and enforce password requirements
**What happens:** Registration only checks that the password is a non-empty string. No minimum or maximum password length is enforced in the route.

**Why it matters:** Very short passwords can be registered, leaving accounts easier to guess.

**Required correction:** Agree a documented length-based policy, enforce it on the backend, show matching frontend guidance, and add boundary tests. Avoid relying only on arbitrary character-class rules.

**How to verify:** Test below/at/above the agreed minimum, empty and non-string values, and values above the maximum. Confirm rejected requests do not create users and valid users can log in.

**Evidence required:** Approved policy, passing tests for the exact commit, browser validation, and proof rejected registrations create no account.

### 47. Team lead + backend/security: decide on password change and recovery
**What happens:** No password-change or password-reset route/flow was found in the reviewed authentication API.

**Why it matters:** Users cannot self-serve if they forget a password or suspect it was exposed.

**Required correction:** Decide whether this is in scope. If required, implement current-password verification for authenticated changes and a single-use, expiring reset-token flow delivered through an approved channel. Rate-limit requests, avoid account-existence disclosure, and define active-token invalidation. If out of scope, document that limitation clearly.

**How to verify:** Test wrong/current password, successful rotation, old-password rejection, reset-token expiry and reuse, account-enumeration resistance, and rate limits.

**Evidence required:** Written scope decision, passing security tests, and redacted browser/API evidence of the agreed flow.


### 48. Backend: preserve the omitted name field during partial profile updates
**What happens:** If a profile request changes only one name field, the previous API logic could erase the other part of the user's name or reject the update.

**Why it matters:** A valid profile edit could unintentionally remove stored user information.

**Required correction:** PR #54 now keeps the existing first or last name when that field is not included in the request. A regression test covers changing first name alone and last name alone.

**How to verify:** Update only the first name and check the last name remains. Then update only the last name and check the first name remains. Confirm an explicitly empty first name is rejected and the profile still contains the last saved values.

**Evidence required:** Passing CI for the exact commit, API results for both partial-update cases, and a read-back of the final profile. Do not close this based on source changes alone.


### CI update — profile-name correction
Run `38270979144` stopped at Flake8 because one line in the new partial-name preservation code was one character too long. The line was wrapped in commit `2316a358ca37495ecc41eff8aaf48f888654e5b8`. CI run `38271222415` has now passed all eight jobs for that commit; the backend suite passed 60 tests, including the new profile-name regression. AWS/browser verification remains a separate requirement.


### 49. Backend: return a conflict when a budget blocks category deletion
**What happens:** A budget can be linked to a category after the API checks for references but before the database delete commits. PostgreSQL correctly blocks deletion, but the old handler did not recognize the budget foreign-key constraint and returned HTTP 500.

**Why it matters:** A valid data conflict is reported as a server failure. The database keeps the data safe, but the API response is misleading.

**Required correction:** PR #54 now maps both expense and budget foreign-key conflicts to HTTP 409 and keeps unexpected database failures at HTTP 500. A regression test simulates the budget-reference race.

**How to verify:** Run the category delete regression test. Confirm a budget foreign-key conflict returns 409 and the category still exists; confirm an unrelated database error returns 500.

**Evidence required:** Passing CI for the latest commit, API response and read-back from the regression test, and staging evidence if the race can be tested safely.



### 50. Frontend: calculate whole-month budget spending correctly and test it
**What happens:** The previous dashboard calculation compares numeric category IDs. For a whole-month budget, its category is `null`, which becomes `0`; normal expenses have positive category IDs, so the displayed spending can remain zero.

**Why it matters:** The overall budget card can under-report spending and show a false on-track status even after the user has entered expenses.

**Required correction:** PR #54 now uses a shared calculation helper: a budget with no category includes all expenses in its month; a category budget includes only expenses in that category and month. Tests cover both cases and invalid amounts. The frontend now has a test script so CI executes these tests.

**How to verify:** In the frontend test results, confirm the whole-month and category-specific tests pass. Seed or create a whole-month budget through the authenticated API in a disposable test environment, then load it in the browser with two same-month expenses in different categories and one expense from another month. Confirm the whole-month budget counts the first two only; the category budget counts only the selected category. This verifies calculation behavior, not the separate unresolved question of whether the browser should create whole-month budgets. Confirm the progress percentage and remaining amount update correctly.

**CI evidence:** Run `38273922288` passed all eight jobs for commit `77620d6547cad3ee3774657df9dd0b9256ed9ff6`; all seven frontend tests passed (four budget-spending and three search tests) and the backend suite passed 62 tests twice. **Still required:** A redacted browser test recording or screenshots showing the expected totals; CI does not prove the live UI or AWS deployment. AWS runtime verification is a separate release check.


### 51. DevOps/documentation: show both environment-file setup steps
**What happens:** Compose requires both the root `.env` for PostgreSQL variables and `backend/.env` for the backend's application secrets. The Docker guide previously told readers to create only the root file.

**Why it matters:** A clean setup following that guide alone can fail before the backend starts.

**Required correction:** PR #54 updates `docs/docker.md` to copy both example files and explains which values to replace in each. The Flask and JWT signing secrets must be separate strong random values.

**How to verify:** On a disposable clean checkout, remove local `.env` files, follow the guide exactly, replace placeholders, and start Compose. Confirm frontend, backend, PostgreSQL, and Nginx are healthy.

**CI evidence:** Run `38273922288` passed all eight jobs for commit `77620d6547cad3ee3774657df9dd0b9256ed9ff6`. **Still required:** Follow the guide on a clean local checkout and retain the exact setup commands plus a redacted `docker compose ps` result showing all four services healthy.


### 52. Frontend/QA: show only budgets that match global search
**What happens:** The earlier global search added every budget whenever any search text was entered, even if the budget title, category, month, and limit did not match the query.

**Why it matters:** Irrelevant budgets appear in results and can make it harder to find the item the user actually searched for.

**Required correction:** PR #54 now filters budget results by the displayed title and subtitle, including category/overall-budget title and month/limit. It also adds executable Node tests for matching and non-matching queries.

**How QA will verify:** Search by category name, month, and unrelated text. Confirm only matching budgets appear and the whole-month budget has a clear title. Confirm expense and category results still work.

**CI evidence:** Run `38273922288` passed all eight jobs for commit `77620d6547cad3ee3774657df9dd0b9256ed9ff6`; all three budget-search tests passed. **Still required:** Browser evidence for matching and non-matching searches.


### 53. Frontend: protect the Reports CSV export from spreadsheet formulas
**What happens:** The report download previously escaped quotation marks but did not neutralize formula-leading descriptions or category names. The Transactions download already had this protection, so the two export paths behaved differently.

**Why it matters:** Spreadsheet software may execute formula-like text from a downloaded report instead of displaying it as plain text.

**Required correction:** PR #54 now uses one shared `escapeCsvCell` helper for both Transactions and Reports and adds Node tests for formula prefixes and CSV quoting.

**How to verify:** CI run `38276034129` passed all eight jobs for commit `97e6515f00c15e240532da653235421a2c6fb055`, including nine frontend Node tests and the frontend lint/build. Next, export a report containing a test value such as `=1+1` and confirm the downloaded cell is neutralized.

**Evidence to close:** CI run `38276034129` on commit `97e6515f00c15e240532da653235421a2c6fb055`, nine passing frontend tests, and a sanitized report export sample from both export paths. The browser portion remains open.


### 54. Frontend: keep the report CSV download URL alive long enough
**What happens:** The Reports export revoked its Blob URL immediately after starting the download, while the Transactions export waits one second before cleanup.

**Why it matters:** Browser download handling can be asynchronous; early revocation may interrupt the report download.

**Required correction:** PR #54 now delays URL cleanup by one second, matching the Transactions export.

**How to verify:** Run current-head CI, then export small and larger reports in the supported browsers and confirm every file completes with the expected rows.

**CI status:** Run `38276034129` passed all eight jobs for commit `97e6515f00c15e240532da653235421a2c6fb055`, including frontend lint/build and nine Node tests.

**Evidence to close:** Passing CI, browser/version used, successful download confirmation, and a check of the downloaded row count.


## Latest CI checkpoint — 2026-10-12
Run `38276034129` passed all eight jobs for code commit `97e6515f00c15e240532da653235421a2c6fb055`. Backend lint passed and 62 backend tests passed twice. Frontend lint/build passed and all nine Node tests passed, including budget spending, budget search, and CSV formula/quoting checks. Database migrations 001–005, secret scan, both Docker builds, and aggregate CI passed. AWS and browser runtime evidence remains open.


### 55. Backend/security: disable the debugger outside explicit development modes
**What happens:** Running `python app.py` previously enabled Flask debug mode unconditionally, even though the application defaults to production mode and the Docker image uses Gunicorn.

**Why it matters:** Direct execution with production settings could expose development-only debugger behavior.

**Required correction:** PR #54 adds a mode check so debug is enabled only for explicit development/test environments and adds parameterized tests.

**How to verify:** Wait for current-head CI and confirm the debug-mode tests pass. Confirm the production Docker entry point still uses Gunicorn and debug remains disabled.

**CI status:** Run `38277037377` passed all eight jobs for commit `8151bb56e730c6f6eb0205691b334a121abc934e`; backend lint and 69 backend tests passed, including the new mode-selection cases.

**Evidence to close:** Passing CI, tested commit SHA, test output, and production entry-point confirmation.


### 56. Frontend: preserve UTF-8 text in report CSV downloads
**What happens:** Transactions exports include a UTF-8 BOM, but Reports exports previously did not.

**Why it matters:** Some spreadsheet software may misread non-ASCII descriptions or category names in a CSV without a BOM.

**Required correction:** PR #54 now prepends a UTF-8 BOM to the Reports CSV Blob, matching Transactions.

**How to verify:** Export a report with non-ASCII text and open/import it in the supported spreadsheet workflow. Confirm the characters are intact.

**Evidence to close:** Passing CI, tested commit SHA, and a sanitized report sample showing the characters correctly.


### 57. DevOps/backend/database: use a restricted PostgreSQL runtime account
**What happens:** The Compose file previously passed the bootstrap PostgreSQL account to the backend.

**Why it matters:** A backend compromise could gain far more database control than the application needs.

**Correction in PR #54:** The backend now receives `POSTGRES_APP_USER` and `POSTGRES_APP_PASSWORD`; migration 006 configures a non-superuser role with required table/sequence access and no role/database creation privileges. CD applies migration 006 before restarting the app, and CI checks privilege boundaries. CI run `38418489243` passed all eight jobs for commit `905f5db2ff17d968e220f890d90007ce74a42cc2`, including migration 006, runtime-role privilege checks, 71 backend tests twice, nine frontend tests, npm audit with zero reported vulnerabilities, both Docker builds, and the README/architecture updates. AWS existing-volume and live runtime checks remain open.

**How to verify:** Confirm the backend test suite connects with the restricted role. Then test a fresh database and a disposable copy of an existing AWS database. Confirm normal app operations work while privileged operations fail, and confirm migrations run through the separate bootstrap account.

**Evidence to close:** Green current-head CI, role/grant output, migration logs, passing CRUD tests, and AWS staging evidence.


### 58. Team lead/DevOps: verify the documented AWS URL and architecture against production
**What happens:** PR #54 now includes the production domain recorded in the previous main README and embeds the architecture image already present in `docs/`. The documents are aligned to AWS EC2, but the audit has not yet verified the live domain or compared the diagram with the running AWS topology.

**Why it matters:** A URL can remain in a README while the service is unavailable or points to a different release. A diagram can also become stale after infrastructure changes.

**Required action:** Test the public domain from outside the EC2 host, verify `/api/health` and `/api/health/db`, record the deployed commit/image digest, and compare the existing diagram with the actual AWS topology. Update the README/image only if the evidence shows a mismatch.

**Evidence to close:** Timestamped URL and health results, deployed SHA/image digest, and confirmation that the committed diagram matches the actual AWS services. The README content alone does not close the runtime gate.


### Documentation update — README and architecture
PR #54 updates the existing root README rather than creating a duplicate. It documents the project as Expense Tracker / Enhanced Personal Expense Management Platform, describes the implemented React/Vite, Flask, PostgreSQL 16, Nginx, Docker Compose, GitHub Actions, GHCR, and AWS EC2 path, and gives local setup/test commands and release evidence requirements. The existing architecture image is embedded rather than replaced with a second diagram. The public domain remains subject to live health verification.

The architecture document is also aligned with host port 80, private PostgreSQL, restricted runtime database credentials, migrations 002–006 for existing AWS volumes, and the gated AWS deployment workflow. 


### Documentation ownership checkpoint — 2026-10-13
PR #54 owns the root README and architecture documentation because they must stay aligned with its code and migration changes. PR #53 contains the QA audit package only, avoiding duplicate root documentation edits across open PRs.



### 59. Repository administrator: align the GitHub About description with AWS
**What happens:** The repository's GitHub About description still names Azure, while the correction branch README, architecture guide, and deployment workflow use AWS EC2.

**Why it matters:** The repository header can contradict the approved deployment target even when the code and project documents are aligned.

**Required correction:** A repository administrator should update the GitHub About/description to: “A full-stack personal expense management platform built with React, Flask, PostgreSQL, Docker, CI/CD, Nginx, and AWS EC2, with a focus on cloud architecture, DevOps, security, monitoring, and automated deployment.”

**How to verify:** Refresh the repository home page and confirm the description says AWS EC2 and agrees with the root README and .github/workflows/cd.yml.

**Evidence required:** The updated repository header and confirmation that README, architecture guide, and CD workflow all name AWS EC2. This metadata change is outside a code-file commit.
