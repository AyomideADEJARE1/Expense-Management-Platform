import React from 'react';
import { PieChart } from 'lucide-react';

export default function BudgetOverview({ budgets = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Budget Overview</h2>
        </div>
      </div>

      {budgets.length === 0 ? (
        <p className="text-sm text-gray-400 font-medium py-4">No active budgets found.</p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const pct = Math.min(Math.round((b.spent / b.limit) * 100), 100);
            const isExceeded = b.spent > b.limit;

            return (
              <div key={b.id || b.category} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-800">{b.category}</span>
                  <span className="text-xs font-semibold text-gray-500">
                    ₦{Number(b.spent).toLocaleString()} / ₦{Number(b.limit).toLocaleString()}
                  </span>
                </div>

                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
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