import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

export default function Transactions({ transactions = [], setTransactions }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [itemToDelete, setItemToDelete] = useState(null);
  const { showToast } = useToast();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'All' || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const handleDelete = (item) => {
   if (!itemToDelete) return;

    setTransactions((prev) => prev.filter((item) => item.id !== itemToDelete.id));
    if (typeof showToast === 'function') {
      showToast('Transaction deleted successfully!', 'delete');
    }
    setItemToDelete(null);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="All">All Types</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expense Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">
                    No transaction history recorded yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'Income';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <span>{tx.desc || tx.source || tx.title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-semibold">
                        <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 font-medium whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className={`py-4 px-6 text-right font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isIncome ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                        {/* Confirmation Modal at the bottom of JSX */}
                        <ConfirmationModal
                          isOpen={Boolean(itemToDelete)}
                          onClose={() => setItemToDelete(null)}
                          onConfirm={handleDelete}
                          title="Delete Expense?"
                          message="Are you sure you want to delete this expense? This action cannot be undone."
                          confirmText="Delete"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}