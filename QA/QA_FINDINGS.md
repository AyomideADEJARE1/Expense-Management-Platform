# QA Findings, Observations, Defects and Retests

Findings are evidence-based. QA is not judged by defect count.

## QA-FIND-001 — Duplicate frontend source structures
Classification: Observation. Status: Open.

The repository contains both a root-level React source structure and frontend/src. Docker builds ./frontend, making that tree the apparent containerized frontend. The role of the other tree should be clarified.

## QA-FIND-002 — README does not match the current integrated implementation
Classification: Documentation defect. Status: Open.

The README contains legacy frontend/localStorage-oriented descriptions, while the current implementation is an integrated React/Flask/PostgreSQL application with Docker/Nginx infrastructure.

Required action: update architecture, features, persistence, setup and deployment documentation.

## QA-FIND-003 — Dashboard budget data is not passed to all budget-dependent components
Classification: Confirmed implementation defect. Status: Open.

Budget data is loaded at application level and supplied to Dashboard, but Dashboard does not pass it into the budget-dependent SummaryCards and BudgetOverview components.

Required action: pass the loaded budget data into the affected components and retest.

## QA-FIND-004 — Expense search navigation uses an inconsistent tab identifier
Classification: Confirmed implementation defect. Status: Open.

Expense search navigation uses an inconsistent transactions tab identifier, so selecting an expense search result can fail to open Transactions.

Required action: correct the identifier and retest.

## QA-FIND-005 — Required date/category filtering is not exposed in the transaction workflow
Classification: Confirmed requirement gap. Status: Open.

The expense API supports filtering parameters, but the current transaction interface does not provide the corresponding required user controls. The Capstone requires filtering by date/category.

Required action: provide the required UI workflow and execute TC-FLT-001 and TC-FLT-002.

## QA-FIND-006 — CSV export is available at API level but not exposed as the required user workflow
Classification: Confirmed requirement gap. Status: Open.

An expense export endpoint exists in the backend, but the current UI does not provide the required CSV export action. A print action is not equivalent to CSV export.

Required action: expose CSV export and verify the downloaded file.

## QA-FIND-007 — Category authorization model requires clarification
Classification: Security/authorization observation. Status: Open.

Category routes do not follow the same authentication pattern used by protected expense/budget routes. This may be intentional for shared global categories. If categories are user-owned, authorization requires correction.

Required action: confirm the intended ownership model before classifying it as a confirmed security defect.

## QA-FIND-008 — Deployment workflow and reported AWS environment require reconciliation
Classification: DevOps observation. Status: Open.

Repository deployment configuration historically references Azure VM deployment, while the team reports AWS as the current deployment environment under the tutor's permitted alternative. Configuration and documentation should be reconciled with the actual environment.

This does not mean AWS has failed. Live verification is separately blocked while the instance is paused.

## QA-FIND-009 — Live deployment verification is currently blocked
Classification: Verification blocker. Status: Blocked.

The deployment instance is intentionally paused. Live URL, post-deployment health and deployed routing checks cannot be marked PASS or FAIL until the environment is restored.

## Retest rule
Resolved findings remain in this record. Record the fixing commit/PR, affected test, environment, evidence and result. Successful re-execution is recorded as RETEST PASS.

## Historical QA rule
Git history can reconstruct implementation history, but must not be presented as a functional test unless execution evidence exists.
