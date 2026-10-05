# Backend Development Troubleshooting Log

This document records the major technical problems encountered during development of the Flask backend, the troubleshooting process used to identify their causes, the solutions implemented, and the lessons learned.

The purpose of this document is to provide a development record and make future maintenance easier.

---

## 1. PowerShell Virtual Environment Activation

### Problem

The Python virtual environment could not initially be activated because PowerShell's execution policy prevented the activation script from running.

### Diagnosis

The problem was related to PowerShell script execution permissions rather than Python or the virtual environment itself.

### Solution

The execution policy was changed for the current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

The virtual environment could then be activated with:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Lesson Learned

PowerShell execution policies can prevent Python virtual-environment activation scripts from running. The `RemoteSigned` policy allows locally created scripts to run while maintaining restrictions on unsigned downloaded scripts.

---

## 2. PostgreSQL `psql` Command Not Recognized

### Problem

The `psql` command was initially not recognized in PowerShell.

### Diagnosis

PostgreSQL was installed, but the PostgreSQL `bin` directory was not available through the system PATH.

### Solution

The PostgreSQL installation was verified and the PostgreSQL command-line tools were made available. The connection was then tested with:

```powershell
psql -U expense_user -h localhost -d expense_management
```

The installed PostgreSQL version was verified successfully.

### Lesson Learned

When a command is not recognized, first determine whether the software is actually installed before assuming the installation failed. PATH configuration is a common cause of command-line tools not being found.

---

## 3. Database Connected but No Tables Were Found

### Problem

The application could connect to PostgreSQL, but querying the database showed:

```text
Did not find any relations.
```

### Diagnosis

The PostgreSQL database existed and the connection worked, but the database schema had not yet been created.

### Solution

The project's initial database migration was applied. The migration created the required tables:

- `users`
- `expense_categories`
- `expenses`
- `budgets`
- `monthly_expense_summary`

Indexes, foreign keys, unique constraints, and validation constraints were also created.

### Lesson Learned

A successful database connection does not mean that the database schema exists. Database connectivity and database initialization are separate steps.

---

## 4. Environment Variables and Secrets

### Problem

The Flask application required configuration values such as the database credentials and secret keys without exposing those values in source code.

### Diagnosis

Sensitive configuration should not be hard-coded into application files or committed to GitHub.

### Solution

A `.env` file was used for local development, while `.env.example` was created as a safe template.

The `.env` file contains local secrets and is excluded from Git through `.gitignore`.

The application loads environment variables using:

```python
from dotenv import load_dotenv

load_dotenv()
```

The database connection is constructed from PostgreSQL environment variables.

### Lesson Learned

Environment-specific configuration and secrets should be separated from application source code. Example configuration files should contain placeholders rather than real credentials.

---

## 5. Backend Project Structure and Nested Directory Problem

### Problem

A nested backend directory was accidentally created during development:

```text
backend/backend/routes/
```

This created confusion about where the actual application files belonged.

### Diagnosis

The project structure was inspected to identify the duplicate directory and determine which files belonged to the actual backend.

### Solution

The unnecessary nested `backend` directory was removed after confirming that the required files existed in the correct backend directory.

The intended structure is:

```text
backend/
├── models/
├── routes/
├── utils/
├── docs/
├── app.py
├── extensions.py
├── requirements.txt
└── README.md
```

### Lesson Learned

Project structure should be kept simple and consistent. Duplicate directories can cause incorrect imports, misplaced files, and confusion during deployment.

---

## 6. Authentication Implementation

### Problem

The backend required authentication so that users could register, log in, and access protected resources.

### Diagnosis

The application needed a secure authentication mechanism that did not store plain-text passwords.

### Solution

JWT-based authentication was implemented using Flask-JWT-Extended.

The backend provides:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Passwords are hashed before being stored in the database using Werkzeug password hashing utilities.

Protected endpoints require a valid JWT.

The application also provides consistent responses for:

- Missing authentication tokens
- Invalid authentication tokens
- Expired authentication tokens

### Lesson Learned

Authentication requires more than simply checking whether a user exists. Passwords must be securely hashed, protected endpoints must validate authentication tokens, and authentication failures should return appropriate HTTP status codes.

---

## 7. User Data Isolation

### Problem

Expense and budget data must belong to the authenticated user who created it.

### Diagnosis

The backend needed to prevent one authenticated user from accessing another user's expenses or budgets simply by changing a resource ID in the URL.

### Solution

Authenticated user IDs are obtained from the JWT.

Database queries for user-owned resources are restricted using the authenticated user's ID.

For example, expense queries filter by:

```python
Expense.user_id == user_id
```

