
import { PieChart } from 'lucide-react';

export default function BudgetOverview({
  budgets = [],
  isDarkMode = false,
}) {
  const cardStyle = isDarkMode
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200/80';
  const titleStyle = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const textStyle = isDarkMode ? 'text-slate-300' : 'text-gray-500';

  return (
    <div className={`${cardStyle} p-6 rounded-2xl border shadow-sm h-full`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h2 className={`text-lg font-bold ${titleStyle}`}>
            Budget Overview
          </h2>
        </div>
      </div>

      {budgets.length === 0 ? (
        <p className={`text-sm ${textStyle} font-medium py-4`}>
          No active budgets found.
        </p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const limit = Number(b.limit) || 0;
            const spent = Number(b.spent) || 0;
            const pct = limit > 0
              ? Math.min(Math.round((spent / limit) * 100), 100)
              : 0;
            const isExceeded = spent > limit;

            return (
              <div key={b.id || b.category} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    {b.category}
                  </span>
                  <span className={`text-xs font-semibold ${textStyle}`}>
                    ₦{spent.toLocaleString()} / ₦{limit.toLocaleString()}
                  </span>
                </div>

                <div className={`w-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} h-2.5 rounded-full overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-red-500'
                        : pct >= 80
                          ? 'bg-amber-400'
                          : 'bg-blue-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
