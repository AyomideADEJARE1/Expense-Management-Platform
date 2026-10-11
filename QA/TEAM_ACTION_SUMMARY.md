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

### 2. Backend and database owner: prevent duplicate budgets
**What happens:** The application checks for an existing budget before saving, but the database does not yet guarantee that duplicate budgets are impossible.

**Why it matters:** Two requests sent at nearly the same time can create duplicate budgets and make totals misleading.

**Backend/database owner:** Add a database constraint or unique index and a safe migration. Handle a duplicate as HTTP 409 (conflict), not as a general server error.

**QA check:** Submit the same budget twice, including at the same time. Only one record should be saved. Different users must still be able to create their own budgets.

### 3. Backend/configuration owner: remove fixed database passwords
**What happens:** Docker Compose sets the same fixed database credentials for the backend and PostgreSQL.

**Why it matters:** Production may keep using predictable credentials even when someone believes they supplied different values in an environment file.

**Backend/DevOps owner:** Read credentials from one documented configuration source or a secret store. Do not silently use sample passwords in production. Rotate any real credentials that were exposed or reused.

**QA check:** A fresh local setup works with documented environment values; missing production values stop startup; logs do not reveal passwords.

### 4. Backend owner: use the intended JWT secret
**What happens:** The application previously read the Flask secret for JWT signing even though a separate JWT secret was supplied by CI. A source correction now checks the dedicated JWT variables first, but production must still reject a missing or placeholder JWT secret.

**Why it matters:** A person may change the JWT secret but the application may continue using another key. That makes secret rotation unreliable.

**Backend owner:** Require a dedicated strong JWT secret in production and add tests for missing, placeholder, and valid separate secrets.

**QA check:** Flask and JWT configuration use their intended separate values; production does not start if the JWT secret is missing or a placeholder.

### 5. Backend/test owner: make tests safe to repeat
**What happens:** The test fixture does not itself prove that test data is isolated and cleaned up.

**Why it matters:** A test may pass once but fail the next time because old users or categories remain. A wrong local configuration could also point tests at a database that should not be changed.

**Backend/test owner:** Use a dedicated disposable test database and reliable cleanup or transaction rollback. Refuse destructive test setup when the database is not clearly a test database.

**QA check:** Run the test suite twice and in a different order. Results should remain stable and test data should not leak between runs.

### 6. DevOps owner: deploy the exact version that passed CI
**What happens:** The deployment workflow publishes commit-tagged images but deploys the moving `latest` tag. The VM also runs `git pull`, which can move its source checkout separately from the image.

**Why it matters:** The live app might not be running the same version that passed CI. This makes failures harder to investigate and rollback less reliable.

**DevOps owner:** Deploy an immutable image tag or digest tied to the tested commit. Record the running version and test rollback to a known-good version.

**QA check:** Compare the CI commit, published image digest, and running container version. They must match.

### 7. DevOps owner: verify migrations on existing databases
**What happens:** The deployment workflow manually runs a SQL file that is also mounted in PostgreSQL's initialization directory. Initialization scripts do not automatically run again for an already-created data volume.

**Why it matters:** A new database may work while an existing deployment fails during an update. A failed migration can leave the application and database out of step.

**DevOps/backend owner:** Confirm the migration can be safely applied to a populated database. Prefer a versioned migration process, back up before production changes, and stop deployment if migration fails.

**QA check:** Test a fresh database, an existing database, and a simulated migration failure. Record the results and recovery steps.

### 8. Team lead/DevOps: use AWS as the approved deployment target
**Decision recorded for this audit:** The QA owner reports that the project tutor approved AWS as an alternative deployment target. The upstream README also identifies AWS EC2 as the current production environment.

**What happens:** The reviewed CD workflow still contains an legacy cloud-specific deployment job and secret names, while the approved/current environment is AWS EC2.

**Why it matters:** A workflow configured for the wrong cloud will not reliably deploy to the approved AWS VM and may mislead maintainers about which secrets and host are required.

**Required correction:** Align the deployment workflow, protected secret names, README, architecture/CI-CD documentation, and submission evidence with AWS. Retire or clearly separate the legacy cloud-specific deployment job. Do not claim a deployment succeeded just because workflow code exists.