This prevents users from directly accessing another user's private expense records through the API.

### Lesson Learned

Authentication and authorization are different concerns. A valid login does not automatically give a user permission to access every record in the database.

---

## 8. Password Security

### Problem

Storing user passwords directly in the database would create a serious security risk.

### Diagnosis

Passwords should never be stored as plain text.

### Solution

Passwords are hashed before being stored.

During login, the submitted password is compared against the stored password hash rather than comparing plain-text values.

The database therefore stores:

```text
password_hash
```

instead of the user's actual password.

### Lesson Learned

Password hashing protects user credentials if database contents are exposed. Application code should never need to retrieve a user's original password.

---

## 9. JWT Rate Limiting

### Problem

Authentication endpoints such as registration and login can be targeted by repeated requests.

### Diagnosis

Repeated authentication attempts can increase the risk of brute-force attacks and unnecessary server load.

### Solution

Rate limiting was implemented using Flask-Limiter.

The registration and login endpoints have request limits applied to them.

When the rate limit is exceeded, the API returns:

```text
HTTP 429 Too Many Requests
```

with a consistent JSON response.

### Lesson Learned

Authentication endpoints should be protected against excessive repeated requests. The current development configuration uses local in-memory rate-limit storage; a production deployment should use persistent/shared storage appropriate for multiple application instances.

---

## 10. Monetary Precision

### Problem

Financial values require accurate decimal representation.

### Diagnosis

Using binary floating-point values for money can introduce precision problems.

### Solution

The database stores monetary values using PostgreSQL:

```sql
NUMERIC(12, 2)
```

The backend also validates monetary values using Python's `Decimal` type.

Amounts must:

- Be greater than zero
- Contain no more than two decimal places

For example:

```text
1500.50
```

is accepted, while a value such as:

```text
1500.567
```

is rejected.

### Lesson Learned

Financial values should use decimal-based representations rather than relying on binary floating-point arithmetic.

---

## 11. Input Validation

### Problem

API clients can send invalid or incomplete data.

### Diagnosis

The backend must validate incoming request data before attempting database operations.

### Solution

Validation was added for important fields such as:

- Required fields
- Email format
- Password requirements
- Expense amount
- Budget amount
- Expense date
- Budget month
- Category IDs

Invalid input returns an appropriate HTTP 400 response instead of being silently accepted.

### Lesson Learned

Input validation should happen at the API boundary before data reaches the database.

---

## 12. Database Error Handling

### Problem

Database operations can fail because of constraint violations, invalid references, or unexpected database errors.

### Diagnosis

If a failed transaction is not rolled back, the database session can remain in a failed transaction state.

### Solution

Database operations that fail are rolled back using:

```python
db.session.rollback()
```

The API then returns an appropriate error response.

### Lesson Learned

Database transactions must be handled carefully. A failed transaction should be rolled back before the session is reused.

---

## 13. API Testing

### Problem

Building multiple API endpoints without testing them can allow errors to remain hidden until frontend integration.

### Diagnosis

The backend was tested incrementally after implementing each major feature.

### Solution

The following areas were tested:

- Health endpoint
- Database health
- User registration
- Duplicate registration
- Login
- Case-insensitive email handling
- Authenticated user information
- Missing JWT
- Invalid JWT
- Expired JWT
- Authentication rate limiting
- Category CRUD
- Expense CRUD
- Expense filtering
- CSV export
- Budget CRUD
- Duplicate budget prevention
- Monthly summaries
- Category summaries
- Monetary precision validation

Python source files were also checked using Python compilation tools to identify syntax errors.

### Lesson Learned

Testing during development makes it easier to identify the exact feature responsible for an error instead of debugging the entire application at once.

---

## 14. Git Branch Management

### Problem

Backend development needed to be completed without directly modifying the team's `main` branch.

### Diagnosis

Direct development on `main` could make collaboration and review more difficult.

### Solution

Backend development was performed on:

```text
backend-development
```

Changes were committed to the development branch and pushed to the remote repository.

The intended team workflow is:

```text
backend-development
        ↓
      Push
        ↓
Pull Request
        ↓
     Review
        ↓
      main
```

### Lesson Learned

Feature branches provide isolation during development and allow changes to be reviewed before they are merged into the main branch.

---

## 15. Summary

The backend development process involved more than writing Flask routes. It required configuring the development environment, connecting PostgreSQL, applying the database schema, implementing authentication, protecting user data, validating inputs, handling database errors, testing API behavior, and maintaining a clean Git workflow.

Documenting these problems and their solutions provides a useful reference for future development, debugging, maintenance, and deployment.