# QA Documentation — Expense Tracker

| Field | Value |
|---|---|
| Document | QA reading guide and governance for the Expense Tracker QA record |
| Version | 2.1 |
| Date | 2026-10-13 |
| Repository | `AyomideADEJARE1/Expense-Management-Platform` (`main`) |
| Continues | PR #43, merged 2026-10-10 into the `qa-documentation` branch |
| This change | PR #53 (`stephen/qa-findings-followup`) |
| Corrections | PR #54 (`stephen/qa-transaction-fixes`) |
| Register | [QA_FINDINGS.md](QA_FINDINGS.md), the single findings register |

## 1. Purpose

This directory is the quality-assurance record for the Expense Tracker capstone project. It records what was tested, what was found, what has been corrected, and what still needs verification, so a reviewer can decide whether a release is ready.

For every finding, the record must answer three questions: what is wrong, how it was established, and what evidence shows it is fixed.

## 2. Relationship to PR #43

PR #43 introduced the QA package. It set the status terms, the baseline findings QA-FIND-001 to 009, and the retest rule. This version keeps those rules and extends them. Nothing from PR #43 has been removed from the register.

Three changes from PR #43:

- **One register.** `QA_FINDINGS.md` is the only place findings are recorded.
- **Reconciled environment status.** PR #43 recorded that production was paused. The README described the site as live. Section 6 states the current position.
- **Evidence rules and a release gate.** Sections 11 and 13 define what counts as evidence and what a release must meet.

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

**Out of scope for this record:** browser end-to-end automation, load testing, and services outside the repository, such as Cloudflare settings and registry policy. Where they matter, they appear in the runtime gates.

## 4. Sources of truth

1. **Requirements:** the approved capstone specification.
2. **Implementation and history:** the repository, its branches, and its pull requests. Git history shows that code changed. It does not prove that a feature works.
3. **Executed evidence:** test runs, CI results recorded against a named commit, and runtime checks recorded with a date and result.

## 5. Status terms

| Term | Meaning |
|---|---|
| PASS | Tested, with evidence, and the expected result was achieved |
| FAIL | Tested, and the expected result was not achieved |
| BLOCKED | A required environment or dependency was unavailable |
| PENDING | Not yet executed |
| OBSERVATION | Clarification is needed before the item is called a defect |
| Confirmed defect | Shown in the code or configuration. Not yet proven at runtime |
| Corrected on PR #54 | A correction exists on the PR #54 branch. Source-verified when the file has been read; CI-verified when a CI check asserts the behavior |
| Retest PASS / FAIL | A retest was executed after a correction and recorded against a named commit or environment |
| Runtime verification required | The correction cannot be proven from source. A live, browser, or staging check must be recorded |

A corrected finding is not closed until its retest is recorded. A CI pass is evidence for the commit it ran on, and for nothing else.

## 6. Environment status

| Item | Current position | Evidence required to change it |
|---|---|---|
| Production instance on AWS EC2 | PR #43 records the instance as paused to conserve cloud credit. The upstream README describes the site as live. The two records conflict | A dated check of the running instance, with the commit or image it runs |
| Public URL | Documented, not verified | `/api/health` and `/api/health/db` responses, with date and time |
| Deployed version | Not recorded | Commit SHA or image digest reported by the running host |
| Browser journeys | Not executed against the live environment | A recorded test run |

Until the first row is resolved, no live result is recorded as PASS or FAIL (QA-FIND-009).

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
- Identifiers from the earlier upstream-main audit (MAIN-nnn) are retired. Section 14 maps them.

## 9. Finding lifecycle

1. **Open:** recorded with evidence, classification, and priority.
2. **Corrected on PR #54:** a correction exists on the named branch.
3. **Retest pending:** the retest is planned, with its steps and environment.
4. **Retest PASS or FAIL:** executed and recorded against a commit and environment.
5. **Closed:** a retest PASS is recorded, and no related runtime gate remains open.

**Open – decision** (a product or policy decision is needed) and **Delegated** (a team role owns the action) are not corrected states.

## 10. Retest rule

