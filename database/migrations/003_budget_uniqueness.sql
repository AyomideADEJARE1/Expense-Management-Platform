-- Enforce one budget per user, month, and category.
-- PostgreSQL UNIQUE constraints allow multiple NULL category_id values, so
-- use separate partial unique indexes for categorized and general budgets.
-- Existing duplicate data must be reviewed and resolved before this migration can pass.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM budgets
        WHERE category_id IS NOT NULL
        GROUP BY user_id, month, category_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot add budget uniqueness index: duplicate user/month/category budgets exist; resolve duplicates before retrying';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM budgets
        WHERE category_id IS NULL
        GROUP BY user_id, month
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot add general-budget uniqueness index: duplicate user/month budgets with NULL category exist; resolve duplicates before retrying';
    END IF;
END;
$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_user_month_category
    ON budgets (user_id, month, category_id)
    WHERE category_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_user_month_no_category
    ON budgets (user_id, month)
    WHERE category_id IS NULL;

COMMIT;
