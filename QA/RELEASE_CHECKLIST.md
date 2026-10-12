# QA Release Checklist

## Requirements
- [ ] Every Capstone requirement has a traceability entry.
- [ ] Every applicable test has a status.
- [ ] Every FAIL has a finding.
- [ ] Every fix has retest evidence.
- [ ] Release blockers have an explicit disposition.
- [ ] Blocked live tests are executed after deployment is restored.

## Functional
- [ ] Authentication and user isolation work.
- [ ] Expense create/edit/delete works.
- [ ] Categories work according to the confirmed ownership model.
- [ ] Monthly summaries are correct.
- [ ] Budgets work and reflect expenses.
- [ ] Dashboard totals/charts are correct.
- [ ] Date/month and category filtering work.
- [ ] Category write endpoints enforce the approved authentication/authorization model.
- [ ] CSV export produces the required file.

## Integration/infrastructure
- [ ] React → Nginx → Flask → PostgreSQL is verified.
- [ ] PostgreSQL persistence is verified.
- [ ] Docker Compose starts correctly.
- [ ] Nginx routing works.
- [ ] Health checks work.
- [ ] CI executes required checks.
- [ ] Required backend and frontend test suites actually collect and run.
- [ ] Docker images build.\n- [ ] Backend/frontend Docker build contexts exclude local environment files; frontend context excludes host node_modules.
- [ ] Compose image names match published GHCR tags.
- [ ] Public deployment health-check path matches Nginx routing.
- [ ] AWS deployment configuration matches the actual environment.
- [ ] Post-deployment health is verified.
- [ ] Live URL/IP is reachable.

## Security/documentation
- [ ] No real secrets are committed.
- [ ] Environment/secret configuration is verified, including required root Compose variables and separate Flask/JWT secrets.\n- [ ] Category write authorization matches the documented category policy.\n- [ ] Authentication rate limits are verified per client through Nginx and use shared production storage.\n- [ ] CSP is tested on the public HTTPS endpoint; HSTS is confirmed only if configured and observed.
- [ ] Password handling is verified.
- [ ] Logs and monitoring are available.
- [ ] Architecture documentation matches implementation.
- [ ] README matches current implementation and deployment.
- [ ] Clean-checkout environment setup is reproducible without committing real secrets.\n- [ ] README and Docker guide use the same host port and startup commands.\n- [ ] Frontend automated tests execute in CI and report a non-zero test count.

## QA decision
Decision: PENDING
Reviewed branch/commit:
Reviewer:
Date:
Evidence:

- [ ] Category deletion is blocked with HTTP 409 when any budget references that category; no budget category link or amount changes.
- [ ] Migration 004 enforces `ON DELETE RESTRICT` on fresh and existing databases.

- [ ] Category create/update return HTTP 409 only for the category-name unique constraint, return generic 500 for unexpected commit failures, roll back, and recover for the next valid request.
