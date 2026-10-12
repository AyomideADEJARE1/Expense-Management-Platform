# Requirements Traceability Matrix

The Capstone requirements are the primary source. PASS is never inferred from code presence alone.

| ID | Requirement | Coverage | Current status |
|---|---|---|---|
| REQ-01 | User authentication | TC-AUTH-001–004 | PENDING |
| REQ-02 | Add expenses | TC-EXP-001 | PENDING |
| REQ-03 | Edit expenses | TC-EXP-002 | PENDING |
| REQ-04 | Delete expenses | TC-EXP-003 | PENDING |
| REQ-05 | Expense categories | TC-CAT-001–004 | Category create/update now validate the database's 100-character name limit before commit; new boundary tests are pending CI. Category endpoint authorization policy remains an open finding |
| REQ-06 | Monthly summaries | TC-REP-001, TC-REP-DATE-002 | Summary endpoints now validate canonical `YYYY-MM` values and new tests compare monthly/category totals to known expenses; current CI pending, browser/runtime verification remains open |
| REQ-07 | Budget limits | TC-BUD-001–006, TC-DB-006, TC-BUD-DATE-007, TC-BUD-UI-008 | PR #54 adds database uniqueness for category and whole-month budgets, known-conflict handling, and canonical month-date validation. New compact-date tests are pending CI. Confirm whether whole-month budgets must be creatable through the browser; populated-volume and concurrency checks remain open |
| REQ-08 | Dashboard with charts | TC-DASH-001–003 | FINDING OPEN |
| REQ-09 | Date/category filtering | TC-FLT-001–005, TC-FLT-MONTH-006, TC-FLT-TZ-007 | Expense month filters validate exact `YYYY-MM`; dashboard, transaction defaults, and Reports now use local-calendar handling for date-only values. Latest frontend CI/browser timezone retest pending |
| REQ-10 | CSV export | TC-EXP-004–005 | UI correction proposed in PR #54; retest pending |
| REQ-11 | React frontend | TC-UI-001, TC-UI-DEBUG-002 | PR #54 removes API-response debug logs for categories, expenses, and budgets. Frontend lint/build and browser smoke verification for the newest commit are pending |
| REQ-12 | Flask REST API | TC-API-001–004, TC-EXP-DATE-006 | Expense create/update now enforce canonical `YYYY-MM-DD` values; new compact-date regression tests are in PR #54. CI for the latest commit is pending; API runtime evidence remains required |
| REQ-13 | PostgreSQL | TC-DB-001–003 | PENDING |
| REQ-14 | Docker Compose | TC-DEV-001–004 | PENDING |
| REQ-15 | GitHub Actions CI/CD | TC-CI-001–006 | CI checks and initial backend smoke tests pass on PR #54; full functional coverage remains incomplete |
| REQ-16 | Docker build/deployment | TC-CI-003, TC-CD-001–006, TC-DB-005–006 | CI run 38179293397 passed migrations, Docker ignore-rule checks, and both image builds. Live AWS deployment, existing-volume upgrade, and public health verification remain pending |
| REQ-17 | Nginx reverse proxy | TC-DEV-004 | PENDING |
| REQ-18 | Health checks | TC-HLT-001–004, TC-CD-006–007 | Nginx database-health route and CD dual health gate proposed in PR #54; CI/live retest pending |
| REQ-19 | Secure environment variables | TC-SEC-001–004, TC-SEC-011, TC-ENV-001 | Compose credential correction and production signing-secret validation are proposed in PR #54; CI for the newest secret-validation commit is pending |
| REQ-20 | Logs/monitoring | TC-MON-001–002 | PENDING |
| REQ-21 | Architecture documentation | TC-DOC-001 | PENDING |
| REQ-22 | Accurate README/setup | TC-DOC-002, TC-DOC-003, TC-ENV-001 | README correction proposed in PR #54; review pending |
| REQ-23 | Live URL | TC-CD-004 | URL is documented in README; current external availability and end-to-end function still require verification |

| REQ-24 | Approved cloud deployment target | TC-CD-001–006 | Decision recorded: project tutor approved AWS as an alternative, so AWS EC2 is the target for this audit. Verify successful deployment, public health routes, and the exact deployed commit/image before marking complete. |
| REQ-25 | Database credentials are externally configured | TC-SEC-001–004, TC-ENV-001–002 | Upstream main contains fixed Compose credentials; PR #54 replaces them with required root environment variables. CI run 38179293397 passed Compose interpolation validation; a clean startup and AWS secret configuration check remain pending |

| REQ-26 | User-specific expense data isolation (security expectation for authenticated, user-specific expense records) | TC-SEC-007 | PENDING: regression test added to PR #54; CI rerun and broader authorization review required |


