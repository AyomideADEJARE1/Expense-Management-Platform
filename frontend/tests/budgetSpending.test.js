import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudgetSpent } from '../src/utils/budgetSpending.js';

const expenses = [
  { amount: '20.50', category_id: 1, expense_date: '2026-10-02' },
  { amount: 30, category_id: 2, expense_date: '2026-10-08' },
  { amount: 15, category: { id: 1 }, date: '2026-10-19' },
  { amount: 99, category_id: 1, expense_date: '2026-09-30' },
];

test('whole-month budget includes all categories for that month only', () => {
  assert.equal(
    calculateBudgetSpent({ month: '2026-10-01', category_id: null }, expenses),
    65.5,
  );
});

test('category budget includes only that category for that month', () => {
  assert.equal(
    calculateBudgetSpent({ month: '2026-10-01', category_id: 1 }, expenses),
    35.5,
  );
});

test('missing month or non-array expenses safely returns zero', () => {
  assert.equal(calculateBudgetSpent({ category_id: null }, expenses), 0);
  assert.equal(calculateBudgetSpent({ month: '2026-10-01' }, null), 0);
});

test('invalid amounts do not become a valid financial total', () => {
  assert.equal(
    calculateBudgetSpent(
      { month: '2026-10-01', category_id: null },
      [{ amount: 'not-a-number', category_id: 1, expense_date: '2026-10-01' }],
    ),
    0,
  );
});
