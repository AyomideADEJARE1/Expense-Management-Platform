-- Expense Management Platform
-- PostgreSQL Database Schema

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_expense_category_name UNIQUE (name)
);

CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id)
        REFERENCES expense_categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_expense_amount
        CHECK (amount > 0)
);

CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT,
    amount NUMERIC(12, 2) NOT NULL,
    month DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id)
        REFERENCES expense_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_budget_amount
        CHECK (amount > 0),

    CONSTRAINT chk_budget_month
        CHECK (EXTRACT(DAY FROM month) = 1)
);

CREATE TABLE monthly_expense_summary (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT,
    month DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_monthly_summary_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_monthly_summary_category
        FOREIGN KEY (category_id)
        REFERENCES expense_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_summary_amount
        CHECK (total_amount >= 0),

    CONSTRAINT chk_summary_month
        CHECK (EXTRACT(DAY FROM month) = 1),

    CONSTRAINT uq_monthly_summary
        UNIQUE (user_id, category_id, month)
);

-- Indexes for common queries

CREATE INDEX idx_expenses_user_id
    ON expenses(user_id);

CREATE INDEX idx_expenses_category_id
    ON expenses(category_id);

CREATE INDEX idx_expenses_date
    ON expenses(expense_date);

CREATE INDEX idx_budgets_user_id
    ON budgets(user_id);

CREATE INDEX idx_budgets_month
    ON budgets(month);

CREATE INDEX idx_monthly_summary_user_id
    ON monthly_expense_summary(user_id);

CREATE INDEX idx_monthly_summary_month
    ON monthly_expense_summary(month);
