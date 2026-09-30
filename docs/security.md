# Security Guidelines

Security requirements for the Expense Management Platform.

## Secrets Management

Never commit sensitive information to GitHub.

The following must not be committed:

- Database passwords
- API keys
- Secret keys
- Access tokens
- Private keys
- Cloud credentials
- Production credentials
- `.env` files containing real secrets

## Environment Variables

Application secrets and environment-specific configuration must be stored in environment variables.

A template is provided in:

```text
.env.example
```

Developers should create their own local `.env` file from the example and replace placeholder values with local credentials.

The `.env` file is excluded from Git through `.gitignore`.

### Authentication Security

The application must:

- Never store plaintext passwords.
- Hash passwords using a secure password-hashing algorithm.
- Never log passwords or authentication secrets.
- Validate authentication input.
- Protect authenticated endpoints.
- Use secure session or token handling.

### Database Security

- Database credentials must be provided through environment variables.
- Database passwords must not be hard-coded in application source code.
- Database access should use parameterized queries or an ORM.
- Production databases must not use development credentials.
- Database access should follow the principle of least privilege.

### Application Security

The application should:

- Validate and sanitize user input.
- Return appropriate HTTP error responses.
- Avoid exposing sensitive information in error messages.
- Keep debug mode disabled outside local development.
- Validate environment configuration during startup.

### Git and Repository Security

Before pushing code, developers should check for:

- `.env` files
- Passwords
- API keys
- Access tokens
- Private keys
- Cloud credentials
- Other sensitive information

If a secret is accidentally committed, it must be revoked or rotated immediately. Removing the file from the latest commit is not sufficient because Git history may still contain the secret.

### Local Development

Use `.env.example` as the configuration reference.

Example:
```
.env.example  → committed to GitHub
.env          → local only, never committed
```
Never copy real production credentials into `.env.example`.
