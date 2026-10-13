import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../Components/ConfirmationModal';
import { api } from '../services/api';

import { 
  Plus, Edit3, Trash2, X, Utensils, Car, ShoppingBag, 
  Wifi, Film, Briefcase, HeartPulse, BookOpen, DollarSign, 
  Gift, HelpCircle, AlertTriangle, CheckCircle2 
} from 'lucide-react';

const ICON_MAP = {
  Utensils, Car, ShoppingBag, Wifi, Film, Briefcase, HeartPulse, BookOpen, DollarSign, Gift
};

export default function Budgets({ categories = [], budgets = [], setBudgets }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);

  const expenseCategories = categories.filter((c) => c.type === 'Expense');
  const defaultExpenseCatId = expenseCategories.length > 0 ? expenseCategories[0].id : '';

  const [formData, setFormData] = useState({
    categoryId: defaultExpenseCatId,
    limit: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  // Helper to map backend format (category_id, amount, month) to local component state
  const formatBudgetFromBackend = (b) => {
    const matchedCategory = categories.find((c) => c.id === b.category_id || c.name === b.category);
    return {
      id: b.id,
      categoryId: b.category_id,
      category: matchedCategory ? matchedCategory.name : (b.category || 'Uncategorized'),
      limit: Number(b.amount || b.limit || 0),
      spent: Number(b.spent || 0),
      month: b.month || new Date().toISOString().slice(0, 7),
    };
  };

  // Fetch Budgets using centralized API service
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.get('/budgets');
      setBudgets(data.map(formatBudgetFromBackend));
    } catch (err) {
      showToast(err.message || 'Error fetching budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [categories]);

  const totalLimit = budgets.reduce((acc, b) => acc + Number(b.limit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);
  const totalOnTrack = budgets.filter((b) => Number(b.spent) <= Number(b.limit)).length;
  const totalExceeded = budgets.filter((b) => Number(b.spent) > Number(b.limit)).length;

  const renderCategoryIcon = (catName) => {
    const matchedCategory = categories.find((c) => c.name === catName);
    const IconComponent = matchedCategory && ICON_MAP[matchedCategory.icon] ? ICON_MAP[matchedCategory.icon] : HelpCircle;
    return <IconComponent className="w-6 h-6 text-blue-600" />;
  };

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        categoryId: budget.categoryId,
        limit: budget.limit,
        month: budget.month || new Date().toISOString().slice(0, 7),
      });
    } else {
      setEditingBudget(null);
      setFormData({
        categoryId: expenseCategories.length > 0 ? expenseCategories[0].id : '',
        limit: '',
        month: new Date().toISOString().slice(0, 7),
      });
    }
    setIsModalOpen(true);
  };

  // Save Budget using backend payload contract (category_id, amount, month)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.limit || !formData.categoryId) return;

    const payload = {
      category_id: parseInt(formData.categoryId, 10),
      amount: parseFloat(formData.limit),
      month: formData.month,
    };

    try {
      if (editingBudget) {
        const updated = await api.put(`/budgets/${editingBudget.id}`, payload);
        const formatted = formatBudgetFromBackend(updated);

        setBudgets((prev) => prev.map((b) => (b.id === editingBudget.id ? formatted : b)));
        showToast('Budget updated successfully!', 'success');
      } else {
        const created = await api.post('/budgets', payload);
        const formatted = formatBudgetFromBackend(created);

        setBudgets((prev) => [...prev, formatted]);
        showToast('Budget created successfully!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Delete Budget via API service
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/budgets/${itemToDelete}`);
      setBudgets((prev) => prev.filter((b) => b.id !== itemToDelete));
      showToast('Budget deleted successfully!', 'delete');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Budget</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Budget</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">₦{totalLimit.toLocaleString()}</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Spent</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">₦{totalSpent.toLocaleString()}</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">On Track</p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-2">{totalOnTrack} Budgets</h2>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Exceeded</p>
            <h2 className="text-2xl font-extrabold text-red-500 mt-2">{totalExceeded} Budgets</h2>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500/20" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading budgets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
            const isExceeded = b.spent > b.limit;
            const remaining = b.limit - b.spent;

            return (
              <div
                key={b.id}
                className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-50">
                        {renderCategoryIcon(b.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{b.category}</h3>
                        <p className="text-xs text-gray-400 font-medium">Monthly Limit ({b.month})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(b)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(b.id)} 
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-2xl font-extrabold text-gray-900">₦{b.spent.toLocaleString()}</span>
                      <span className="text-sm font-semibold text-gray-400 ml-1">/ ₦{b.limit.toLocaleString()}</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        isExceeded
                          ? 'bg-red-50 text-red-500'
                          : pct >= 80
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {pct}% Spent
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-red-500'
                          : pct >= 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  {isExceeded ? (
                    <span className="text-red-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Exceeded by ₦{Math.abs(remaining).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">
                      Remaining: <strong className="text-gray-800">₦{remaining.toLocaleString()}</strong>
                    </span>
                  )}
                  <span className="text-gray-400">Monthly</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Budget?"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingBudget ? 'Update Budget Limit' : 'Create New Budget'}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select
                  disabled={Boolean(editingBudget)}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                >
                  {expenseCategories.length === 0 ? (
                    <option value="">No expense categories available</option>
                  ) : (
                    expenseCategories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Spending Limit (₦)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  {editingBudget ? 'Update Limit' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}