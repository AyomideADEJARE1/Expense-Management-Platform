# QA Documentation — Expense Management Platform

This directory is the consolidated quality-assurance record for the Personal Expense Management Platform.

The QA process uses three sources of truth: the approved Capstone/customer specification for requirements; the repository, Git history, branches and pull requests for implementation/history; and executed test evidence for verification.

QA is not measured by defect count. PASS means tested with evidence. FAIL means tested and the expected result was not achieved. BLOCKED means a required environment or dependency was unavailable. PENDING means not yet executed. OBSERVATION means clarification is required before calling something a defect.

The upstream README documents a live URL, while earlier QA notes described the environment as paused. This audit has not obtained reliable live-runtime evidence, and the URL could not be fetched by the available web retrieval tool. Therefore, live checks remain PENDING rather than PASS or FAIL until a manual/runtime check is recorded.

## Branch and pull-request scope

The upstream repository's `main` branch is the target for both open pull requests. PR #53 adds the QA documentation package only. PR #54 proposes the application corrections, the professional root README, architecture/CI-CD documentation, and CI workflow updates. Both PRs use separate fork branches (`stephen/qa-findings-followup` and `stephen/qa-transaction-fixes`) so the QA record and application changes are not duplicated across the pull requests. Neither PR has been merged.

Deployment decision: the QA owner reports that the project tutor approved AWS as an alternative deployment target. AWS EC2 is the target used in this audit. This records the target choice; it does not prove that the latest code is deployed or that the public health checks and browser flows pass.

Start with TEAM_ACTION_SUMMARY.md for the plain-language action list, then use QA_FINDINGS.md and RUNTIME_VERIFICATION_PLAN.md for source evidence, required corrections, verification steps, and closure evidence.

Documents:
- TEAM_ACTION_SUMMARY.md — role-based team actions with impact, required correction, retest steps, and closure evidence.
- RUNTIME_VERIFICATION_PLAN.md — detailed runtime gates and evidence required before closure.
- TEST_PLAN.md — scope, method, environments, evidence and release criteria.
- REQUIREMENTS_TRACEABILITY.md — requirements mapped to verification coverage.
- TEST_CASES.md — functional, API, security, database, infrastructure, CI/CD and documentation tests.
- QA_FINDINGS.md — current findings, observations, requirement gaps, blockers and retest rules.
- RELEASE_CHECKLIST.md — final QA gate.

Historical reconstruction is kept separate from executed testing. Git history can establish that code changed; it does not by itself prove that a feature passed functional testing.


Latest CI checkpoint: PR #54 root README commit `425d435f08e1a11a0ca40060db8f285654ab54ad` passed all eight jobs in run `38421606402`. Architecture wording commit `0002b8a21e88e54917e7b6519ea07683d183001c` passed all eight jobs in run `38422688117`. The latest correction head `cf02398d63fa2a2fd920d131d88fda42974b2700` passed all nine jobs in run `38423587724`, including the Nginx image build/configuration test. PR #53 is documentation-only and requires a successful CI result for its exact latest head. Neither PR has been merged; no live AWS deployment acceptance is claimed.
