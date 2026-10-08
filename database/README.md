# Database

PostgreSQL database layer for the Expense Management Platform.

The application uses **PostgreSQL 16** as its relational database and runs PostgreSQL through Docker Compose during local application development and integration testing.

---

## Database Configuration

The current Docker Compose configuration is:

| Setting | Value |
|---|---|
| Database | `expense_db` |
| User | `expense_user` |
| Host | `postgres` |
| Port | `5432` |
| PostgreSQL Version | 16 |

The hostname `postgres` is the Docker Compose service name and is used by the Flask backend to connect to PostgreSQL.

The database is not exposed directly to the host by the current Docker Compose configuration. Other containers communicate with PostgreSQL over the Docker Compose network.

---

## Database Schema

The database contains the following tables:

- `users` — application users
- `expense_categories` — available expense categories
- `expenses` — individual user expenses
- `budgets` — user budget allocations
- `monthly_expense_summary` — monthly expense totals

### Relationships

```text
users
  │
  ├──< expenses >── expense_categories
  │
  ├──< budgets
  │
  └──< monthly_expense_summary
```

---

## Initial Migration

The initial database migration is:

```text
database/migrations/001_initial_schema.sql
```

Docker Compose mounts this file into PostgreSQL's initialization directory:

```text
/docker-entrypoint-initdb.d/001_initial_schema.sql
```

When PostgreSQL starts with a **new database volume**, the official PostgreSQL image automatically executes the SQL file during database initialization.

This means the initial schema does not normally need to be applied manually when using the project's Docker Compose setup.

---

## Starting the Database

From the project root:

```bash
docker compose up -d postgres
```

Check the PostgreSQL service:

```bash
docker compose ps postgres
```

The PostgreSQL health check uses:

```text
pg_isready -U expense_user -d expense_db
```

The database should report as healthy before the backend attempts to connect.

---

## Recreating the Development Database

To completely recreate the local development database from the initial migration:

```bash
docker compose down -v
docker compose up --build -d
```

> **Warning:** `docker compose down -v` removes the `postgres_data` Docker volume and permanently deletes the existing local database data.

The migration in:

```text
database/migrations/001_initial_schema.sql
```

will then be executed automatically when the new PostgreSQL volume is initialized.

---

## Verifying the Database

List the running services:

```bash
docker compose ps
```

You can verify the database tables directly inside the PostgreSQL container:

```bash
docker exec expense-postgres \
  psql -U expense_user -d expense_db -c "\dt"
```

Expected tables include:

```text
budgets
expense_categories
expenses
monthly_expense_summary
users
```

### Test Database Connectivity from the Backend

The backend can also verify the PostgreSQL connection using SQLAlchemy:

```bash
docker exec expense-backend \
  python -c "from app import app, db; app.app_context().push(); db.session.execute(db.text('SELECT 1')); print('Database connection: OK')"
```

A successful connection prints:

```text
Database connection: OK
```

---

## Database Health Endpoint

The Flask backend provides a database health endpoint:

```text
GET /health/db
```

When accessed through Nginx:

```text
GET /api/health/db
```

Example:

```bash
curl http://localhost:8080/api/health/db
```

A healthy database should return:

```json
{
    "status": "ok",
    "database": "connected"
}
```

---

## Schema Reference

The repository also contains:

```text
database/schema/schema.sql
```

The migration and schema reference serve different purposes:

| File | Purpose |
|---|---|
| `database/migrations/001_initial_schema.sql` | Executable initial database migration |
| `database/schema/schema.sql` | Schema reference/documentation |

When making database changes, the executable migration should remain consistent with the application's expected schema.

---

## Manual PostgreSQL Access

Although Docker Compose is the recommended development setup, PostgreSQL can be accessed directly from inside the database container.

Open a PostgreSQL shell:

```bash
docker exec -it expense-postgres \
  psql -U expense_user -d expense_db
```

Then list the tables:

```sql
\dt
```

Exit PostgreSQL with:

```sql
\q
```

---

## Database Persistence

PostgreSQL data is persisted using the Docker volume:

```text
postgres_data
```

The volume is mounted at:

```text
/var/lib/postgresql/data
```

As a result, stopping the containers does not normally remove the database data.

For example:

```bash
docker compose down
```

stops and removes the containers while preserving the database volume.

In contrast:

```bash
docker compose down -v
```

also removes the database volume and therefore deletes the local database data.

---

## Security

Never commit:

- Database passwords
- API keys
- Private keys
- Production credentials
- `.env` files containing secrets

The PostgreSQL credentials currently defined in Docker Compose are **development-only credentials**.

Production deployments should use securely managed credentials and should not reuse the development database password.

---

## Database Development Notes

The database is consumed by the Flask backend through:

```text
Flask
  │
  ▼
SQLAlchemy
  │
  ▼
Psycopg
  │
  ▼
PostgreSQL 16
```

The browser and React frontend do not connect directly to PostgreSQL.

The normal application request path is:

```text
Browser
   │
   ▼
Nginx
   │
   ▼
Flask API
   │
   ▼
PostgreSQL
```
