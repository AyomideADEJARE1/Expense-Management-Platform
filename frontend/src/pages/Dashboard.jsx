import SummaryCards from '../Components/Dashboard/SummaryCards';
import MonthlyExpensesChart from '../Components/Dashboard/MonthlyExpensesChart';
import CategoryDonutChart from '../Components/Dashboard/CategoryDonutChart';
import RecentTransactions from '../Components/Dashboard/RecentTransactions';
import BudgetOverview from '../Components/Dashboard/BudgetOverview';

export default function Dashboard({
  budgets = [],
  categories = [],
  transactions = [],
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen">
      <SummaryCards
        transactions={transactions}
        categories={categories}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <MonthlyExpensesChart
            transactions={transactions}
          />
        </div>

        <div>
          <CategoryDonutChart budgets={budgets} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={transactions}
          />
        </div>

        <div>
          <BudgetOverview
          />
        </div>
      </div>
    </div>
  );
}
