import React, { useState, useEffect } from 'react';
import { 
  Calendar, TrendingUp, TrendingDown, PieChart as PieIcon, Download, Eye, X 
} from 'lucide-react';
import { api } from '../services/api';

export default function Reports() {
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  const [categorySummaries, setCategorySummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  // Fetch Summary data from backend summary endpoints using centralized API service
  useEffect(() => {
    const fetchReportSummaries = async () => {
      setLoading(true);
      try {
        const [monthlyData, categoryData] = await Promise.all([
          api.get('/summaries/monthly'),
          api.get('/summaries/category'),
        ]);
        setMonthlySummaries(Array.isArray(monthlyData) ? monthlyData : []);
        setCategorySummaries(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        console.error('Error loading summary reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportSummaries();
  }, []);

  const activeReport = monthlySummaries.find((m) => m.month === selectedMonthKey || m.key === selectedMonthKey);

  // Filter category breakdown for active selected month if available
  const activeCategoryBreakdown = categorySummaries.filter(
    (c) => c.month === selectedMonthKey || !selectedMonthKey
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      ) : monthlySummaries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No Reports Available</h3>
          <p className="text-xs text-gray-500 mt-1">Add transactions to generate monthly reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlySummaries.map((report) => {
            const mKey = report.month || report.key;
            const totalIncome = Number(report.total_income || report.totalIncome || 0);
            const totalExpense = Number(report.total_expense || report.totalExpense || 0);
            const netSavings = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 
              ? ((netSavings / totalIncome) * 100).toFixed(1) 
              : '0';

            return (
              <div 
                key={mKey} 
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h2 className="font-bold text-gray-800">{report.label || mKey}</h2>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      netSavings >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {netSavings >= 0 ? `+${savingsRate}% saved` : 'Deficit'}
                    </span>
                  </div>

                  <div className="space-y-3 my-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Income
                      </span>
                      <span className="font-semibold text-emerald-600">+₦{totalIncome.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-red-500" /> Expenses
                      </span>
                      <span className="font-semibold text-red-600">-₦{totalExpense.toLocaleString()}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-bold">
                      <span className="text-gray-700">Net Savings</span>
                      <span className={netSavings >= 0 ? 'text-gray-900' : 'text-red-600'}>
                        ₦{netSavings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMonthKey(mKey)}
                  className="w-full mt-4 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" /> View Full Report
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeReport.label || activeReport.month} Monthly Summary</h2>
                <p className="text-xs text-gray-500">Comprehensive overview of monthly cash flow</p>
              </div>
              <button 
                onClick={() => setSelectedMonthKey(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Total Income</p>
                <p className="text-xl font-bold text-emerald-800 mt-1">
                  ₦{Number(activeReport.total_income || activeReport.totalIncome || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
                <p className="text-xs font-semibold text-red-700 uppercase">Total Expenses</p>
                <p className="text-xl font-bold text-red-800 mt-1">
                  ₦{Number(activeReport.total_expense || activeReport.totalExpense || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase">Net Balance</p>
                <p className="text-xl font-bold text-blue-800 mt-1">
                  ₦{(
                    Number(activeReport.total_income || activeReport.totalIncome || 0) - 
                    Number(activeReport.total_expense || activeReport.totalExpense || 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" /> Expense Breakdown
              </h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                {activeCategoryBreakdown.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">No category details available for this month.</p>
                ) : (
                  activeCategoryBreakdown.map((catItem, idx) => {
                    const catName = catItem.category || catItem.category_name || 'Uncategorized';
                    const amt = Number(catItem.total_amount || catItem.amount || 0);
                    const totalExp = Number(activeReport.total_expense || activeReport.totalExpense || 1);
                    const percentage = Math.min(((amt / totalExp) * 100).toFixed(1), 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-gray-700">
                          <span>{catName}</span>
                          <span>₦{amt.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Report
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