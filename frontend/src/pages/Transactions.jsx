import { api } from '../services/api';
import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, Trash2, Plus, Edit3, Download } from 'lucide-react';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { escapeCsvCell } from '../utils/csv';

const getLocalDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function Transactions({
  categories = [],
  currency = 'NGN (₦)',
  onTransactionChange,
  isDarkMode = false,
}) {

  const modalBackground = isDarkMode
    ? 'bg-slate-800 text-white'
    : 'bg-white text-gray-900';

  const modalInput = isDarkMode
  ? '!bg-white !text-gray-900 border-gray-300 placeholder:!text-gray-500'
  : 'bg-gray-50 text-gray-900 border-gray-200';

  const modalLabel = isDarkMode
    ? 'text-slate-300'
    : 'text-gray-600';

  const sectionStyle = isDarkMode
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200/80';

  const inputStyle = isDarkMode
    ? 'bg-slate-700 text-slate-100 border-slate-600 placeholder:text-slate-400'
    : 'bg-gray-50 text-gray-900 border-gray-200';

  const primaryText = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const secondaryText = isDarkMode ? 'text-slate-300' : 'text-gray-500';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'Expense',
    category: categories[0]?.name || '',
    date: getLocalDateString(),
  });

  // 1. GET: Fetch expenses from Flask API
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      try {
        const response = await api.get('/expenses');
        const expenses = response?.data || [];

        setTransactions(
          expenses.map((expense) => ({
            ...expense,
            type: 'Expense',
            date: expense.expense_date,
          }))
        );
      } catch (err) {
        if (typeof showToast === 'function') {
          showToast(err.message || 'Error loading transactions', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [showToast]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const descText =
        tx.desc ||
        tx.description ||
        tx.source ||
        tx.title ||
        '';

      const matchesSearch =
        descText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category &&
          tx.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        filterType === 'All' || tx.type === filterType;
      const transactionDate = tx.expense_date || tx.date || '';
      const matchesStartDate =
        !filterStartDate || transactionDate >= filterStartDate;
      const matchesEndDate =
        !filterEndDate || transactionDate <= filterEndDate;
      const matchesCategory =
        filterCategory === 'All' || tx.category === filterCategory;

      return (
        matchesSearch
        && matchesType
        && matchesStartDate
        && matchesEndDate
        && matchesCategory
      );
    });
  }, [
    transactions,
    searchQuery,
    filterType,
    filterStartDate,
    filterEndDate,
    filterCategory,
  ]);

  const handleOpenModal = (tx = null) => {
    if (tx) {
      setEditingTx(tx);

      setFormData({
        description: tx.desc || tx.description || '',
        amount: tx.amount,
        type: 'Expense',
        category: tx.category || categories[0]?.name || '',
        date: tx.date || getLocalDateString(),
      });
    } else {
      setEditingTx(null);

      setFormData({
        description: '',
        amount: '',
        type: 'Expense',
        category: categories[0]?.name || '',
        date: getLocalDateString(),
      });
    }

    setIsModalOpen(true);
  };

  // 2. POST / PUT: Save expense via Flask API
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.amount) {
      return;
    }

    try {
      const selectedCategory = categories.find(
        (category) => category.name === formData.category
      );

      if (!selectedCategory) {
        showToast('Please select a valid category.', 'error');
        return;
      }

      if (editingTx) {
        const response = await api.put(`/expenses/${editingTx.id}`, {
          category_id: selectedCategory.id,
          amount: parseFloat(formData.amount),
          description: formData.description,
          expense_date: formData.date,
        });

        const updated = response?.data;

        const updatedTransaction = {
          ...updated,
          type: 'Expense',
          date: updated?.expense_date,
        };

        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editingTx.id ? updatedTransaction : t
          )
        );

        if (typeof showToast === 'function') {
          showToast('Transaction updated successfully!', 'success');
        }
      } else {
        const response = await api.post('/expenses', {
          category_id: selectedCategory.id,
          amount: parseFloat(formData.amount),
          description: formData.description,
          expense_date: formData.date,
        });

        const created = response?.data;

        const createdTransaction = {
          ...created,
          type: 'Expense',
          date: created?.expense_date,
        };

        setTransactions((prev) => [
          createdTransaction,
          ...prev,
        ]);

        if (typeof showToast === 'function') {
          showToast('Transaction recorded successfully!', 'success');
        }
      }

      if (onTransactionChange) {
        onTransactionChange();
      }

      setIsModalOpen(false);
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Action failed', 'error');
      }
    }
  };

  // 3. DELETE: Remove expense via Flask API
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/expenses/${itemToDelete.id}`);

      setTransactions((prev) =>
        prev.filter((item) => item.id !== itemToDelete.id)
      );

      if (typeof showToast === 'function') {
        showToast('Transaction deleted successfully!', 'delete');
      }

      if (onTransactionChange) {
        onTransactionChange();
      }
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Delete failed', 'error');
      }
    } finally {
      setItemToDelete(null);
    }
  };

  // Export only the rows currently visible after search and filters.
  const handleExportCsv = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = filteredTransactions.map((tx) => [
      tx.expense_date || tx.date || '',
      tx.description || tx.desc || tx.source || tx.title || 'Expense',
      tx.category || 'Uncategorized',
      Number(tx.amount || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expenses.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className={`w-full min-h-screen p-4 sm:p-6 lg:p-8 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-gray-900'}`}>

      {/* Action & Filter Bar */}
      <div className={`${sectionStyle} p-4 rounded-2xl border shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center`}>

        <button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm rounded-xl shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              placeholder="Search description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${inputStyle} placeholder:opacity-70 pl-10 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />

            <select
              aria-label="Filter transactions by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`${inputStyle} text-sm rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto`}
            >
              <option value="All">All Transactions</option>
              <option value="Expense">Expense Only</option>
            </select>

            <select
              aria-label="Filter transactions by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`${inputStyle} text-sm rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto`}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>

            <input
              aria-label="Filter transactions from date"
              type="date"
              value={filterStartDate}
              max={filterEndDate || undefined}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className={`${inputStyle} text-sm rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto`}
            />

            <input
              aria-label="Filter transactions to date"
              type="date"
              value={filterEndDate}
              min={filterStartDate || undefined}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className={`${inputStyle} text-sm rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto`}
            />

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">
          Loading transactions...
        </div>
      ) : (
        <div className={`${sectionStyle} rounded-2xl border shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm border-collapse">

              <thead>
                <tr className={`${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-50/80 border-gray-100 text-gray-400'} border-b text-xs uppercase tracking-wider font-semibold`}>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Amount</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>

                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className={`py-8 text-center ${secondaryText} font-medium`}
                    >
                      No transaction history recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`transition ${isDarkMode ? 'hover:bg-slate-700/60' : 'hover:bg-gray-50/60'}`}
                    >

                      <td className={`py-4 px-6 font-semibold ${primaryText} whitespace-nowrap`}>
                        <div className="flex items-center gap-3">

                          <div className="p-2 rounded-xl shrink-0 bg-rose-50 text-rose-600">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>

                          <span>
                            {tx.desc ||
                              tx.description ||
                              tx.source ||
                              tx.title ||
                              'Expense'}
                          </span>

                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-lg text-xs font-semibold`}>
                          {tx.category || 'General'}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap font-semibold">
                        <span className="text-rose-600">
                          Expense
                        </span>
                      </td>

                      <td className={`py-4 px-6 ${secondaryText} font-medium whitespace-nowrap`}>
                        {tx.date}
                      </td>

                      <td className="py-4 px-6 text-right font-bold whitespace-nowrap text-rose-600">
                        -{formatCurrency(tx.amount, currency)}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">

                          <button
                            onClick={() => handleOpenModal(tx)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setItemToDelete(tx)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmText="Delete"
      />

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

          <div className={`${modalBackground} rounded-2xl max-w-md w-full p-6 shadow-2xl relative`}>

            <div className={`flex items-center justify-between pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} mb-4`}>

              <h3 className="text-lg font-bold">
                {editingTx
                  ? 'Edit Transaction'
                  : 'Record New Transaction'}
              </h3>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                  isDarkMode
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>

            </div>

            <form onSubmit={handleSave} className="space-y-4">

              <div>
                <label className={`block text-xs font-semibold ${modalLabel} mb-1`}>
                  Description
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery Store"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className={`w-full ${modalInput} rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className={`block text-xs font-semibold ${modalLabel} mb-1`}>
                    Type
                  </label>

                  <div className={`w-full ${modalInput} rounded-xl px-3.5 py-2 text-sm text-rose-600 font-semibold`}>
                    Expense
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${modalLabel} mb-1`}>
                    Amount ({getCurrencySymbol(currency)})
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value,
                      })
                    }
                    className={`w-full ${modalInput} rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  />
                </div>

              </div>

              <div>
                <label className={`block text-xs font-semibold ${modalLabel} mb-1`}>
                  Category
                </label>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                    })
                  }
                  className={`w-full ${modalInput} rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  {categories.map((c) => (
                    <option
                      key={c.id || c.name}
                      value={c.name}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold ${modalLabel} mb-1`}>
                  Date
                </label>

                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  className={`w-full ${modalInput} rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} mt-6`}>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition"
                >
                  {editingTx
                    ? 'Save Changes'
                    : 'Record Transaction'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
