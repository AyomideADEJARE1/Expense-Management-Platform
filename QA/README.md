# QA Documentation — Expense Management Platform

This directory is the consolidated quality-assurance record for the Expense Tracker project. It is the continuation of the QA package merged through PR #43 (`docs: add current QA documentation package`, merged 2026-10-10 into the `qa-documentation` branch). This update, PR #53, extends that record without renaming any existing finding.

## How to read this record

**Three sources of truth.** Requirements come from the approved capstone specification. Implementation and history come from the repository, Git history, branches, and pull requests. Verification comes only from executed tests with recorded evidence.

**Status terms.** These terms are used everywhere in this directory:

| Term | Meaning |
|---|---|
| PASS | Tested, with evidence, and the expected result was achieved |
| FAIL | Tested, and the expected result was not achieved |
| BLOCKED | A required environment or dependency was unavailable |
| PENDING | Not yet executed |
| OBSERVATION | Clarification is needed before the item is called a defect |
| Confirmed defect | Shown in the code or configuration. Not yet proven at runtime |
| Fixed on PR #54 | A correction exists on the PR #54 branch. Source-verified, and CI-verified where a CI check asserts it |
| Runtime verification required | The fix cannot be proven from source. A live or browser check must be recorded |

QA is not measured by defect count. A resolved finding stays in the record.

## Finding identifiers

Two identifier families exist. Neither has been renamed.

- **QA-FIND-nnn** is the baseline record from PR #43 (`QA_FINDINGS.md`, QA-FIND-001 to QA-FIND-009), extended by the findings in this PR. QA-FIND-007 and later numbers were added in the expanded findings file.
- **MAIN-nnn** is the read-only audit of the upstream `main` branch (`MAIN_REPOSITORY_AUDIT.md`). Each MAIN item states the QA-FIND item it corresponds to, where one exists.

Where a MAIN item and a QA-FIND item describe the same problem, both are listed, and the status is the same in both places.

## Live environment status (reconciled)

