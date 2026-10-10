import { formatCurrency } from '../../utils/currency';
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

export default function MonthlyExpensesChart({
  transactions = [],
  currency = 'NGN (₦)',
  isDarkMode = false,
}) {
  const currentYear = new Date().getFullYear();

  const cardStyle = isDarkMode
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200/80';

  const titleStyle = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const textStyle = isDarkMode ? 'text-slate-300' : 'text-gray-500';

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

  const formatAmount = (value) =>
    formatCurrency(value, currency);

  return (
    <div className={`${cardStyle} p-6 rounded-2xl border shadow-sm`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-lg font-bold ${titleStyle}`}>
            Monthly Expenses
          </h2>

          <p className={`text-xs font-medium ${textStyle} mt-0.5`}>
            Monthly expense overview for {currentYear}
          </p>
        </div>

        <div>
          <span className={`block text-[10px] uppercase font-bold ${textStyle}`}>
            This Month
          </span>

          <span className="text-base font-extrabold text-rose-600">
            {formatAmount(currentMonthExpense)}
          </span>
        </div>
      </div>

      {/* Chart */}
      {!hasExpenses ? (
        <div className={`h-64 flex items-center justify-center text-sm ${textStyle}`}>
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
                tick={{ fill: isDarkMode ? '#CBD5E1' : '#6B7280',
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{ fill: isDarkMode ? '#CBD5E1' : '#6B7280',
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatAmount(value)
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
