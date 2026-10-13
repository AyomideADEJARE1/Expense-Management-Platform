import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Calendar,
  TrendingDown,
  PieChart as PieIcon,
  Download,
  Eye,
  X,
} from 'lucide-react';

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  // Fetch expenses from Flask API
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      try {
        const response = await api.get('/expenses');
        setTransactions(response?.data || []);
      } catch (err) {
        console.error('Error loading report transactions:', err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Group expenses by month
  const monthlyData = useMemo(() => {
    const groups = {};

    transactions.forEach((tx) => {
      if (!tx.expense_date) return;

      const dateObj = new Date(tx.expense_date);

      if (Number.isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const monthIndex = dateObj.getMonth();

      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const monthName = dateObj.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthName,
          totalExpense: 0,
          transactions: [],
          categories: {},
        };
      }

      const amount = Number(tx.amount) || 0;

      groups[monthKey].totalExpense += amount;

      const categoryName =
        tx.category?.name ||
        tx.category ||
        'Uncategorized';

      groups[monthKey].categories[categoryName] =
        (groups[monthKey].categories[categoryName] || 0) + amount;

      groups[monthKey].transactions.push(tx);
    });

    return groups;
  }, [transactions]);

  const monthKeys = Object.keys(monthlyData).sort().reverse();

  const activeReport = selectedMonthKey
    ? monthlyData[selectedMonthKey]
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading reports...
        </div>
      ) : monthKeys.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />

          <h3 className="text-lg font-bold text-gray-800">
            No Reports Available
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Add expenses to generate monthly reports.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Expense Reports
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Review your monthly spending and expense categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthKeys.map((monthKey) => {
              const report = monthlyData[monthKey];

              return (
                <div
                  key={monthKey}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                          <Calendar className="w-5 h-5" />
                        </div>

                        <h2 className="font-bold text-gray-800">
                          {report.label}
                        </h2>
                      </div>

                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-50 text-red-600">
                        Expenses
                      </span>
                    </div>

                    <div className="space-y-3 my-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          Total Expenses
                        </span>

                        <span className="font-semibold text-red-600">
                          ₦{report.totalExpense.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-bold">
                        <span className="text-gray-700">
                          Transactions
                        </span>

                        <span className="text-gray-900">
                          {report.transactions.length}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Categories
                        </span>

                        <span className="font-semibold text-gray-800">
                          {Object.keys(report.categories).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMonthKey(monthKey)}
                    className="w-full mt-4 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Report
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detailed Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeReport.label} Expense Report
                </h2>

                <p className="text-xs text-gray-500">
                  Detailed overview of your monthly expenses
                </p>
              </div>

              <button
                onClick={() => setSelectedMonthKey(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
                <p className="text-xs font-semibold text-red-700 uppercase">
                  Total Expenses
                </p>

                <p className="text-xl font-bold text-red-800 mt-1">
                  ₦{activeReport.totalExpense.toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase">
                  Transactions
                </p>

                <p className="text-xl font-bold text-blue-800 mt-1">
                  {activeReport.transactions.length}
                </p>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                <p className="text-xs font-semibold text-purple-700 uppercase">
                  Categories
                </p>

                <p className="text-xl font-bold text-purple-800 mt-1">
                  {Object.keys(activeReport.categories).length}
                </p>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                Expense Breakdown
              </h3>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                {Object.keys(activeReport.categories).length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No expenses recorded for this month.
                  </p>
                ) : (
                  Object.entries(activeReport.categories)
                    .sort(([, amountA], [, amountB]) => amountB - amountA)
                    .map(([categoryName, amount]) => {
                      const percentage =
                        activeReport.totalExpense > 0
                          ? (
                              (amount / activeReport.totalExpense) *
                              100
                            ).toFixed(1)
                          : 0;

                      return (
                        <div
                          key={categoryName}
                          className="space-y-1"
                        >
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <span>{categoryName}</span>

                            <span>
                              ₦{amount.toLocaleString()} ({percentage}%)
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  Number(percentage),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Transactions */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                Transactions
              </h3>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {activeReport.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 border-b last:border-b-0 border-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {tx.description || 'Expense'}
                      </p>

                      <p className="text-xs text-gray-500">
                        {tx.category?.name ||
                          tx.category ||
                          'Uncategorized'}
                      </p>
                    </div>

                    <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                      ₦{Number(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>

              <button
                onClick={() => setSelectedMonthKey(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
