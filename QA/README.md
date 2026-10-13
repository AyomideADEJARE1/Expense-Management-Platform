# QA Documentation — Expense Management Platform

This directory is the consolidated quality-assurance record for the Expense Tracker project.

The QA process uses three sources of truth: the approved capstone specification for requirements; the repository, Git history, branches, and pull requests for implementation and history; and executed test evidence for verification.

QA is not measured by defect count. PASS means tested with evidence. FAIL means tested and the expected result was not achieved. BLOCKED means a required environment or dependency was unavailable. PENDING means not yet executed. OBSERVATION means clarification is required before calling something a defect.

## Live environment status

The upstream README documents the production URL `https://expense-tracker.live`. This audit has not obtained reliable live-runtime evidence for it. Live checks therefore remain PENDING until a manual or runtime check is recorded with the deployed commit, the public health responses, and the browser results.

## Deployment target

The approved deployment target is AWS EC2 (Ubuntu). Earlier documents referred to Azure; those references are superseded. Recording the target does not prove that the latest code is deployed.

## Branch and pull-request scope

The upstream repository's `main` branch is the target for both open pull requests. Neither PR has been merged.

- **PR #53** (`stephen/qa-findings-followup`) contains this QA documentation package.
- **PR #54** (`stephen/qa-transaction-fixes`) contains the application corrections, the root README, the architecture and CI/CD documentation, and the CI and CD workflow updates.

Keeping the two PRs separate prevents the QA record and application changes from being duplicated.

## Documents

- `TEAM_ACTION_SUMMARY.md` — role-based team actions with impact, required correction, retest steps, and closure evidence. Start here.
- `QA_FINDINGS.md` — findings and observations with source evidence, impact, correction status, retest steps, and closure evidence.
- `MAIN_REPOSITORY_AUDIT.md` — read-only audit of the upstream `main` branch at `77497a5`, with status on `main` and on the PR #54 branch.
- `RUNTIME_VERIFICATION_PLAN.md` — runtime gates and the evidence required before each can close.
- `TEST_PLAN.md` — scope, method, environments, evidence, and release criteria.
- `REQUIREMENTS_TRACEABILITY.md` — requirements mapped to verification coverage.
- `TEST_CASES.md` — functional, API, security, database, infrastructure, CI/CD, and documentation tests.
- `RELEASE_CHECKLIST.md` — final QA gate.

Historical reconstruction from Git history is kept separate from executed testing. Git history can show that code changed; it does not by itself prove that a feature passed functional testing.

## Latest CI evidence

Source-level checks were run in GitHub Actions on the following commits. A CI pass verifies only the commit it ran on.

| Pull request | Head commit | CI run | Result |
|---|---|---|---|
| PR #54 | `6c85ad5c4be38acff1039eff4cf0e3a10285a2ed` | `38425755944` | All nine jobs passed, including 71 backend tests run twice, nine frontend Node tests, and the Nginx image check |
| PR #53 | `86183cfa452f2bbd73210fbb2b9aaa57c2a52939` | `38426167502` | All eight jobs passed for the documentation-only head before this update |

On the upstream `main` branch, the CI workflow allows an empty backend test suite. The latest run there collected zero backend tests. This is recorded as QA-FIND-088. PR #54 adds a strict backend test gate that fails when no tests are collected, and runs the suite twice to check repeatability.

These results do not prove application behavior in a deployed environment. Live AWS version identity, populated-database migrations, public health checks, browser journeys and downloads, reboot recovery, backup restoration, and shared rate-limit storage remain open runtime gates.

## Release status

- Live deployment and version identity on AWS EC2: PENDING
- Public `/api/health` and `/api/health/db`: PENDING (see MAIN-001 in `MAIN_REPOSITORY_AUDIT.md`)
- Browser journeys and CSV downloads: PENDING
- Populated-database migration and backup restoration: PENDING
- Product and security decisions recorded in the findings: OPEN

Neither PR is ready to merge until the team has reviewed the findings and assigned actions, resolved the product-scope decisions, and attached the runtime evidence listed in the release checklist.
