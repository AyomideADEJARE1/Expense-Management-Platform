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
| REQ-07 | Budget limits | TC-BUD-001–003 | PENDING |
| REQ-08 | Dashboard with charts | TC-DASH-001–003 | FINDING OPEN |
| REQ-09 | Date/category filtering | TC-FLT-001–003 | UI correction proposed in PR #54; retest pending |
| REQ-10 | CSV export | TC-EXP-004–005 | UI correction proposed in PR #54; retest pending |
| REQ-11 | React frontend | TC-UI-001 | PENDING |
| REQ-12 | Flask REST API | TC-API-001–004 | PENDING |
| REQ-13 | PostgreSQL | TC-DB-001–003 | PENDING |
| REQ-14 | Docker Compose | TC-DEV-001–004 | PENDING |
| REQ-15 | GitHub Actions CI/CD | TC-CI-001–005 | Partial CI passes observed; backend test suite still collects zero tests |
| REQ-16 | Docker build/deployment | TC-CI-003, TC-CD-001–006 | Configuration correction proposed in PR #54; full CI/deployment retest pending |
| REQ-17 | Nginx reverse proxy | TC-DEV-004 | PENDING |
| REQ-18 | Health checks | TC-HLT-001–003 | BLOCKED/PENDING for live checks |
| REQ-19 | Secure environment variables | TC-SEC-001–004 | PENDING |
| REQ-20 | Logs/monitoring | TC-MON-001–002 | PENDING |
| REQ-21 | Architecture documentation | TC-DOC-001 | PENDING |
| REQ-22 | Accurate README/setup | TC-DOC-002, TC-DOC-003, TC-ENV-001 | README correction proposed in PR #54; review pending |
| REQ-23 | Live URL | TC-CD-004 | BLOCKED until instance is restored |
