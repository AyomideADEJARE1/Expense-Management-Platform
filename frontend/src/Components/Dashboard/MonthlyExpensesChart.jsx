import { useMemo } from 'react';

export default function MonthlyExpensesChart({ transactions = [] }) {
  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.reduce((sum, item) => {
      const itemDate = new Date(item.date);

      if (
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      ) {
        return sum + Number(item.amount || 0);
      }

      return sum;
    }, 0);
  }, [transactions]);

  const monthsData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const expense = transactions
        .filter((item) => {
          const d = new Date(item.date);

          return (
            d.getMonth() === index &&
            d.getFullYear() === currentYear
          );
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        month,
        expense,
      };
    });
  }, [transactions]);

  const maxExpense = Math.max(
    ...monthsData.map((item) => item.expense),
    1
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Monthly Expenses
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Monthly expense overview for {new Date().getFullYear()}
          </p>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400">
            This Month
          </span>
          <span className="text-base font-extrabold text-rose-600">
            ₦{currentMonthExpense.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 w-full flex items-end gap-2 pt-6">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between h-full text-[10px] font-semibold text-gray-400 pr-2 border-r border-gray-100 shrink-0">
          <span>₦{maxExpense.toLocaleString()}</span>
          <span>₦{Math.round(maxExpense * 0.75).toLocaleString()}</span>
          <span>₦{Math.round(maxExpense * 0.5).toLocaleString()}</span>
          <span>₦{Math.round(maxExpense * 0.25).toLocaleString()}</span>
          <span>₦0</span>
        </div>

        {/* Bars */}
        <div className="flex-1 h-full flex items-end justify-between gap-2 px-2">
          {monthsData.map((data) => {
            const height =
              data.expense > 0
                ? Math.max(
                    4,
                    Math.round((data.expense / maxExpense) * 100)
                  )
                : 0;

            return (
              <div
                key={data.month}
                className="flex-1 flex flex-col items-center h-full justify-end group"
              >
                <div className="flex items-end justify-center w-full h-full pb-1">
                  <div
                    className="w-3 sm:w-4 bg-rose-500 rounded-t-sm transition-all duration-300 relative"
                    style={{ height: `${height}%` }}
                  >
                    {data.expense > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 shadow-lg">
                        ₦{data.expense.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-medium text-gray-400 mt-2">
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center pt-4 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-xs font-medium text-gray-600">
            Expenses
          </span>
        </div>
      </div>
    </div>
  );
}
