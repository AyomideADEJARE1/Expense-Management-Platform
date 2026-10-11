# Requirements Traceability Matrix

The Capstone requirements are the primary source. PASS is never inferred from code presence alone.

| ID | Requirement | Coverage | Current status |
|---|---|---|---|
| REQ-01 | User authentication | TC-AUTH-001–004 | PENDING |
| REQ-02 | Add expenses | TC-EXP-001 | PENDING |
| REQ-03 | Edit expenses | TC-EXP-002 | PENDING |
| REQ-04 | Delete expenses | TC-EXP-003 | PENDING |
| REQ-05 | Expense categories | TC-CAT-001–003 | OBSERVATION |
| REQ-06 | Monthly summaries | TC-REP-001 | PENDING |
| REQ-07 | Budget limits | TC-BUD-001–006, TC-DB-006 | PR #54 adds partial unique indexes for category and whole-month budgets, maps database uniqueness conflicts to HTTP 409, and tests the indexes/duplicate response. Fresh/existing database migration verification and CI for the latest commit are pending |
| REQ-08 | Dashboard with charts | TC-DASH-001–003 | FINDING OPEN |
| REQ-09 | Date/category filtering | TC-FLT-001–005 | Date-range/category UI and API corrections proposed in PR #54; CI and browser retest pending |
| REQ-10 | CSV export | TC-EXP-004–005 | UI correction proposed in PR #54; retest pending |
| REQ-11 | React frontend | TC-UI-001 | PENDING |
| REQ-12 | Flask REST API | TC-API-001–004 | PENDING |
| REQ-13 | PostgreSQL | TC-DB-001–003 | PENDING |
| REQ-14 | Docker Compose | TC-DEV-001–004 | PENDING |
| REQ-15 | GitHub Actions CI/CD | TC-CI-001–006 | CI checks and initial backend smoke tests pass on PR #54; full functional coverage remains incomplete |
| REQ-16 | Docker build/deployment | TC-CI-003, TC-CD-001–006, TC-DB-005–006 | Image build checks pass on the prior correction head; the budget uniqueness migration and its legacy-duplicate guard require the current CI result. Live AWS deployment and health verification remain pending |
| REQ-17 | Nginx reverse proxy | TC-DEV-004 | PENDING |
| REQ-18 | Health checks | TC-HLT-001–004, TC-CD-006–007 | Nginx database-health route and CD dual health gate proposed in PR #54; CI/live retest pending |
| REQ-19 | Secure environment variables | TC-SEC-001–004, TC-ENV-001 | Secret scanning exists; hard-coded Compose credentials and production signing-secret enforcement remain open |
| REQ-20 | Logs/monitoring | TC-MON-001–002 | PENDING |
| REQ-21 | Architecture documentation | TC-DOC-001 | PENDING |
| REQ-22 | Accurate README/setup | TC-DOC-002, TC-DOC-003, TC-ENV-001 | README correction proposed in PR #54; review pending |
| REQ-23 | Live URL | TC-CD-004 | URL is documented in README; current external availability and end-to-end function still require verification |

| REQ-24 | Approved cloud deployment target | TC-CD-001–006 | Decision recorded: project tutor approved AWS as an alternative, so AWS EC2 is the target for this audit. Verify successful deployment, public health routes, and the exact deployed commit/image before marking complete. |
| REQ-25 | Database credentials are externally configured | TC-SEC-001–004, TC-ENV-001–002 | Upstream main contains fixed Compose credentials; PR #54 replaces them with required root environment variables. CI and runtime verification of the correction are pending |

| REQ-26 | User-specific expense data isolation (security expectation for authenticated, user-specific expense records) | TC-SEC-007 | PENDING: regression test added to PR #54; CI rerun and broader authorization review required |


| REQ-27 | Category write authorization | TC-CAT-004–005 | FINDING OPEN: upstream main category POST/PUT/DELETE routes do not require authentication/authorization; the intended shared-category policy must be recorded and enforced |
| REQ-28 | Automated frontend functional coverage | TC-UI-001, TC-CI-004 | FINDING OPEN: frontend package has no test script, and CI's if-present test step can skip tests |
| REQ-29 | Reliable authentication rate limiting behind Nginx | TC-RL-001 | FINDING OPEN: proxy-aware client identity and shared production rate-limit storage require configuration and runtime proof |
| REQ-30 | Browser security headers | TC-SEC-005, TC-SEC-008–009 | Baseline headers exist in correction branch; CSP/HSTS configuration and public HTTPS verification remain pending |
| REQ-31 | Reproducible local setup | TC-ENV-001–002, TC-DOC-004 | Compose environment configuration and docs updated in PR #54; clean-checkout startup retest pending |

| REQ-32 | Budget spending is derived from recorded expenses | TC-BUD-005 | Correction proposed in PR #54 makes the spending field read-only; browser verification against expense records remains pending |

| REQ-33 | Prevent API tests from targeting non-test databases | TC-DB-007 | PR #54 adds an autouse guard that refuses a configured database name without a test/testing marker; CI and negative-configuration verification pending |

| REQ-34 | Category deletion reports accurate conflict/server errors | TC-CAT-006–007 | PR #54 distinguishes the known expense foreign-key conflict (409) from unexpected database failures (500); CI and runtime evidence pending |

| REQ-35 | Container build contexts exclude local secrets and host dependencies | TC-SEC-010, TC-CI-003 | PR #54 adds backend/frontend .dockerignore files and CI checks required patterns; latest CI result pending |
