# QA Documentation — Expense Tracker

| Field | Value |
|---|---|
| Document | QA reading guide and governance for the Expense Tracker QA record |
| Version | 2.2 |
| Date | 2026-10-15 |
| Repository | `AyomideADEJARE1/Expense-Management-Platform` (`main`) |
| Continues | PR #43, merged 2026-10-10 into the `qa-documentation` branch |
| This change | PR #53 (`stephen/qa-findings-followup`) |
| Corrections | PR #54 (`stephen/qa-transaction-fixes`) |
| Register | [QA_FINDINGS.md](QA_FINDINGS.md), the single findings register |

## 1. Purpose

This directory is the quality-assurance record for the Expense Tracker capstone project. It records what was tested, what was found, what has been corrected, and what still needs verification, so a reviewer can decide whether a release is ready.

For every finding, the record must answer three questions: what is wrong, how it was established, and what evidence shows it is fixed.

## 2. Relationship to PR #43

PR #43 introduced the QA package, the status terms, the baseline findings QA-FIND-001 to 009, and the retest rule. This version keeps them. Nothing from PR #43 has been removed from the register.

Three changes from PR #43:

- **One register.** `QA_FINDINGS.md` is the only place findings are recorded.
- **Environment status** is stated in section 6, from the project owner's report, with the evidence still to be recorded.
- **Evidence rules and a release gate** are in sections 11 and 12.

## 3. Scope

**System under test:** the Expense Tracker application at `main` (commit `77497a5`), and the corrections on PR #54.

| Component | Location | Role |
|---|---|---|
| React frontend | `frontend/` | User interface, built and served by its own container |
| Flask API | `backend/` | Authentication, expenses, categories, budgets, summaries, CSV export, health endpoints |
| PostgreSQL 16 | `database/migrations/` | Persistent data, applied as ordered migrations |
| Nginx | `nginx/` | Single public entry point and reverse proxy |
| Docker Compose | `docker-compose.yml` | Local and integration stack |
| CI/CD | `.github/workflows/` | Checks on each pull request, image publishing, and AWS EC2 deployment |
| AWS EC2 | Deployment target | Approved deployment target (QA-FIND-008) |

Out of scope for this record: load testing, and settings held outside the repository, such as the GitHub repository settings and the AWS and Cloudflare consoles. Those are listed in section 14 as owner actions.

## 4. Sources of truth

1. **Requirements:** the approved capstone specification.
2. **Implementation and history:** the repository, its branches, and its pull requests. Git history shows that code changed. It does not prove that a feature works.
3. **Executed evidence:** test runs, CI results recorded against a named commit, and runtime checks recorded with a date and result.

## 5. Status terms

| Term | Meaning |
|---|---|
| PASS | Tested, with evidence, and the expected result was achieved |
| FAIL | Tested, and the expected result was not achieved |
| BLOCKED | A required environment or access was unavailable |
| PENDING | Not yet executed |
| OBSERVATION | Clarification is needed before the item is called a defect |
| Confirmed defect | Shown in the code or configuration. Not yet proven at runtime |
| Corrected on PR #54 | A correction exists on the PR #54 branch. Source-verified when the file has been read; CI-verified when a CI check asserts the behavior |
| Retest PASS / FAIL | A retest was executed after a correction and recorded against a named commit or environment |
| Runtime verification required | The correction cannot be proven from source. A live, browser, or staging check must be recorded |
| Owner action | The item needs a person with access that the QA role does not have (section 14) |

A corrected finding is not closed until its retest is recorded. A CI pass is evidence for the commit it ran on, and for nothing else.

## 6. Environment status

| Item | Current position | Evidence required |
|---|---|---|
| Production on AWS EC2 | **Live.** Reported by the project owner on 2026-10-15. The domain is configured | A dated record of the running commit or image (owner action A13) |
| Public URL | Live, per the project owner. Not yet checked in this record | `/api/health` and `/api/health/db` responses, with date and time (test Q1) |
| Deployed version | Not yet recorded | Commit SHA or image digest from the host (owner action A13) |
| Browser journeys | Not yet executed against the live site | Test run record (tests Q2 to Q9) |

No live result is recorded as PASS until the evidence above is entered. The environment is tracked as QA-FIND-009.

## 7. Severity and priority

