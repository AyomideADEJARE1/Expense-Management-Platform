import { api } from '../services/api';
import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, Trash2, Plus, Edit3, X } from 'lucide-react';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

export default function Transactions({ categories = [], onTransactionChange }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'Expense',
    category: categories[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
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

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const handleOpenModal = (tx = null) => {
    if (tx) {
      setEditingTx(tx);

      setFormData({
        description: tx.desc || tx.description || '',
        amount: tx.amount,
        type: 'Expense',
        category: tx.category || categories[0]?.name || '',
        date: tx.date || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingTx(null);

      setFormData({
        description: '',
        amount: '',
        type: 'Expense',
        category: categories[0]?.name || '',
        date: new Date().toISOString().split('T')[0],
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

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">

      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">

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
              className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="All">All Transactions</option>
              <option value="Expense">Expense Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">
          Loading transactions...
        </div>
      ) : (
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
                    <td
                      colSpan="6"
                      className="py-8 text-center text-gray-400 font-medium"
                    >
                      No transaction history recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50/60 transition"
                    >

                      <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
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
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold">
                          {tx.category || 'General'}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap font-semibold">
                        <span className="text-rose-600">
                          Expense
                        </span>
                      </td>

                      <td className="py-4 px-6 text-gray-500 font-medium whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-4 px-6 text-right font-bold whitespace-nowrap text-rose-600">
                        -₦{Number(tx.amount || 0).toLocaleString()}
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

          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">

            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">

              <h3 className="text-lg font-bold text-gray-900">
                {editingTx
                  ? 'Edit Transaction'
                  : 'Record New Transaction'}
              </h3>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form onSubmit={handleSave} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Type
                  </label>

                  <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-rose-600 font-semibold">
                    Expense
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Amount (₦)
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
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
