-- Migration 006: separate the application runtime account from the bootstrap/admin account.
-- This file is run by psql. The PostgreSQL container supplies these values from
-- its environment on first initialization; CD supplies the same environment on existing volumes.
\getenv app_user POSTGRES_APP_USER
\getenv app_password POSTGRES_APP_PASSWORD
\getenv bootstrap_user POSTGRES_BOOTSTRAP_USER
\getenv database_name POSTGRES_DB

SELECT length(:'app_password') >= 32
   AND lower(:'app_password') NOT LIKE '%replace-with%'
   AND lower(:'app_password') NOT LIKE '%change-me%'
   AND lower(:'app_password') NOT LIKE '%placeholder%'
   AND lower(:'app_password') NOT LIKE '%example-secret%'
   AS app_password_is_strong
\gset

\if :app_password_is_strong
\else
  \echo 'ERROR: POSTGRES_APP_PASSWORD must be a unique strong value of at least 32 characters.'
  \quit 3
\endif

SELECT :'app_user' <> :'bootstrap_user' AS app_user_is_separate
\gset

\if :app_user_is_separate
\else
  \echo 'ERROR: POSTGRES_APP_USER must differ from POSTGRES_BOOTSTRAP_USER.'
  \quit 3
\endif

-- Create the restricted account on first run; keep credentials current on reruns.
SELECT format(
    'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'app_user',
    :'app_password'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = :'app_user'
)
\gexec

ALTER ROLE :"app_user"
    WITH LOGIN
    PASSWORD :'app_password'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    NOBYPASSRLS;

GRANT CONNECT ON DATABASE :"database_name" TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";

-- The application needs data access, not schema-management privileges.
REVOKE CREATE ON SCHEMA public FROM :"app_user";
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA public
    TO :"app_user";

GRANT USAGE, SELECT
    ON ALL SEQUENCES IN SCHEMA public
    TO :"app_user";

-- Preserve the required data privileges for future objects created by the
-- bootstrap/migration account. The runtime account is not the object owner.
ALTER DEFAULT PRIVILEGES FOR ROLE :"bootstrap_user"
    IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_user";

ALTER DEFAULT PRIVILEGES FOR ROLE :"bootstrap_user"
    IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO :"app_user";

\echo 'Restricted PostgreSQL application role and privileges are configured.'
