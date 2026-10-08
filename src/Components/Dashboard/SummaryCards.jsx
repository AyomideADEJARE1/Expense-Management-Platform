import React, { useMemo } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, PieChart } from 'lucide-react';

export default function SummaryCards({ incomes = [], transactions = [], budgets = [] }) {
  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [incomes]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  const totalBalance = totalIncome - totalExpenses;
  const activeProjectsCount = budgets.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {/* Total Balance */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Balance</span>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          ₦{totalBalance.toLocaleString()}
        </div>
      </div>

      {/* Total Income */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Income</span>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
          +₦{totalIncome.toLocaleString()}
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Expenses</span>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
          -₦{totalExpenses.toLocaleString()}
        </div>
      </div>

      {/* Active Budgets / Projects */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Projects</span>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {activeProjectsCount}
        </div>
      </div>
    </div>
  );
}