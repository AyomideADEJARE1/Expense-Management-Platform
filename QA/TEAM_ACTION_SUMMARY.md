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

### 8. DevOps and team lead: confirm the required cloud
**What happens:** The capstone requirement calls for an Azure VM, while the main README describes AWS EC2.

**Why it matters:** A working application on the wrong cloud may not meet the assessment requirement.

**Team lead/instructor:** Confirm whether Azure is mandatory or an alternative is approved. Record the decision. If Azure is required, deploy there and collect evidence.

**QA check:** The documented requirement, actual VM, deployment workflow, and demonstration evidence must agree.

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

## What QA can and cannot close alone

QA can inspect code, document defects, write test cases, run available automated checks, compare results with requirements, and report evidence.

QA cannot truthfully confirm a live Azure deployment without access to the deployment and its logs. QA should not choose the cloud target without the team/instructor's decision. QA should not invent category-admin permissions without agreement on the intended product behavior. Backend and DevOps owners must implement and verify changes that require their code, secrets, cloud access, or database environment.

The team should assign a named person to each action. “Backend owner” and “DevOps owner” identify the role that needs to act; the team must fill in the person's name.

## Release checklist

Do not mark a check as passed until evidence is attached.

- [ ] Category permissions are implemented and tested.
- [ ] Database-enforced budget uniqueness is implemented and tested.
- [ ] Budget conflicts return HTTP 409; unexpected errors remain server errors.
- [ ] Production database and JWT secrets are required and are not sample values.
- [ ] Tests use an isolated database and pass repeatedly.
- [ ] CI is green for the exact release commit.
- [ ] Migration succeeds on fresh and existing databases.
- [ ] The deployment target is approved and matches the capstone requirement.
- [ ] The running image matches the tested commit.
- [ ] Both health endpoints work through Nginx.
- [ ] Registration, expense ownership, filters, CSV export, budgets, and dashboard totals pass browser testing.
- [ ] Screenshots, workflow run links, commit SHA, and test results are attached.

**Current overall status:** Several issues are documented and some source corrections have been proposed. The latest reported CI run passed, but live deployment and browser verification remain pending. Do not describe the whole project as release-ready until the blocking items above are closed with evidence.
