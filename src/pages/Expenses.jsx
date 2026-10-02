import React, { useState, useMemo } from 'react';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  X, 
  TrendingDown, 
  CreditCard, 
  Calendar 
} from 'lucide-react';

export default function Expenses({ 
  categories = [], 
  expenses = [], 
  setExpenses, 
  budgets = [], 
  onAddExpense 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const { showToast, confirmAction } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);

  // Filter only expense categories
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'Expense');
  }, [categories]);

  const [formData, setFormData] = useState({
    title: '',
    category: expenseCategories[0]?.name || 'General',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    budgetId: '',
    note: '',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const totalExpenseSum = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses]);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title || '',
        category: expense.category || expenseCategories[0]?.name || 'General',
        amount: expense.amount || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        budgetId: expense.budgetId || '',
        note: expense.note || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        title: '',
        category: expenseCategories[0]?.name || 'General',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        budgetId: '',
        note: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const numericAmount = parseFloat(formData.amount);

    if (editingExpense) {
      setExpenses((prev) =>
        prev.map((i) =>
          i.id === editingExpense.id
            ? { ...formData, amount: numericAmount, id: i.id }
            : i
        )
      );
      showToast('Expense updated successfully!', 'success');
    } else {
      const newExpenseData = {
        ...formData,
        amount: numericAmount,
      };

      if (typeof onAddExpense === 'function') {
        onAddExpense(newExpenseData);
      } else {
        setExpenses((prev) => [{ ...newExpenseData, id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}` }, ...prev]);
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!itemToDelete) return;
    setExpenses((prev) => prev.filter((item) => item.id !== itemToDelete));
    showToast('Expense deleted successfully!', 'delete');
    setItemToDelete(null);
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Expense Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-700 rounded-2xl p-6 text-white shadow-lg mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-rose-100 font-bold">
            Total Logged Expenses
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-1">
            ₦{totalExpenseSum.toLocaleString()}
          </h2>
        </div>
        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
          <TrendingDown className="w-8 h-8 text-rose-200" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-full sm:w-auto"
          >
            <option value="All">All Categories</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">Expense Title</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Note</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">
                    No expense entries found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-6 font-semibold text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-block bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-xs font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-medium whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {item.date}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 max-w-xs truncate">
                      {item.note || '-'}
                    </td>
                    <td className="py-4 px-6 font-bold text-rose-600 whitespace-nowrap">
                      -₦{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                       onClick={() => setItemToDelete(item.id)} 
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
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
                  Expense Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Supplies, Domain Renewal"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {budgets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Link to Budget (Optional)
                  </label>
                  <select
                    value={formData.budgetId}
                    onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="">None (Standalone Expense)</option>
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.category || b.name} (Cap: ₦{Number(b.limit || b.allocated || b.target).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
                  className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-500/20 transition"
                >
                  {editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}