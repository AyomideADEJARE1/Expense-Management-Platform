export function createBudgetSearchResult(budget, categories, currency, formatCurrency) {
  const category = categories.find(
    (item) => Number(item.id) === Number(budget.category_id),
  );
  const title =
    budget.category_id == null
      ? 'Overall Monthly Budget'
      : `${category?.name || `Category #${budget.category_id}`} Budget`;
  const subtitle = `Month: ${budget.month} • Limit: ${formatCurrency(
    budget.amount,
    currency,
  )}`;

  return {
    sourceType: 'Budget',
    tab: 'budgets',
    title,
    subtitle,
    amount: budget.amount,
  };
}

export function matchesBudgetSearch(result, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  return [result?.title, result?.subtitle].some((value) =>
    String(value || '').toLowerCase().includes(normalizedQuery),
  );
}
