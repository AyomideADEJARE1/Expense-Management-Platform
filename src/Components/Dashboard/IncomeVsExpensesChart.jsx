import React, { useMemo } from 'react';

export default function IncomeVsExpensesChart({ incomes = [], transactions = [] }) {
  // Current month totals calculation
  const { currentMonthIncome, currentMonthExpense } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const incTotal = incomes.reduce((sum, item) => {
      const itemDate = new Date(item.date);
      if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);

    const expTotal = transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, item) => {
        const itemDate = new Date(item.date);
        if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
          return sum + Number(item.amount || 0);
        }
        return sum;
      }, 0);

    return { currentMonthIncome: incTotal, currentMonthExpense: expTotal };
  }, [incomes, transactions]);

  // Max value scaled up to ₦1.2M so vertical bars reflect higher ranges properly
  const maxRange = 1200000;

  // Monthly breakdown data structure (Vertical setup preserved)
  const monthsData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthIncomes = incomes
        .filter((item) => {
          const d = new Date(item.date);
          return d.getMonth() === index && d.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const monthExpenses = transactions
        .filter((item) => {
          const d = new Date(item.date);
          return item.type === 'Expense' && d.getMonth() === index && d.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        month,
        income: monthIncomes,
        expense: monthExpenses,
        // Compute height percentage based on maxRange (capped at 100%)
        incomeHeight: Math.min(100, Math.round((monthIncomes / maxRange) * 100)),
        expenseHeight: Math.min(100, Math.round((monthExpenses / maxRange) * 100)),
      };
    });
  }, [incomes, transactions, maxRange]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
      {/* Header section with monthly totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Income vs Expenses</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Monthly financial comparison overview
          </p>
        </div>

        {/* Display monthly total above the chart */}
        <div className="flex items-center gap-6">
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400">
              Income (This Month)
            </span>
            <span className="text-base font-extrabold text-emerald-600">
              +₦{currentMonthIncome.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400">
              Expenses (This Month)
            </span>
            <span className="text-base font-extrabold text-rose-600">
              -₦{currentMonthExpense.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas with Vertical Y-Axis up to 1.2M */}
      <div className="relative h-64 w-full flex items-end gap-2 pt-6">
        {/* Y-Axis Labels (0 to 1.2M) */}
        <div className="flex flex-col justify-between h-full text-[10px] font-semibold text-gray-400 pr-2 border-r border-gray-100 shrink-0">
          <span>₦1.2M</span>
          <span>₦900k</span>
          <span>₦600k</span>
          <span>₦300k</span>
          <span>₦0</span>
        </div>

        {/* Vertical Bars Container */}
        <div className="flex-1 h-full flex items-end justify-between gap-2 px-2">
          {monthsData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Vertical Bar Group */}
              <div className="flex items-end justify-center gap-1 w-full h-full pb-1">
                {/* Income Bar (Green) */}
                <div
                  className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm transition-all duration-300 relative"
                  style={{ height: `${data.incomeHeight}%` }}
                >
                  {/* Tooltip on Hover */}
                  {data.income > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 shadow-lg">
                      +₦{data.income.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Expense Bar (Rose/Red) */}
                <div
                  className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t-sm transition-all duration-300 relative"
                  style={{ height: `${data.expenseHeight}%` }}
                >
                  {/* Tooltip on Hover */}
                  {data.expense > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 shadow-lg">
                      -₦{data.expense.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Month Label */}
              <span className="text-[11px] font-medium text-gray-400 mt-2">
                {data.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 pt-4 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-gray-600">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-xs font-medium text-gray-600">Expense</span>
        </div>
      </div>
    </div>
  );
}