The baseline record (PR #43, `README.md` of the `qa-documentation` branch) states that the live deployment was **intentionally paused** to conserve cloud credit. The upstream README describes `https://expense-tracker.live` as the production URL.

These two statements conflict, and this audit cannot resolve the conflict from the repository. Therefore:

- No live URL, health check, deployed version, or browser journey is recorded as PASS in this record.
- The live URL is treated as **PENDING** until a person records a check on the current deployment, with the date, the commit or image, and the result.
- QA-FIND-009 (live verification blocked) and MAIN-020 remain open for that reason.

## Deployment target

The approved deployment target is AWS EC2 (Ubuntu), as recorded in QA-FIND-008. Earlier configuration referred to Azure. PR #54 removes those references from the deployment workflow and documentation. The Azure job has been replaced, not kept as a fallback.

## Scope of the two pull requests

- **PR #53** (`stephen/qa-findings-followup` → `main`) contains this QA documentation package and the audit of the upstream `main` branch. It records findings. It contains no application code.
- **PR #54** (`stephen/qa-transaction-fixes` → `main`) contains the corrections for the findings. Each correction is referenced to its finding ID, so a reviewer can check the fix against the record.

Neither PR has been merged. Keeping findings and corrections in separate PRs means a reviewer can accept the record and the fixes independently.

## Documents

| Document | Purpose |
|---|---|
| `README.md` | This document. Reading guide, status terms, and the reconciled status of the environment |
| `TEAM_ACTION_SUMMARY.md` | Role-based team actions, with impact, correction, retest steps, and closure evidence. Start here for actions |
| `QA_FINDINGS.md` | Findings and observations, with source evidence, impact, correction status, and retest steps |
| `MAIN_REPOSITORY_AUDIT.md` | Read-only audit of the upstream `main` branch, with status on `main` and on the PR #54 branch |
| `RUNTIME_VERIFICATION_PLAN.md` | Runtime gates, and the evidence required to close each one |
| `TEST_PLAN.md` | Scope, method, environments, evidence, and release criteria |
| `REQUIREMENTS_TRACEABILITY.md` | Capstone requirements mapped to verification coverage |
| `TEST_CASES.md` | Functional, API, security, database, infrastructure, CI/CD, and documentation tests |
| `RELEASE_CHECKLIST.md` | The final QA gate |

Git history can show that code changed. It does not prove that a feature passed functional testing. Historical reconstruction is kept separate from executed tests.

## Corrections made on PR #54

Each row is a correction that exists on the PR #54 branch. Commit references are the commits on `stephen/qa-transaction-fixes`.

| Finding | Correction | Commit |
|---|---|---|
| MAIN-001 / QA-FIND-002 | Nginx routes `/api/health/db` to the backend `/health/db` route | Source on branch; CI asserts it |
| MAIN-002, MAIN-018 | Deploy job replaced by AWS EC2 deployment, and the README and CI/CD guide describe AWS only | `cd.yml`, `docs/ci-cd.md` |
| MAIN-003 | Compose uses separate bootstrap and runtime database roles, and requires them through `${VAR:?...}` | `docker-compose.yml` |
| MAIN-004 | CSV export escapes formula-like text cells | `backend/routes/expenses.py` |
| MAIN-005 | Migration 003 enforces one general budget per user and month | `database/migrations/003_budget_uniqueness.sql` |
| MAIN-006 | Migration 004 restricts deleting a category that a budget references | `database/migrations/004_restrict_category_budget_delete.sql` |
| MAIN-007 / QA-FIND-088 | Backend runs `pytest` twice and fails on zero tests; frontend tests are required | `.github/workflows/ci.yml` |
| MAIN-008, MAIN-009, MAIN-010 | Separate and validated signing keys; configurable port; debugger off in production | `backend/app.py` |
| MAIN-011 | Expense input validation tightened | `backend/routes/expenses.py` |
| MAIN-012 / QA-FIND-001 | Root frontend duplicate removed. The maintained frontend is `frontend/` | Commits `bbe3078` to `c6a691c`, and the later removals on the same branch |
| MAIN-013, MAIN-014, MAIN-015 | Migrations applied before restart; deploy health checks; Nginx image built and tested in CI | `cd.yml`, `ci.yml` |
| MAIN-017 | Backend README port corrected from 8080 to 80 | `228ef20` |
| MAIN-022 | Backend container runs as an unprivileged user | `1b8af8a` |
| MAIN-024 | `docs/docker.md` corrected to the current stack | `8c2483a` |
| MAIN-025 | `docs/nginx.md` corrected to port 80 and the health routes | `723c7e1` |
| MAIN-026 | Unused duplicate schema copy removed | `1d1000f` |
| MAIN-028 (part) | Container log rotation; host health probe script | `0a99243`, `6c4f8f6` |
| MAIN-027 | AWS access model documented | `b75b35f` |
| MAIN-028 (part) | Monitoring coverage and gaps documented | `4c23da9` |
| MAIN-029, MAIN-030 | Environment-variable reference and objectives added to the README | `4e88259` |
| MAIN-033 | `docs/security.md` verified and corrected (removed the old development password, documented controls) | `867318d` |

The removal of the legacy root `src/` and `public/` folders (MAIN-012) is also on the branch. It removed 29 files. Two of them were legacy-only income features (`Income.jsx` and `IncomeVsExpensesChart.jsx`). Income tracking is not part of the capstone requirements, and the maintained frontend does not use it.

## Open items

| Finding | Status | Reason |
|---|---|---|
| MAIN-021 | Open on PR #54 | The deploy script hardcodes the image owner. The fix is in a workflow file, which the GitHub app cannot write |
| MAIN-016 / QA decision | Open | Rate-limit storage is in memory. A design decision is required |
| MAIN-019 | Open | The GitHub About description needs a repository administrator |
| MAIN-020 / QA-FIND-009 | Open, pending | Live environment status conflicts with the baseline record (see above) |
| MAIN-023 / QA-FIND-007 | Open, decision | Category ownership. Requires a product decision |
| MAIN-028 (alerting) | Open | An alert channel and external monitor must be configured on AWS |
| QA-FIND-003 | Confirmed defect, open | Dashboard does not pass budget data to the budget-dependent components |
| QA-FIND-004 | Open, not verified in this audit | Expense search navigation identifier |
| QA-FIND-005 | Open, not verified in this audit | Date and category filter controls in the transaction workflow |
| QA-FIND-006 | Open, not verified in this audit | CSV export action in the user interface |
| MAIN-031 | Delegated | Team member names are assigned to the team lead |
| MAIN-032 | Delegated | The architecture diagram is assigned to a team member for a visual check |

## Latest CI evidence

A CI pass verifies only the commit that ran. These are the results recorded for the commits named below:

| Pull request | Head commit | CI run | Result |
|---|---|---|---|
| PR #54 | `6c85ad5c4be38acff1039eff4cf0e3a10285a2ed` | `38425755944` | All nine jobs passed, including 71 backend tests run twice, nine frontend tests, and the Nginx image check |
| PR #53 | `86183cfa452f2bbd73210fbb2b9aaa57c2a52939` | `38426167502` | All eight jobs passed, for the documentation-only head before this update |

Commits added after those heads, including all the corrections listed above, have CI runs that were queued when last checked. Their results are **not recorded** here. Do not treat them as passing until the run result is recorded.

## Release status

| Gate | Status |
|---|---|
| Live deployment and version identity on AWS EC2 | PENDING (environment status conflicts with the baseline) |
| Public `/api/health` and `/api/health/db` | PENDING |
| Browser journeys and CSV downloads | PENDING |
| Populated-database migration and backup restoration | PENDING |
| Reboot recovery | PENDING |
| Product and security decisions (MAIN-016, MAIN-023) | OPEN |

Neither PR should be merged until the team has reviewed the findings, resolved the open decisions, and recorded the runtime evidence listed in the release checklist.