| Priority | Meaning |
|---|---|
| High | Financial data integrity, security exposure, a deployment that can fail or lose data, or a missing capstone requirement |
| Medium | A correctness, usability, or operational gap with a workaround |
| Low | Documentation, cosmetic, or hygiene issues with no user-visible failure |

Where an entry gives a range, plan using the higher value.

## 8. Finding identifiers

- Every finding has a **QA-FIND-nnn** identifier. Numbers are never reused.
- The last number in the register is QA-FIND-089. New findings take the next free number.
- Titles and classifications do not change when a finding is corrected. The status and evidence are updated instead.
- Identifiers from the earlier draft audit (MAIN-nnn) are retired. Section 15 maps them.

## 9. Finding lifecycle

1. **Open:** recorded with evidence, classification, and priority.
2. **Corrected on PR #54:** a correction exists on the named branch.
3. **Retest pending:** the retest is planned, with its steps and environment.
4. **Retest PASS or FAIL:** executed and recorded against a commit and environment.
5. **Closed:** a retest PASS is recorded, and no related runtime gate remains open.

**Open – decision** (a product or policy decision is needed) and **Owner action** (a person with access must act) are not corrected states.

## 10. Retest rule

Resolved findings stay in the register. Each retest records the fixing commit or PR, the affected test, the environment, the evidence, and the result. A failed retest reopens the finding.

## 11. Evidence standard

- **Source evidence:** a file path, a line or configuration key, and the branch and commit read.
- **CI evidence:** a run identifier, the commit it ran against, and the job results. It shows checks passed, not runtime behavior.
- **Runtime evidence:** the command or steps, the output or screenshot, the date, the environment, and the commit or image tested. Records must not contain passwords, tokens, or real financial data.
- **Documentation claims** are checked against the code they describe.

Do not record a result as PASS on source evidence alone.

## 12. Release gate

A release is ready only when all of the following are recorded:

1. No open High-priority finding remains, unless an approved decision is recorded.
2. The corrections for the release are merged, and their retests are recorded.
3. CI passes on the exact commit to be released, and `ci-success` is required on `main` (owner action A2).
4. The live site is verified: the running commit, both public health endpoints, and the main browser journeys (tests Q1 to Q9).
5. A migration has been tested on a copy of a populated database, and a backup has been restored (owner actions A5 and A6).
6. Monitoring is configured, and an alert has been tested end to end (test Q6 and owner action A10).
7. The AWS account matches `docs/aws-iam.md` (owner action A8).
8. The product decisions in the register are made and documented (owner action A11).

## 13. Tests the QA role can run

Run these against the live site unless stated otherwise. Record the date, time, and result for each.

