import { useMemo } from 'react';
import { Receipt, CalendarDays, PieChart, FolderKanban } from 'lucide-react';

export default function SummaryCards({
  transactions = [],
  budgets = [],
  categories = [],
}) {
  const totalExpenses = useMemo(() => {
    return transactions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [transactions]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.reduce((sum, item) => {
      const date = new Date(item.date);

      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        return sum + Number(item.amount || 0);
      }

      return sum;
    }, 0);
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Expenses
          </span>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
          ₦{totalExpenses.toLocaleString()}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            This Month
          </span>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          ₦{currentMonthExpenses.toLocaleString()}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Active Budgets
          </span>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {budgets.length}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Categories
          </span>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {categories.length}
        </div>
      </div>
    </div>
  );
}
