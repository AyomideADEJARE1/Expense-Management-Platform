import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function MonthlyExpensesChart({ transactions = [] }) {
  const currentYear = new Date().getFullYear();

  const monthsData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return months.map((month, index) => {
      const expense = transactions
        .filter((item) => {
          const dateValue = item.expense_date || item.date;
          const date = new Date(dateValue);

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMonth() === index &&
            date.getFullYear() === currentYear
          );
        })
        .reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        );

      return {
        month,
        expense,
      };
    });
  }, [transactions, currentYear]);

  const currentMonthExpense = useMemo(() => {
    const currentMonth = new Date().getMonth();

    return monthsData[currentMonth]?.expense || 0;
  }, [monthsData]);

  const hasExpenses = monthsData.some(
    (item) => item.expense > 0
  );

  const formatCurrency = (value) =>
    `₦${Number(value).toLocaleString()}`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Monthly Expenses
          </h2>

          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Monthly expense overview for {currentYear}
          </p>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400">
            This Month
          </span>

          <span className="text-base font-extrabold text-rose-600">
            {formatCurrency(currentMonthExpense)}
          </span>
        </div>
      </div>

      {/* Chart */}
      {!hasExpenses ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">
          No expenses recorded for {currentYear}.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthsData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `₦${Number(value).toLocaleString()}`
                }
                width={75}
              />

              <Tooltip
                formatter={(value) => [
                  formatCurrency(value),
                  'Expenses',
                ]}
                labelFormatter={(label) =>
                  `${label} ${currentYear}`
                }
                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
              />

              <Bar
                dataKey="expense"
                name="Expenses"
                fill="#f43f5e"
                radius={[5, 5, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
