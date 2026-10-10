import { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

export default function CategoryDonutChart({ 
  budgets = [],
  isDarkMode = false,
}) {

  const cardStyle = isDarkMode
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200/80';

  const titleStyle = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const textStyle = isDarkMode ? 'text-slate-300' : 'text-gray-700';

  const budgetSummary = useMemo(() => {
    const totalLimit = budgets.reduce(
      (total, budget) => total + Number(budget.limit || 0),
      0
    );

    const totalSpent = budgets.reduce(
      (total, budget) => total + Number(budget.spent || 0),
      0
    );

    const percentage =
      totalLimit > 0
        ? Math.min((totalSpent / totalLimit) * 100, 100)
        : 0;

    return {
      totalLimit,
      totalSpent,
      percentage,
      exceeded: totalSpent > totalLimit,
    };
  }, [budgets]);

  const chartData = [
    {
      name: 'Spent',
      value: budgetSummary.percentage,
    },
    {
      name: 'Remaining',
      value: 100 - budgetSummary.percentage,
    },
  ];

  const spentColor = budgetSummary.exceeded
    ? '#EF4444'
    : budgetSummary.percentage >= 80
      ? '#F97316'
      : '#3B82F6';

  return (
    <div className={`${cardStyle} p-6 rounded-2xl border shadow-sm flex flex-col h-full min-h-[360px]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-blue-600" />

          <h2 className={`text-lg font-bold ${titleStyle}`}>
            Budget Spending
          </h2>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-medium">
          No budgets created yet.
        </div>
      ) : (
        <>
          <div className="relative w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={72}
                  outerRadius={92}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={spentColor} />
                  <Cell fill="#E5E7EB" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center information */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-3xl font-extrabold ${titleStyle}`}>
                {Math.round(budgetSummary.percentage)}%
              </span>

              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Used
              </span>
            </div>
          </div>

          <div className="text-center -mt-2">
            <p
              className={`text-sm font-bold ${
                budgetSummary.exceeded
                  ? 'text-red-600'
                  : budgetSummary.percentage >= 80
                    ? 'text-orange-500'
                    : textStyle
              }`}
            >
              ₦{budgetSummary.totalSpent.toLocaleString()} spent
            </p>

            <p className={`text-xs ${textStyle} mt-1`}>
              of ₦{budgetSummary.totalLimit.toLocaleString()} budget
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                budgetSummary.exceeded
                  ? 'bg-red-100 text-red-700'
                  : budgetSummary.percentage >= 80
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              {budgetSummary.exceeded
                ? 'Budget Exceeded'
                : budgetSummary.percentage >= 80
                  ? 'Near Budget Limit'
                  : 'Within Budget'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
