# QA Documentation — Expense Tracker

| Field | Value |
|---|---|
| Document | QA reading guide and governance for the Expense Tracker QA record |
| Version | 2.0 |
| Date | 2026-10-13 |
| Repository | `AyomideADEJARE1/Expense-Management-Platform` (`main`) |
| Continues | PR #43, `docs: add current QA documentation package`, merged 2026-10-10 into the `qa-documentation` branch |
| This change | PR #53 (`stephen/qa-findings-followup`) |
| Corrections | PR #54 (`stephen/qa-transaction-fixes`) |
| Register | [QA_FINDINGS.md](QA_FINDINGS.md), the single findings register |

## 1. Purpose

This directory is the quality-assurance record for the Expense Tracker capstone project. It records what was tested, what was found, what has been corrected, and what still needs verification, so that a reviewer can decide whether the release is ready.

The record must answer three questions for every finding: what is wrong, how it was established, and what evidence shows it is fixed.

## 2. Relationship to PR #43

PR #43 introduced the QA package on the `qa-documentation` branch. It established the status terms, the baseline findings QA-FIND-001 to QA-FIND-009, and the retest rule. This document keeps those rules and extends them. Nothing from PR #43 has been removed from the register.

This version makes three changes to the PR #43 model:

- **One register.** `QA_FINDINGS.md` is the only place findings are recorded. A separate audit file would duplicate it, so the upstream-main audit (`MAIN_REPOSITORY_AUDIT.md`, first drafted in this PR) has been removed. Its items are mapped to register IDs in section 14.
- **Reconciled environment status.** PR #43 recorded that the production instance was paused. The repository's README described the site as live. This version states both, and treats the live status as unverified until someone records a check (section 6).
- **Evidence rules and release gate.** Section 11 says what counts as evidence, and section 13 says what must be true before release.

## 3. Scope

**System under test:** the Expense Tracker application at the state of `main` (`77497a5`), and the corrections on PR #54.

| Component | Location | Role |
|---|---|---|
| React frontend | `frontend/` | User interface, built and served by its own container |
| Flask API | `backend/` | Authentication, expenses, categories, budgets, summaries, CSV export, health endpoints |
| PostgreSQL 16 | `database/migrations/` | Persistent data, applied as ordered migrations |
| Nginx | `nginx/` | Single public entry point and reverse proxy |
| Docker Compose | `docker-compose.yml` | Local and integration stack |
| CI/CD | `.github/workflows/` | Checks on every pull request, image publishing, and AWS EC2 deployment |
| AWS EC2 | Deployment target | Approved deployment target (QA-FIND-008) |

**Out of scope for this record:** browser end-to-end automation, load testing, and third-party services outside the repository (Cloudflare configuration, registry policy). These appear in the runtime plan where they are needed.

## 4. Sources of truth

1. **Requirements:** the approved capstone specification, including the DevOps requirements and the common requirements for architecture, source control, CI/CD, security, monitoring, and documentation.
2. **Implementation and history:** the repository, its branches, and its pull requests. Git history shows that code changed. It does not prove that a feature works.
3. **Executed evidence:** test runs, CI results recorded against a named commit, and runtime checks recorded with a date and result.

## 5. Status terms

These terms are used throughout the register. They are defined as in PR #43, with the terms added in this version marked.