| REQ-27 | Category write authorization | TC-CAT-004–005 | FINDING OPEN: upstream main category POST/PUT/DELETE routes do not require authentication/authorization; the intended shared-category policy must be recorded and enforced |
| REQ-28 | Automated frontend functional coverage | TC-UI-001, TC-CI-004 | FINDING OPEN: frontend package has no test script, and CI's if-present test step can skip tests |
| REQ-29 | Reliable authentication rate limiting behind Nginx | TC-RL-001 | FINDING OPEN: proxy-aware client identity and shared production rate-limit storage require configuration and runtime proof |
| REQ-30 | Browser security headers | TC-SEC-005, TC-SEC-008–009 | Baseline headers exist in correction branch; CSP/HSTS configuration and public HTTPS verification remain pending |
| REQ-31 | Reproducible local setup | TC-ENV-001–002, TC-DOC-004 | Compose environment configuration and docs updated in PR #54; clean-checkout startup retest pending |

| REQ-32 | Budget spending is derived from recorded expenses | TC-BUD-005 | Correction proposed in PR #54 makes the spending field read-only; browser verification against expense records remains pending |

| REQ-33 | Prevent API tests from targeting non-test databases | TC-DB-007 | PR #54 adds an autouse guard that refuses a configured database name without a test/testing marker; CI run 38179504988 passed the guard with expense_management_test, while negative non-test configuration and cleanup verification remain pending |

| REQ-34 | Category deletion reports accurate conflict/server errors | TC-CAT-006–007 | PR #54 prechecks expense references, distinguishes the known expense foreign-key conflict (409) from unexpected failures (500), and adds a budget-reference guard. CI run 38212158351 passed all 35 backend tests including category-delete regression; AWS live runtime verification remains pending |

| REQ-35 | Container build contexts exclude local secrets and host dependencies | TC-SEC-010, TC-CI-003 | PR #54 adds backend/frontend .dockerignore files and CI checks required patterns; CI run 38179504988 passed the ignore-rule check, both image builds, and sentinel inspection; the backend image excluded /app/.env and the frontend bundle excluded VITE_SECRET_SENTINEL. This proves the test sentinels were excluded, not that an actual secret was leaked |

| REQ-36 | Database migrations complete before application restart | TC-CD-007 | PR #54 waits for PostgreSQL, applies migrations 002–005 before restarting application services, and checks this order in CI. Run 38212158351 passed; staging failure/recovery verification remains pending |

| REQ-37 | Wait for healthy PostgreSQL before migrations | TC-CD-008 | PR #54 uses Compose --wait and CI checks deployment ordering; run 38212158351 passed. Staging cold-start verification remains pending |

| REQ-38 | Category deletion preserves budget meaning | TC-CAT-008–009, RV-26 | PR #54 adds a linked-budget pre-check and migration 004 with `ON DELETE RESTRICT`; run 38213904072 passed the migration, constraint, and API tests. Fresh/existing AWS volume verification is pending |

| REQ-39 | Category create/update handle database commit failures safely | TC-CAT-010–011, RV-27 | PR #54 adds named-constraint conflict handling and rollback; CI run 38213904072 passed all 39 backend tests. AWS runtime retest remains pending |

| REQ-40 | Account email uniqueness conflicts are handled safely | TC-AUTH-012–013, RV-28 | PR #54 adds named-constraint handling and rollback tests; CI run 38213904072 passed all 39 backend tests. AWS runtime verification remains pending |

| REQ-41 | Production Flask/JWT signing secrets fail closed | TC-SEC-011, RV-06, RV-10 | PR #54 adds startup validation and tests for missing, weak, placeholder, or shared keys; CI run 38213904072 passed all 47 backend tests. AWS configuration verification remains pending |


## QA-FIND-059 trace — expense date format

The expense create/update routes now reject noncanonical ISO date strings by requiring the parsed date to round-trip exactly to the submitted `YYYY-MM-DD` value. The regression test expects compact `YYYYMMDD` dates to return HTTP 400 for create and update, and confirms the existing expense date remains unchanged after a rejected update. Latest CI for the correction branch is pending at the time this note was added; do not mark the trace as passed until that run completes.


## QA-FIND-060 trace — budget month format

Budget create/update now require the submitted month to parse as a date, be the first day of a month, and round-trip to the exact submitted `YYYY-MM-DD` value. Regression tests check that compact `YYYYMMDD` values return HTTP 400 for both create and update and that a rejected update preserves the stored month. CI run `38215898127` passed all eight jobs for commit `9b00f76863b48686bb5fe232926e20ee1d383eb0`, including budget compact-date rejection assertions. Live runtime/browser checks remain separate.


## QA-FIND-061 trace — whole-month budget UI scope

The API/database support a whole-month budget with `category_id = NULL`, but the browser form requires a category. The dashboard's current spending calculation also matches by category ID, so it would count no ordinary expenses for a null-category budget. This remains an observation until the team confirms whether the capstone requires overall monthly budgets. If required, the UI needs an explicit overall-budget option, a calculation that counts all same-month expenses for it, and browser/API tests; if not, the scope and documentation should state that budgets are category-specific.