**How QA will verify:** Confirm the AWS job targets the intended EC2 host, deploys the reviewed commit, and completes application and database health checks.

**Evidence to close:** Retain the tutor's approval with submission records, workflow run, EC2/container status, timestamped public URL checks, and screenshots showing the deployed version.

### 9. Backend/DevOps owner: test health checks through Nginx
**What happens:** A health endpoint may work inside the backend but fail through the public Nginx route.

**Why it matters:** The deployment may be marked failed even when the backend is running, or the pipeline may miss a database problem.

**Backend/DevOps owner:** Ensure Nginx maps both public health paths to the correct backend endpoints and the deployment checks both.

**QA check:** Test the public application and database health URLs with the database running and unavailable. Record status codes and response bodies.

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

**QA verification and closure evidence:** Pull both images from the target VM, deploy the intended immutable tag, and retain logs with secrets redacted plus the deployed image digest.

### 12. Backend/security: configure shared production rate limiting
**What happens:** Flask-Limiter reports that production rate-limit storage is in memory.

**Why it matters:** Limits held in one process are not shared across multiple workers or instances and can reset after restart.

**Required correction:** Configure a supported shared production store, such as Redis, with protected credentials and documented outage behavior. Keep in-memory storage scoped to local development and tests.

**QA verification and closure evidence:** Test requests across workers and retain production configuration, results, and monitoring/failure-behavior evidence.

### 13. Backend/database: handle budget-save failures by cause
**What happens:** The budget creation route catches every exception from database commit and returns HTTP 500. A uniqueness conflict could be treated as a server failure after a database constraint is added.

**Why it matters:** Expected duplicate requests are reported incorrectly, and a failed transaction may affect later requests if session rollback is not handled.

**Required correction:** Roll back failed commits, map known uniqueness violations to HTTP 409, and return a generic 500 only for unexpected errors. Do not expose SQL details.

**QA verification and closure evidence:** Test sequential and concurrent duplicates, then submit a valid budget after the conflict. Retain response codes, row counts, regression tests, and proof that sensitive details are not returned.

### 14. Backend/test owner: prove test-database isolation
**What happens:** The reviewed fixture does not by itself prove that test data is isolated, cleaned up, or protected against destructive setup targeting a non-test database.

**Why it matters:** Leftover data can make tests unreliable, and incorrect database configuration could affect data outside the test environment.

**Required correction:** Use a dedicated disposable test database, add a guard that refuses destructive setup unless the database is clearly a test database, and ensure reliable rollback or cleanup.

**QA verification and closure evidence:** Run the suite repeatedly and in a different order; retain the database guard/cleanup tests, CI output, and test database configuration.

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

## Release checklist

Do not mark a check as passed until evidence is attached.

- [ ] Category permissions are implemented and tested.
- [ ] Database-enforced budget uniqueness is implemented and tested, including NULL-category budgets and concurrent requests.
- [ ] Budget conflicts return HTTP 409; unexpected errors remain server errors and failed sessions are rolled back.
- [ ] Production database and JWT secrets are required and are not sample values.
- [ ] Tests use an isolated database and pass repeatedly.
- [ ] CI is green for the exact release commit and backend tests are actually collected.
- [ ] Migration succeeds on fresh and existing databases.
- [ ] AWS is the documented and approved deployment target, and the deployed AWS VM is evidenced.
- [ ] The running image matches the tested commit.
- [ ] The AWS VM can pull the published images using the intended permissions.
- [ ] Both health endpoints work through Nginx.
- [ ] Production rate limits use the approved shared storage configuration.
- [ ] Registration, current-user profile display, expense search navigation, expense ownership, filters, CSV export, budgets, and dashboard totals pass browser testing.
- [ ] Screenshots, workflow run links, commit SHA, and test results are attached.

**Current overall status:** Several issues are documented and some source corrections have been proposed. The correction branch has a reported successful CI run, but AWS deployment and browser verification remain pending. Do not describe the whole project as release-ready until the blocking items above are closed with evidence.