| Test | Steps | Expected result |
|---|---|---|
| Q1 Public health | Open `https://<domain>/api/health` and `https://<domain>/api/health/db` | Both return a success response with status `ok` |
| Q2 Registration and sign-in | Register a test account, sign out, and sign in again | Account is created, sign-in succeeds, and the dashboard loads |
| Q3 Expense CRUD | Add, edit, and delete an expense | Each change appears and persists after a page refresh |
| Q4 Filters | Filter by month, by date range, and by category | Only matching expenses appear |
| Q5 Budgets and dashboard totals | Create a category budget and add expenses to it | The dashboard shows the budget spent amount, including for a whole-month budget (QA-FIND-003, QA-FIND-079) |
| Q6 Monitoring | Create a free external uptime monitor on `https://<domain>/api/health`. Then point a second monitor at a path that does not exist, and confirm that an alert arrives | The first monitor reports up. The second reports down and sends an alert to the channel you set up |
| Q7 Password rule | Register with a 7-character password | Refused with a 400 response (after the PR #54 deploy) |
| Q8 Category authorization | Call `POST /api/categories` with no token | Refused with a 401 response (after the PR #54 deploy) |
| Q9 Duplicate budget | Create two budgets for the same month with no category | The second request is refused with a 409 response |
| Q10 CSV download | Export expenses, open the file in a spreadsheet application, and check for formula cells | Downloads and opens, and text cells beginning with `=` are shown as text |
| Q11 Browser console | Load the dashboard, transactions, and reports with the browser developer tools open | No Content Security Policy violations are reported |

For Q6, record the monitoring service and the alert channel, but not any credentials.

## 14. Owner actions

These actions need access the QA role does not have. Each one is to be completed by the named owner, and the evidence returned to the QA record.

| ID | Action | Owner | Evidence to return | Register |
|---|---|---|---|---|
| A1 | Change the GitHub repository description, which still says Azure | Repository administrator | Screenshot of the new description | QA-FIND-087 |
| A2 | Protect `main`: require a pull request, at least one approval, the `ci-success` check, up-to-date branches, and block force pushes | Repository administrator | Screenshot of the branch protection rule | QA-FIND-088 |
| A3 | Set the `production` environment secrets (`AWS_EC2_HOST`, `AWS_EC2_USER`, `AWS_EC2_SSH_KEY`, `GHCR_READ_USERNAME`, `GHCR_READ_TOKEN`) and variables (`DEPLOY_ENABLED`, `APP_URL`, `DEPLOY_PATH`) | Repository administrator | Screenshot of the environment settings, with values hidden | QA-FIND-012 |
| A4 | Add the new database variables to the host's root `.env` and `backend/.env` before the next deploy: `POSTGRES_APP_USER`, `POSTGRES_APP_PASSWORD`, and the signing keys | DevOps or host owner | Confirmation that both files have the variables, without their values | QA-FIND-086, QA-FIND-036 |
| A5 | Back up the production database, then confirm that migrations 002 to 006 are applied | DevOps or host owner | Backup file name and date; `\dt` and migration status output | QA-FIND-041, QA-FIND-054 |
| A6 | Restore a database backup to a separate host or volume and confirm the data | DevOps or host owner | Restore log and row counts | QA-FIND-072 |
| A7 | Reboot the EC2 host and confirm that all containers return | DevOps or host owner | Time of reboot, and `docker compose ps` afterwards | QA-FIND-071 |
| A8 | Confirm the AWS account: root MFA enabled and no root access keys, instance role policies, security-group rules (port 22 restricted; ports 5000 and 5432 closed), CloudTrail active, billing alerts | AWS account owner | Checklist from `docs/aws-iam.md`, with each item marked | QA-FIND-092 |
| A9 | Confirm HTTPS on the domain: certificate valid, renewal configured, and a decision on HSTS | Account owner (Cloudflare and Certbot) | Certificate expiry date and the HSTS decision | QA-FIND-050 |
| A10 | Schedule `scripts/healthcheck.sh` on the host, and connect an alert channel to it | DevOps or host owner | The cron entry, and a test alert | QA-FIND-093 |
| A11 | Decide the open product items: category ownership, notification delivery, budget alert threshold, currency conversion, password recovery, email verification, rate-limit storage, whole-month budgets in the browser | Team lead or product owner | Written decision for each | QA-FIND-010, 061, 068, 069, 070, 073, 074, 076 |
| A12 | Record the deployed commit or image digest | DevOps or host owner | Commit SHA or digest, and date | QA-FIND-009 |
| A13 | Record the deployed commit for the live site, once after the PR #54 deploy | DevOps or host owner | The same as A12 | QA-FIND-009 |
| A14 | Decide whether a staging copy of the database exists for the migration test | Team lead | Yes or no, with the location | QA-FIND-041 |

Team member names and the architecture diagram are being handled by the team lead outside this record.

## 15. Retired audit identifiers

The earlier draft audit used MAIN identifiers. Each is retired and mapped to the register.

| Retired | Register entry |
|---|---|
| MAIN-001 | QA-FIND-023 |
| MAIN-002, MAIN-018 | QA-FIND-008, QA-FIND-021 |
| MAIN-003 | QA-FIND-022 |
| MAIN-004 | QA-FIND-018 |
| MAIN-005 | QA-FIND-030 |
| MAIN-006 | QA-FIND-056 |
| MAIN-007 | QA-FIND-011, QA-FIND-088 |
| MAIN-008 | QA-FIND-027, QA-FIND-036 |
| MAIN-009 | QA-FIND-028 |
| MAIN-010 | QA-FIND-084 |
| MAIN-011 | QA-FIND-019 |
| MAIN-012 | QA-FIND-001 |
| MAIN-013 | QA-FIND-024, QA-FIND-041 |
| MAIN-014 | QA-FIND-023 |
| MAIN-015 | QA-FIND-089 |
| MAIN-016 | QA-FIND-073 |
| MAIN-017 | QA-FIND-049 |
| MAIN-019 | QA-FIND-087 |
| MAIN-020 | QA-FIND-009 |
| MAIN-021 | QA-FIND-090 |
| MAIN-022 | QA-FIND-091 |
| MAIN-023 | QA-FIND-010 |
| MAIN-024 | QA-FIND-049, QA-FIND-080 |
| MAIN-025 | QA-FIND-049 |
| MAIN-026 | QA-FIND-094 |
| MAIN-027 | QA-FIND-092 |
| MAIN-028 | QA-FIND-093 |
| MAIN-029, MAIN-030 | QA-FIND-002 |
| MAIN-031 | QA-FIND-097 |
| MAIN-032 | QA-FIND-098 |
| MAIN-033 | QA-FIND-014, QA-FIND-022 |
| MAIN-034 | QA-FIND-095 |

## 16. Pending register entries

These entries are not yet in `QA_FINDINGS.md`. They are copied into the register when it is next updated.

| Entry | Title | Status |
|---|---|---|
| QA-FIND-090 | CD deploy job hardcodes the image owner | Corrected on PR #54. Retest: a fork run uses the fork's image names |
| QA-FIND-091 | Backend container runs as root | Corrected on PR #54. Retest: the running container is not UID 0 |
| QA-FIND-092 | AWS IAM roles, policies, and access not documented | Documented on PR #54. Owner action A8 |
| QA-FIND-093 | Monitoring is partial | Partly corrected on PR #54. Owner action A10 and test Q6 |
| QA-FIND-094 | Unreferenced duplicate schema copy | Corrected on PR #54 |
| QA-FIND-095 | CONTRIBUTING.md is out of date | Corrected on PR #54 |
| QA-FIND-096 | Legacy frontend removed | Corrected on PR #54. Retest: no root `src/` or `public/` on merged `main` |
| QA-FIND-097 | Team member names missing from the submission record | Handled by the team lead |
| QA-FIND-098 | Architecture diagram not verified against the implementation | Handled by the team lead |

## 17. Status corrections to existing entries

| Entry | Correction |
|---|---|
| QA-FIND-001 | Corrected on PR #54. Retest: no root `src/` or `public/` on merged `main` |
| QA-FIND-003 | Corrected on PR #54 (source-verified). Retest: test Q5 |
| QA-FIND-004, 005, 006 | Not verified in this review. Retests: tests Q3, Q4, and Q10 |
| QA-FIND-009 | Live status reported by the project owner on 2026-10-15. Verification: tests Q1 and owner action A12 |
| QA-FIND-022 | Also corrected: the retired password was removed from `docs/security.md` |
| QA-FIND-040 | Still open. The CD workflow also pushes a `latest` tag |
| QA-FIND-050 | Corrected on PR #54: Content Security Policy added. Retest: test Q11 |
| QA-FIND-075 | Corrected on PR #54: registration requires 8 to 128 characters. Retest: test Q7 |
| QA-FIND-087 | Still open. Owner action A1 |

## 18. Document index

| Document | Purpose |
|---|---|
| `README.md` | This guide |
| `QA_FINDINGS.md` | The single findings register |
| `TEAM_ACTION_SUMMARY.md` | Role-based actions for open findings, with retest steps |
| `RUNTIME_VERIFICATION_PLAN.md` | Runtime gates and the evidence each requires |
| `TEST_PLAN.md` | Scope, method, environments, and release criteria |
| `REQUIREMENTS_TRACEABILITY.md` | Capstone requirements mapped to tests and findings |
| `TEST_CASES.md` | Functional, API, security, database, infrastructure, CI/CD, and documentation tests |
| `RELEASE_CHECKLIST.md` | The final QA gate |

## 19. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-10 | Baseline QA package, merged through PR #43 |
| 2.0 | 2026-10-13 | Continuation through PR #53: reconciled to the register, draft audit removed, evidence standard and release gate added |
| 2.1 | 2026-10-13 | Commit lists and CI identifiers removed; pending entries listed by identifier |
| 2.2 | 2026-10-15 | Environment status updated to live, as reported by the project owner. QA test procedures (Q1 to Q11) and owner actions (A1 to A14) added. Monitoring procedure added |