## QA-FIND-062 trace — month query format and summary correctness

The expense list, monthly summary, and category summary now validate exact `YYYY-MM` input before parsing. Regression tests cover malformed values (`2026-1`, `2026-010`) and check summary totals against known expense data. CI run `38216409164` passed all eight jobs for commit `7c3eb3a08464ff9b97ce854f5a105383db8646cb`; Flake8 and all 48 backend tests passed, including the month-query/summary regression test. Live runtime/browser checks remain separate.


## QA-FIND-063 trace — category name length

The API now checks the 100-character category name limit on create and update before database commit. Regression tests cover oversized create/update values and verify that a rejected update leaves the stored name unchanged. CI for this latest correction is pending; do not mark the trace passed until the run completes.


## QA-FIND-043 trace — test database safety and repeatability

PR #54 now tightens the database-name guard, rejects names containing production/staging/live markers, truncates the test tables and resets identities after each API test, and runs the backend test suite twice consecutively. CI run `38217288387` passed all eight jobs for commit `52438ec387ed2c9bfaff56081930e6df317604dd`; both pytest runs collected and passed all 57 tests. This verifies the correction in CI. Keep the gate open if local or staging test database configuration differs from CI, and do not point tests at a shared live database.


## QA-FIND-064 trace — frontend response logging

The three `console.log` statements that printed the categories, expenses, and budgets API response objects have been removed from `frontend/src/App.jsx`. Current CI is pending; closure requires a passing frontend lint/build for the exact commit, source search confirming the response logs are absent, and browser evidence that the dashboard still loads.


## QA-FIND-065 trace — timezone-safe date handling

The dashboard month now uses local year/month fields; transaction defaults use a local-calendar date helper; Reports parses date-only API values as local midnight. This corrects the source-level UTC/local conversion mismatch. Frontend automated tests are not configured, so closure requires a passing frontend build plus browser verification at timezone/month boundaries with the timezone and local date recorded.


## QA-FIND-059 trace — canonical expense date validation

The API contract requires `YYYY-MM-DD`. PR #54 now checks that parsing and re-serializing an expense date returns exactly the submitted value on create and update. Regression tests reject compact and week-date forms on create and reject a compact date on update without changing the saved value. CI must pass for the exact commit containing these tests; date-range filter validation and AWS runtime behavior remain separate checks.


## QA-FIND-067 trace — Settings phone persistence

Settings previously displayed an editable phone number without a matching database field or API persistence. PR #54 adds migration 005, model/API/frontend support, validation tests, a CI schema assertion, and a deployment-order assertion. Passing CI proves the correction in the CI database only. Verify migration 005 against an existing AWS database and test save/reload behavior in the deployed browser before closing this item.


## QA-FIND-068 trace — notification delivery scope

The profile API stores notification preference flags, but the reviewed source tree did not reveal an email sender, notification scheduler/worker, or browser-push delivery path. The team must decide whether real delivery is in scope. Close only with a written scope decision and either tested staging delivery or clearly revised UI wording that does not promise active alerts.


## QA-FIND-069 trace — account currency semantics

The profile has one preferred currency, while expenses and budgets store numeric amounts without per-record currency. The frontend applies the selected symbol but does not convert saved values. The team must decide whether currency is display-only or supports conversion/mixed currencies. Closure requires written semantics, tests, and browser evidence that changing the preference cannot silently misrepresent historical amounts.


## QA-FIND-070 trace — budget alert threshold

Settings stores the budget_threshold preference, but the reviewed budget/dashboard components do not use it to trigger a warning; current budget status is based on the 100% limit. The team must confirm whether threshold alerts are required. Closure needs written rules and boundary/duplicate-prevention tests, or approved UI wording that makes clear the setting is inactive.


## QA-FIND-071 trace — AWS reboot recovery

PR #54 now adds `restart: unless-stopped` to all four Compose services. CI run `38221334646` passed and checked the resolved configuration. Verify the AWS host starts Docker on boot and that the stack recovers without manual commands, while preserving migration ordering. Closure requires an AWS staging reboot test, container/image evidence, public health checks, and proof that persisted database records survive.


## QA-FIND-072 trace — database backup and restore

The reviewed repository does not define a scheduled off-host backup or tested restore workflow for the PostgreSQL volume. AWS backups may be configured outside the repository, but evidence is required. Closure requires backup/retention configuration, a successful isolated restore, data-integrity checks, and proof that a pre-migration backup can be recovered.


## QA-FIND-073 trace — Proxy-aware rate limiting
Flask-Limiter currently keys requests by `get_remote_address`, while Flask is behind Nginx and has no trusted-proxy middleware; no shared rate-limit storage URI is configured. PR #54 needs a reviewed trusted-proxy boundary and approved shared store for production. Verify independent client quotas, spoofed-header resistance, restart behavior, and shared counters through the public AWS endpoint. CI/source inspection is not a substitute for the staging network test.
