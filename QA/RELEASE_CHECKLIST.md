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
- [ ] CSV export produces the required file.

## Integration/infrastructure
- [ ] React → Nginx → Flask → PostgreSQL is verified.
- [ ] PostgreSQL persistence is verified.
- [ ] Docker Compose starts correctly.
- [ ] Nginx routing works.
- [ ] Health checks work.
- [ ] CI executes required checks.
- [ ] Docker images build.
- [ ] AWS deployment configuration matches the actual environment.
- [ ] Post-deployment health is verified.
- [ ] Live URL/IP is reachable.

## Security/documentation
- [ ] No real secrets are committed.
- [ ] Environment/secret configuration is verified.
- [ ] Password handling is verified.
- [ ] Logs and monitoring are available.
- [ ] Architecture documentation matches implementation.
- [ ] README matches current implementation and deployment.

## QA decision
Decision: PENDING
Reviewed branch/commit:
Reviewer:
Date:
Evidence:
