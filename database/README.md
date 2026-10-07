# Database

PostgreSQL database layer for the Expense Management Platform.

## Database

The application uses PostgreSQL.

For local development, PostgreSQL can be run using Docker.

### Local database configuration

| Setting | Value |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | expense_management |
| User | expense_user |

The local development password should be provided through environment variables or another local secret mechanism. **Do not commit database passwords to Git.**

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

### Migrations

The initial database migration is:

```text
database/migrations/001_initial_schema.sql
```

Apply the initial schema with:

```bash
psql -h localhost -p 5432 -U expense_user -d expense_management \
  -f database/migrations/001_initial_schema.sql
```

The command will prompt for the local database password.

### Schema Reference

The current schema is also maintained in:

```text
database/schema/schema.sql
```

The migration file is the executable database change, while `schema.sql` serves as the schema reference.

### Verification

After applying the migration, connect to the database:

```bash
psql -h localhost -p 5432 -U expense_user -d expense_management
```

Then list the tables:

```sql
\dt
```

Expected tables:
```
users
expense_categories
expenses
budgets
monthly_expense_summary
```

### Security

Never commit:

- Database passwords
- API keys
- Private keys
- Production credentials
- `.env` files containing secrets

Local credentials should be managed separately from the repository.
