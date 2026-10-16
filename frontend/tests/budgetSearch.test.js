import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBudgetSearchResult,
  matchesBudgetSearch,
} from '../src/utils/budgetSearch.js';

const formatCurrency = (amount, currency) => `${currency} ${amount}`;

test('budget search matches category name and month, not unrelated queries', () => {
  const result = createBudgetSearchResult(
    { category_id: 2, month: '2026-10-01', amount: 100 },
    [{ id: 2, name: 'Transport' }],
    'NGN',
    formatCurrency,
  );

  assert.equal(result.title, 'Transport Budget');
  assert.equal(matchesBudgetSearch(result, 'transport'), true);
  assert.equal(matchesBudgetSearch(result, '2026-10'), true);
  assert.equal(matchesBudgetSearch(result, 'groceries'), false);
});

test('whole-month budgets have a searchable overall-budget title', () => {
  const result = createBudgetSearchResult(
    { category_id: null, month: '2026-10-01', amount: 500 },
    [],
    'NGN',
    formatCurrency,
  );

  assert.equal(result.title, 'Overall Monthly Budget');
  assert.equal(matchesBudgetSearch(result, 'overall'), true);
  assert.equal(matchesBudgetSearch(result, '2026-10'), true);
});

test('blank queries do not produce budget search matches', () => {
  const result = createBudgetSearchResult(
    { category_id: 1, month: '2026-10-01', amount: 50 },
    [{ id: 1, name: 'Groceries' }],
    'NGN',
    formatCurrency,
  );

  assert.equal(matchesBudgetSearch(result, ''), false);
  assert.equal(matchesBudgetSearch(result, '   '), false);
});
