# QA Test Cases

Record date, commit/branch, environment, steps, expected result, actual result, evidence and status for every executed case.

## Authentication
| ID | Test | Expected |
|---|---|---|
| TC-AUTH-001 | Valid registration/login | Authentication succeeds and protected functionality is available |
| TC-AUTH-002 | Invalid credentials | Authentication is rejected safely |
| TC-AUTH-003 | Protected API without authentication | Request is rejected appropriately |
| TC-AUTH-004 | Cross-user access | Users cannot access another user's protected records |

## Expenses
| ID | Test | Expected |
|---|---|---|
| TC-EXP-001 | Create expense | Expense persists and displays |
| TC-EXP-002 | Edit expense | Updated values persist |
| TC-EXP-003 | Delete expense | Expense disappears from subsequent results |
| TC-EXP-004 | CSV export | User can download the required CSV data |

## Categories, budgets and reports
| ID | Test | Expected |
|---|---|---|
| TC-CAT-001 | Load categories | Categories load correctly |
| TC-CAT-002 | Manage categories | Management follows intended ownership model |
| TC-CAT-003 | Category authorization | Authorization matches approved data model |
| TC-BUD-001 | Create budget | Valid budget persists |
| TC-BUD-002 | Budget spending | Spending reflects relevant expenses |
| TC-BUD-003 | Invalid budget | Invalid input is rejected safely |
| TC-REP-001 | Monthly summary | Summary matches user/month data |

## Dashboard/filtering
| ID | Test | Expected |
|---|---|---|
| TC-DASH-001 | Dashboard totals | Totals match source data |
| TC-DASH-002 | Dashboard charts | Charts represent required data correctly |
| TC-DASH-003 | Budget/recent transaction display | Current data is displayed |
| TC-FLT-001 | Date/month filter | Results can be restricted by date/month |
| TC-FLT-002 | Category filter | Results can be restricted by category |

## API/database/integration
| ID | Test | Expected |
|---|---|---|
| TC-API-001 | Successful API request | Correct status/response |
| TC-API-002 | Invalid payload | Safe validation response |
| TC-API-003 | Authentication enforcement | Protected routes reject unauthenticated requests |
| TC-API-004 | Authorization enforcement | User data cannot cross ownership boundaries |
| TC-DB-001 | Database initialization | PostgreSQL schema initializes |
| TC-DB-002 | Database connection | Flask connects to PostgreSQL |
| TC-DB-003 | Persistence | Data survives expected restart |

## Infrastructure/security
| ID | Test | Expected |
|---|---|---|
| TC-DEV-001 | Compose startup | Stack starts correctly |
| TC-DEV-002 | Dependency readiness | Dependencies become ready before dependents |
| TC-DEV-003 | Container health | Healthchecks reflect service state |
| TC-DEV-004 | Nginx routing | Frontend and API routes work |
| TC-HLT-001 | Backend health | Health endpoint works |
| TC-HLT-002 | Database health | DB health reflects connectivity |
| TC-HLT-003 | Routed health | Nginx reaches backend health |
| TC-SEC-001 | Secret exposure | No real secrets committed |
| TC-SEC-002 | Secret scanning | Required scan passes |
| TC-SEC-003 | Password storage | Passwords are securely hashed |
| TC-SEC-004 | Runtime secrets | Secrets use approved configuration |
| TC-MON-001 | Logs | Useful logs are available |
| TC-MON-002 | Monitoring | Service health can be assessed |

## CI/CD/deployment
| ID | Test | Expected |
|---|---|---|
| TC-CI-001 | CI triggers | Required validation executes |
| TC-CI-002 | CI failure handling | Failing checks are visible |
| TC-CI-003 | Docker build | Required images build |
| TC-CD-001 | Image publication | Tested revision is published |
| TC-CD-002 | Deployment | Intended AWS deployment receives tested release |
| TC-CD-003 | Post-deployment health | Live deployment passes health checks |
| TC-CD-004 | Live URL/IP | Endpoint is reachable |

## Documentation
| ID | Test | Expected |
|---|---|---|
| TC-DOC-001 | Architecture docs | Documentation matches implementation |
| TC-DOC-002 | README | Setup/features/persistence/deployment match implementation |
