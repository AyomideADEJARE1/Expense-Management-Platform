-- Prevent category deletion from silently turning category-specific budgets
-- into whole-month budgets. The API also checks for linked budgets to return
-- a clear HTTP 409; this foreign key is the final protection against races.

BEGIN;

ALTER TABLE budgets
    DROP CONSTRAINT IF EXISTS fk_budgets_category;

ALTER TABLE budgets
    ADD CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id)
    REFERENCES expense_categories(id)
    ON DELETE RESTRICT;

COMMIT;
