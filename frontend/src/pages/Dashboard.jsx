import { formatCurrency } from '../utils/currency';
import SummaryCards from '../Components/Dashboard/SummaryCards';
import MonthlyExpensesChart from '../Components/Dashboard/MonthlyExpensesChart';
import CategoryDonutChart from '../Components/Dashboard/CategoryDonutChart';
import RecentTransactions from '../Components/Dashboard/RecentTransactions';
import BudgetOverview from '../Components/Dashboard/BudgetOverview';

export default function Dashboard({
  budgets = [],
  categories = [],
  transactions = [],
  currency = 'NGN (₦)',
  isDarkMode = false,
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen">
      <SummaryCards
        transactions={transactions}
        budgets={budgets}
        categories={categories}
        currency={currency}
        isDarkMode={isDarkMode}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <MonthlyExpensesChart
            transactions={transactions}
            currency={currency}
            isDarkMode={isDarkMode}
          />
        </div>

        <div>
          <CategoryDonutChart
            budgets={budgets}
            currency={currency}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={transactions}
            currency={currency}
            isDarkMode={isDarkMode}
          />
        </div>

        <div>
          <BudgetOverview
            budgets={budgets}
            currency={currency}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
}
