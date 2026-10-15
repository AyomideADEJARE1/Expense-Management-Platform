# QA Test Plan

## Purpose
Determine whether the current Expense Management Platform satisfies the approved Capstone requirements and is ready for integration.

## Sources of truth
The Capstone/customer specification is the requirements source. The repository is the implementation source. Executed tests and retained evidence are the verification source.

Scope includes authentication, expense CRUD, categories, monthly summaries, budgets, dashboard charts, date/category filtering, CSV export, React, Flask REST API, PostgreSQL, Docker Compose, GitHub Actions, Docker image build/deployment, Nginx, health checks, secure environment variables, logs/monitoring, deployment and documentation.

## Evidence
A repository file proves implementation presence, not runtime correctness. Executed tests should record test ID, commit/branch, environment, steps, expected result, actual result, status and evidence. Historical Git evidence must not be presented as a test execution that did not occur.

## Environment
The team reports AWS as the current deployment environment. The instance is currently paused to conserve cloud credit and will be restored for final runtime verification. Cloud provider choice does not change the functional requirements, but repository deployment configuration must match the environment actually used.

## Status
PASS — executed successfully with evidence.
FAIL — executed and did not meet expectation.
BLOCKED — meaningful execution prevented by unavailable dependency/environment.
PENDING — planned but not yet executed.
OBSERVATION — requires clarification.
RETEST PASS — a previous failure/block passes after correction/re-execution.

## Release gate
QA recommends integration only after applicable requirements are tested, failed cases have findings, fixes are retested, blocked deployment checks are completed when available, and release-blocking issues have an explicit disposition.