| Term | Meaning |
|---|---|
| PASS | Tested, with evidence, and the expected result was achieved |
| FAIL | Tested, and the expected result was not achieved |
| BLOCKED | A required environment or dependency was unavailable |
| PENDING | Not yet executed |
| OBSERVATION | Clarification is needed before the item is called a defect |
| Confirmed defect | Shown in the code or configuration. Not yet proven at runtime (added in v2.0) |
| Corrected on PR #54 | A correction exists on the PR #54 branch. Source-verified (the file was read), and CI-verified when a CI check asserts the behavior (added in v2.0) |
| Retest PASS / FAIL | A retest was executed after a correction and recorded against a named commit or environment (PR #43 retest rule) |
| Runtime verification required | The correction cannot be proven from source. A live, browser, or staging check must be recorded (added in v2.0) |

A corrected finding is not closed until its retest is recorded. A CI pass on a commit is evidence for that commit only.

## 6. Environment status (reconciled)

| Item | Recorded status | Evidence required |
|---|---|---|
| Production instance on AWS EC2 | PR #43 baseline: paused to conserve cloud credit. Upstream README: described as live | A dated check of the current instance, with the commit or image it runs |
| Public URL `https://expense-tracker.live` | Documented. Not verified in this review (the URL could not be fetched) | `/api/health` and `/api/health/db` responses, with date and time |
| Deployed version | Not recorded | Commit SHA or image digest reported by the running application or host |
| Browser journeys | Not executed against the live environment | Test run record |

Until the first row is resolved, no live result is recorded as PASS or FAIL. The environment status is tracked as QA-FIND-009. Documentation that says the site is live must say that the status is pending verification.

## 7. Severity and priority

Each finding has a classification and a priority. Priority decides the order of work. Severity describes the impact if the finding is real.

| Priority | Meaning |
|---|---|
| High | Financial data integrity, security exposure, a deployment that can fail or lose data, or a missing capstone requirement |
| Medium | A correctness, usability, or operational gap with a workaround |
| Low | Documentation, cosmetic, or hygiene issues with no user-visible failure |

Where a register entry gives a range (for example Medium–High), use the higher value when planning work.

## 8. Finding identifiers

- **QA-FIND-nnn** is the identifier for every finding. Numbers are never reused. A retired identifier stays in the register with a note.
- New findings take the next free number. The last number used in the register is QA-FIND-089. The next free numbers are QA-FIND-090 and above.
- Identifiers from the earlier upstream-main audit (MAIN-nnn) are retired. Section 14 maps each one to its register entry.
- Titles and classifications are not changed when a finding is corrected. The status and the evidence are updated instead.

## 9. Finding lifecycle

1. **Open:** the finding is recorded with its evidence, classification, and priority.
2. **Corrected on PR #54:** a correction exists on the named branch and commit. The register records the commit.
3. **Retest pending:** the retest is planned, with its steps and environment.
4. **Retest PASS or FAIL:** the retest is executed and recorded with the commit, environment, and result.
5. **Closed:** a retest PASS is recorded, and no related runtime gate remains open.

A finding can also be **Open – decision** (a product or policy decision is needed) or **Delegated** (a team role owns the action). Those states do not count as corrected.

## 10. Retest rule

Resolved findings remain in the register. Each retest records the fixing commit or PR, the affected test, the environment, the evidence, and the result. A successful re-execution is recorded as RETEST PASS. A retest that fails reopens the finding.

## 11. Evidence standard

- **Source evidence** is a file path, a line or configuration key, and the branch and commit read. It shows that a defect exists or that a correction is present.
- **CI evidence** is a run ID, the commit it ran against, and the job results. It shows that the checks passed for that commit. It does not show runtime behavior.
- **Runtime evidence** is a command or test, its output, the date, the environment, and the commit or image tested. Screenshots and logs must not contain secrets, passwords, or real user financial data.
- **Documentation claims** are checked against the code they describe. A document that describes behavior the code does not have is a defect.

Do not record a result as PASS on source evidence alone. Do not describe a feature as deployed unless deployment evidence exists.

## 12. Historical reconstruction

Git history can reconstruct implementation history. It must not be presented as a functional test unless execution evidence exists.

## 13. Release gate

A release is ready only when all of the following are true, with evidence recorded:

1. The register has no open High-priority finding, unless the finding has an approved decision recorded.
2. The corrections for the findings in the release are merged, and their retests are recorded.
3. CI passes on the exact commit to be released, and the `ci-success` check is required on `main`.
4. The live environment is verified: the deployed commit, both public health endpoints, and the main browser journeys (section 6).
5. A database migration has been tested on a populated copy, and a backup has been restored (QA-FIND-072).
6. Monitoring is configured and an alert has been tested end to end (QA-FIND-093).
7. The AWS account matches `docs/aws-iam.md` (QA-FIND-092).
8. Product decisions recorded in the register (categories, password policy, notifications, currency, budget threshold) are made and documented.

The full checklist is in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## 14. Retired audit identifiers

The upstream-main audit drafted in this PR used MAIN identifiers. Each one is retired, and its work is recorded under the register entry below.

| Retired ID | Register entry | Status |
|---|---|---|
| MAIN-001 | QA-FIND-023 (Nginx `/api/health/db` route) | Corrected on PR #54; runtime verification required |
| MAIN-002 | QA-FIND-008, QA-FIND-021 (Azure deploy job replaced by AWS) | Corrected on PR #54 |
| MAIN-003 | QA-FIND-022 (hardcoded database credentials) | Corrected on PR #54; rotation evidence pending |
| MAIN-004 | QA-FIND-018 (CSV formula injection) | Corrected on PR #54; spreadsheet retest pending |
| MAIN-005 | QA-FIND-030 (budget uniqueness) | Corrected on PR #54; populated-volume test pending |
| MAIN-006 | QA-FIND-056 (category delete changes budget meaning) | Corrected on PR #54; populated-volume test pending |
| MAIN-007 | QA-FIND-011, QA-FIND-088 (missing tests, CI passing without tests) | Corrected on PR #54; CI-verified |
| MAIN-008 | QA-FIND-036 (JWT secret ignored); QA-FIND-027 (weak secret not rejected) | Corrected on PR #54; CI-verified |
| MAIN-009 | QA-FIND-028 (port setting ignored) | Corrected on PR #54; non-default port test pending |
| MAIN-010 | QA-FIND-084 (debugger enabled on direct run) | Corrected on PR #54 |
| MAIN-011 | QA-FIND-019 (non-finite or oversized amounts) | Corrected on PR #54; update-path coverage pending |
| MAIN-012 | QA-FIND-001 (duplicate frontend) | Corrected on PR #54: root build files and the root `src/` and `public/` folders removed |
| MAIN-013 | QA-FIND-024, QA-FIND-041 (migrations not applied to existing databases) | Corrected on PR #54; populated-volume test pending |
| MAIN-014 | QA-FIND-023 (health check does not check the database) | Corrected on PR #54; runtime retest pending |
| MAIN-015 | QA-FIND-089 (Nginx image not rebuilt or tested) | Corrected on PR #54; CI-verified |
| MAIN-016 | QA-FIND-073 (rate limiting in memory) | Partly corrected on PR #54; shared storage is an open decision |
| MAIN-017 | QA-FIND-049 (port 8080 in documentation) | Corrected on PR #54 |
| MAIN-018 | QA-FIND-021 (Azure described as legacy but still deployed) | Corrected on PR #54 |
| MAIN-019 | QA-FIND-087 (repository About description) | Open. Requires a repository administrator |
| MAIN-020 | QA-FIND-009 (live verification) | Open, pending |
| MAIN-021 | QA-FIND-090 (new, below) | Open on PR #54 |
| MAIN-022 | QA-FIND-091 (new, below) | Corrected on PR #54 |
| MAIN-023 | QA-FIND-010 (category authorization and ownership) | Partly corrected on PR #54; ownership decision open |
| MAIN-024 | QA-FIND-080 (Docker setup documentation) and QA-FIND-049 | Corrected on PR #54 |
| MAIN-025 | QA-FIND-049 (Nginx and port documentation) | Corrected on PR #54 |
| MAIN-026 | QA-FIND-094 (new, below) | Corrected on PR #54 |
| MAIN-027 | QA-FIND-092 (new, below) | Documented on PR #54; live verification pending |
| MAIN-028 | QA-FIND-093 (new, below) | Partly corrected on PR #54; alerting open |
| MAIN-029 | QA-FIND-002 (README does not describe the implementation) | Corrected on PR #54 |
| MAIN-030 | QA-FIND-002 (README objectives) | Corrected on PR #54 |
| MAIN-031 | QA-FIND-097 (new, below) | Delegated to the team lead |
| MAIN-032 | QA-FIND-098 (new, below) | Delegated to a team member |
| MAIN-033 | QA-FIND-014, QA-FIND-022 (security guide listed the retired password) | Corrected on PR #54 |
| MAIN-034 | QA-FIND-095 (new, below) | Corrected on PR #54 |

## 15. New register entries and status corrections (pending register rewrite)

The register `QA_FINDINGS.md` is too large to rewrite in one edit. The entries below are recorded here until they are moved into the register. Each one follows the register's format and must be copied across, with its identifier, before the register is next rewritten.

**QA-FIND-090 — The CD deploy job hardcodes the image owner**
Classification: Deployment configuration defect. Priority: High (a fork run pulls the upstream owner's images). Status: Open on PR #54.
Evidence: `.github/workflows/cd.yml`, deploy step, `repo_lower=` line, which contains the literal `AyomideADEJARE1/Expense-Management-Platform`. The workflow's publish job already uses `GITHUB_REPOSITORY`.
Required correction: replace the literal with `${{ github.repository }}`. The change is in a workflow file, so it must be made in the GitHub web editor on `stephen/qa-transaction-fixes` or by an account with workflow permission.
Retest: a workflow run from the fork shows the fork's image names in the deploy log.

**QA-FIND-091 — The backend container runs as root**
Classification: Container security. Priority: Medium. Status: Corrected on PR #54 (`1b8af8a`).
Evidence: `backend/Dockerfile` on `main` has no `USER` instruction.
Correction: a dedicated unprivileged user runs gunicorn.
Retest: `docker exec expense-backend id -u` returns a non-zero value on the built image.

**QA-FIND-092 — AWS IAM roles, policies, and access are not documented**
Classification: Capstone requirement gap (cloud IAM permissions). Priority: High. Status: Documented on PR #54 (`docs/aws-iam.md`, `b75b35f`); live account verification pending.
Evidence: no IAM document exists in the repository. The application makes no AWS calls (`backend/requirements.txt` contains no AWS SDK), and CI holds no AWS credentials.
Retest: the live AWS account matches the document: root MFA enabled and no root access keys, instance role policies as listed, security-group rules as listed, and CloudTrail active.

**QA-FIND-093 — Monitoring is partial**
Classification: Capstone requirement gap (monitoring). Priority: High. Status: Partly corrected on PR #54 (log rotation `0a99243`; host probe `6c4f8f6`; `docs/monitoring.md` `4c23da9`). Open: scheduled probing with alerting, external uptime monitoring, centralized logs, and host metrics.
Evidence: health endpoints and container health checks exist, but no scheduled check, alert, centralized log collection, or host metrics were found in the repository.
Retest: a deliberate backend stop produces an alert within the monitor's interval, and the alert clears after recovery. Record the date and the alert channel.

**QA-FIND-094 — Duplicate schema copy**
Classification: Documentation and maintenance hygiene. Priority: Low. Status: Corrected on PR #54 (`1d1000f`).
Evidence: `database/schema/schema.sql` was an unreferenced copy of migration 001 (same size, 3,082 bytes).
Correction: removed. `database/migrations/` is the single schema source.

**QA-FIND-095 — CONTRIBUTING.md is out of date**
Classification: Documentation defect. Priority: Low. Status: Corrected on PR #54 (`a868989`).
Evidence: the file gave port 8080 twice, used the retired database account and database name, and said the frontend has no test script.
Correction: rewritten to match the CI workflow, the branches, and the current stack.

**QA-FIND-096 — Status correction: legacy frontend removed**
QA-FIND-001 is corrected on PR #54. The root build files and the root `src/` and `public/` folders (29 files) are removed. Two legacy-only income files were removed as well, because income is not part of the capstone requirements. The status moves from Open to Corrected on PR #54; the retest is to confirm that no root `src/` or `public/` folder exists on the merged `main`.

**QA-FIND-097 — Team member names missing from the submission record**
Classification: Capstone submission requirement. Priority: Medium. Status: Delegated to the team lead.
Evidence: the repository and QA record do not name the team members. Names must come from the team, not from this record.

**QA-FIND-098 — Architecture diagram not verified against the implementation**
Classification: Verification gap (documentation evidence). Priority: Low–Medium. Status: Delegated to a team member.
Evidence: the diagram `docs/Expense Platform System Architecture.png` could not be opened in this review. The text architecture in `docs/architecture.md` and `docs/docker.md` matches the Compose file.
Retest: a team member compares the diagram with the running topology and records any difference.

**Status corrections to existing entries**

| Entry | Correction | Reason |
|---|---|---|
| QA-FIND-003 | The register says a source correction is present. The upstream `main` `frontend/src/pages/Dashboard.jsx` still renders the budget components without budget data. This review did not confirm a correction on PR #54. Status: Open until a PR #54 correction is shown | Conflicts with the source read on `main` |
| QA-FIND-004, 005, 006 | Not verified in this review. Their current status is as the register states, and each needs its retest | No source or browser check was performed here |
| QA-FIND-022 | Add: PR #54 also removes the development password from `docs/security.md` (`867318d`) | Documentation still listed the retired password |
| QA-FIND-040 | Still open. The CD workflow on PR #54 pushes a `latest` tag as well as the commit-specific tag | Mutable tags remain available |
| QA-FIND-087 | Still open. Requires a repository administrator | No change |

## 16. CI evidence

A CI pass is recorded against the commit it ran on. The recorded results are in the register. The commits added to PR #54 for this record (`1b8af8a`, `1d1000f`, `8c2483a`, `723c7e1`, `4e88259`, `228ef20`, `0a99243`, `6c4f8f6`, `4c23da9`, `b75b35f`, `867318d`, `a868989`, and the legacy-removal commits) have CI runs that were queued when last checked. Their results are not recorded here. Read the CI tab of PR #54 for the current result, and record it in the register before any of those corrections is described as verified.

## 17. Document index

| Document | Purpose |
|---|---|
| `README.md` | This guide: purpose, status terms, environment status, rules, and the release gate |
| `QA_FINDINGS.md` | The single findings register |
| `TEAM_ACTION_SUMMARY.md` | Role-based actions for each open finding, with retest steps and closure evidence |
| `RUNTIME_VERIFICATION_PLAN.md` | Runtime gates and the evidence each one requires |
| `TEST_PLAN.md` | Scope, method, environments, evidence, and release criteria |
| `REQUIREMENTS_TRACEABILITY.md` | Capstone requirements mapped to tests and findings |
| `TEST_CASES.md` | Functional, API, security, database, infrastructure, CI/CD, and documentation tests |
| `RELEASE_CHECKLIST.md` | The final QA gate |

## 18. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-10 | Baseline QA package, merged through PR #43 |
| 2.0 | 2026-10-13 | Continuation through PR #53. Register extended from QA-FIND-089. Upstream-main audit reconciled to register IDs and removed as a duplicate. Environment status reconciled. Evidence standard and release gate added. Corrections recorded on PR #54 |