Resolved findings stay in the register. Each retest records the fixing commit or PR, the affected test, the environment, the evidence, and the result. A failed retest reopens the finding.

## 11. Evidence standard

- **Source evidence:** a file path, a line or configuration key, and the branch and commit read.
- **CI evidence:** a run identifier, the commit it ran against, and the job results. It shows checks passed, not runtime behavior.
- **Runtime evidence:** the command or test, its output, the date, the environment, and the commit or image tested. Records must not contain secrets, passwords, or real financial data.
- **Documentation claims** are checked against the code they describe. A document that describes behavior the code does not have is a defect.

Do not record a result as PASS on source evidence alone. Do not describe a feature as deployed without deployment evidence.

## 12. Historical reconstruction

Git history can reconstruct implementation history. It is not a functional test unless execution evidence exists.

## 13. Release gate

A release is ready only when all of the following are recorded:

1. No open High-priority finding remains, unless an approved decision is recorded.
2. The corrections for the release are merged, and their retests are recorded.
3. CI passes on the exact commit to be released, and `ci-success` is required on `main`.
4. The live environment is verified: the deployed commit, both public health endpoints, and the main browser journeys (section 6).
5. A migration has been tested on a populated copy of the database, and a backup has been restored (QA-FIND-072).
6. Monitoring is configured, and an alert has been tested end to end (QA-FIND-093).
7. The AWS account matches `docs/aws-iam.md` (QA-FIND-092).
8. The product decisions in the register are made and documented.

The full checklist is in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## 14. Retired audit identifiers

These MAIN identifiers were used in a draft audit. Each one is retired and mapped to the register.

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

## 15. Pending register entries

These entries are not yet in `QA_FINDINGS.md`. They must be copied into the register, with their identifiers and evidence, when the register is next updated.

| Entry | Title | Status |
|---|---|---|
| QA-FIND-090 | CD deploy job hardcodes the image owner | Corrected on PR #54 (source-verified, CI-verified on the newest head). Retest: a fork run uses the fork's image names |
| QA-FIND-091 | Backend container runs as root | Corrected on PR #54. Retest: the running container does not run as UID 0 |
| QA-FIND-092 | AWS IAM roles, policies, and access not documented | Documented on PR #54 (`docs/aws-iam.md`). Retest: the live account matches the document |
| QA-FIND-093 | Monitoring is partial | Partly corrected on PR #54 (log rotation, host probe, `docs/monitoring.md`). Open: scheduled probing with alerting, external uptime monitoring, centralized logs, host metrics |
| QA-FIND-094 | Unreferenced duplicate schema copy | Corrected on PR #54. Migrations are the only schema source |
| QA-FIND-095 | CONTRIBUTING.md is out of date | Corrected on PR #54 |
| QA-FIND-097 | Team member names missing from the submission record | Delegated to the team lead |
| QA-FIND-098 | Architecture diagram not verified against the implementation | Delegated to a team member |

## 16. Status corrections to existing entries

| Entry | Correction |
|---|---|
| QA-FIND-001 | Corrected on PR #54: root build files and the root `src/` and `public/` folders removed. Retest: no root `src/` or `public/` on merged `main` |
| QA-FIND-003 | Corrected on PR #54 (source-verified): `App.jsx` passes budgets to `Dashboard`, which passes them to `SummaryCards`, `CategoryDonutChart`, and `BudgetOverview`. Retest pending: browser check of dashboard budget totals |
| QA-FIND-004, 005, 006 | Not verified in this review. Each keeps its register status, and its retest is still required |
| QA-FIND-022 | Also corrected: the retired password was removed from `docs/security.md` |
| QA-FIND-040 | Still open. The CD workflow also pushes a `latest` tag |
| QA-FIND-087 | Still open. Requires a repository administrator |

## 17. Document index

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

## 18. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-10 | Baseline QA package, merged through PR #43 |
| 2.0 | 2026-10-13 | Continuation through PR #53: reconciled to the register, duplicate audit removed, environment status reconciled, evidence standard and release gate added |
| 2.1 | 2026-10-13 | Commit lists and CI run identifiers removed from this guide; pending register entries and status corrections listed by identifier |
