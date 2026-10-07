import { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#F97316', // Orange
  '#A855F7', // Purple
  '#EF4444', // Red
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber
];

export default function CategoryDonutChart({ budgets = [] }) {
  // Transform active budgets into chart slices
  const chartData = useMemo(() => {
    return budgets
      .filter((b) => Number(b.spent) > 0) // Only display categories that have spending > 0
      .map((b, index) => ({
        name: b.category,
        value: Number(b.spent),
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      }));
  }, [budgets]);

  // Compute total spent across all budgets
  const totalBudgetSpent = useMemo(() => {
    return budgets.reduce((acc, b) => acc + (Number(b.spent) || 0), 0);
  }, [budgets]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-full min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Budget Spending</h2>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-medium py-12">
          No budget expenses recorded yet.
        </div>
      ) : (
        <div className="relative w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Spent']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs font-semibold text-gray-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total Spent Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Spent
            </span>
            <span className="text-sm font-extrabold text-gray-900">
              ₦{totalBudgetSpent.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}