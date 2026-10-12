/**
 * Calculate spending for one budget using the expense rows loaded for the user.
 * A null category_id represents a whole-month budget; otherwise spending is
 * restricted to the matching category and month.
 */
export function calculateBudgetSpent(budget, expenses) {
  const budgetMonth = String(budget?.month || '').slice(0, 7);
  if (!budgetMonth || !Array.isArray(expenses)) return 0;

  return expenses
    .filter((expense) => {
      const expenseCategoryId = expense.category_id ?? expense.category?.id;
      const expenseDate = expense.expense_date ?? expense.date;
      const sameMonth = String(expenseDate || '').slice(0, 7) === budgetMonth;
      const wholeMonthBudget = budget.category_id == null;
      const sameCategory =
        wholeMonthBudget ||
        Number(expenseCategoryId) === Number(budget.category_id);

      return sameMonth && sameCategory;
    })
    .reduce((total, expense) => {
      const amount = Number(expense.amount || 0);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
}
