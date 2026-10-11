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


## Additional tests from source review
| ID | Test | Expected |
|---|---|---|
| TC-CAT-004 | POST/PUT/DELETE category without token | Request is rejected; no category data changes |
| TC-FLT-003 | Combine month and category filters | Only records matching both selected filters are shown |
| TC-EXP-005 | Export filtered transaction list | CSV downloads with correct headers and only the intended records |
| TC-CI-004 | CI test collection | Required backend/frontend test suites execute; missing suites cannot silently count as a full test pass |
| TC-CD-005 | Published image deployment | VM pulls the exact GHCR image tags built from the tested commit |
| TC-CD-006 | Public health route | Deployment health check uses the correct Nginx-routed endpoint and succeeds |
| TC-ENV-001 | Clean checkout startup | Documented env-file setup is sufficient for Compose startup without committing real secrets |
| TC-DOC-003 | README implementation accuracy | README paths, persistence model, setup, health route and deployment status match the integrated code |

| TC-CI-005 | Frontend lint and dependency audit | ESLint completes with no errors; dependency audit findings are identified and dispositioned |
| TC-CI-006 | Backend pytest collection | At least the committed API smoke tests are collected and pass |
| TC-API-005 | Health endpoint smoke test | `/health` returns HTTP 200 and `{\"status\":\"ok\"}` |
| TC-AUTH-005 | Registration → login → own expenses | A new user can register, receive a token, and access only their authenticated expense list |

| TC-SEC-CSV-001 | Export description beginning with spreadsheet formula | CSV text cell is neutralized and does not execute as a formula |
| TC-SEC-CSV-002 | Export formula preceded by whitespace | CSV text cell is neutralized after leading whitespace |
| TC-VAL-001 | Create expense with NaN or Infinity amount | API returns HTTP 400; no database write occurs |
| TC-VAL-002 | Create/update category with non-string name or description | API returns HTTP 400 rather than an unhandled server error |
| TC-VAL-003 | Create/update expense or budget above supported numeric precision | API returns HTTP 400 rather than a database error |

| TC-DB-004 | Fresh database initialization | All required columns from migrations 001 and 002 exist after Compose startup |
| TC-DB-005 | Existing persistent database upgrade | Idempotent user-settings migration adds missing columns without rerunning initial schema |

| TC-AUTH-006 | Registration/login with numeric, list, or object fields | API returns HTTP 400 without an unhandled server error |
| TC-AUTH-007 | Profile update with non-string name/currency | API returns HTTP 400 and profile data remains unchanged |

| TC-VAL-004 | Expense/budget with invalid category ID type | API returns HTTP 400 and no record is created |

| TC-AUTH-008 | Registration with malformed email or overlong name | API returns HTTP 400 and no user record is created |

| TC-API-006 | Independent endpoint tests under test configuration | Ordinary API tests are not affected by shared rate-limit state; rate limiting has separate dedicated coverage |

| TC-BUD-004 | Duplicate budget creation under concurrent requests | Database prevents duplicate budgets for the same user/month/category, including NULL category |

| TC-CI-007 | Empty backend test suite | CI fails if pytest collects zero tests |

| TC-HLT-004 | Database health through Nginx | `/api/health/db` reaches Flask `/health/db` and reports DB connectivity |
| TC-CD-007 | Post-deployment health gate | CD fails unless both application and database health checks pass |

| TC-FLT-004 | Filter by inclusive start/end dates | Only authenticated user's expenses inside the selected date range are returned/exported |
| TC-FLT-005 | Reversed or malformed date range | API returns HTTP 400 with a controlled validation response |

| TC-VAL-005 | Non-object JSON request body | Write endpoints return HTTP 400 instead of an unhandled server error |

| TC-HLT-005 | Database health probe failure and recovery | Probe returns 500 while DB is unavailable, rolls back the failed session, then returns healthy after recovery |

| TC-SEC-005 | Nginx security response headers | Frontend/API responses include the configured baseline security headers |
