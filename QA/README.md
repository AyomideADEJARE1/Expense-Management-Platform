# QA Documentation — Expense Management Platform

This directory is the consolidated quality-assurance record for the Personal Expense Management Platform.

The QA process uses three sources of truth: the approved Capstone/customer specification for requirements; the repository, Git history, branches and pull requests for implementation/history; and executed test evidence for verification.

QA is not measured by defect count. PASS means tested with evidence. FAIL means tested and the expected result was not achieved. BLOCKED means a required environment or dependency was unavailable. PENDING means not yet executed. OBSERVATION means clarification is required before calling something a defect.

The upstream README documents a live URL, while earlier QA notes described the environment as paused. This audit has not obtained reliable live-runtime evidence, and the URL could not be fetched by the available web retrieval tool. Therefore, live checks remain PENDING rather than PASS or FAIL until a manual/runtime check is recorded.

## Branch and pull-request scope

The upstream repository's `main` branch is reviewed separately from `integration/deployable-main`. PR #53 proposes QA documentation for upstream `main`; PR #54 proposes code corrections against `integration/deployable-main` because that branch contains integration-specific profile settings and migration 002. The fork's `stephen/qa-findings-followup` and `stephen/qa-transaction-fixes` branches are the working copies behind those unmerged pull requests. Neither PR has been merged.

Documents:
- TEST_PLAN.md — scope, method, environments, evidence and release criteria.
- REQUIREMENTS_TRACEABILITY.md — requirements mapped to verification coverage.
- TEST_CASES.md — functional, API, security, database, infrastructure, CI/CD and documentation tests.
- QA_FINDINGS.md — current findings, observations, requirement gaps, blockers and retest rules.
- RELEASE_CHECKLIST.md — final QA gate.

Historical reconstruction is kept separate from executed testing. Git history can establish that code changed; it does not by itself prove that a feature passed functional testing.
