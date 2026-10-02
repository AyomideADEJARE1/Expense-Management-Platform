import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../Components/ConfirmationModal';

import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Wifi, 
  Film, 
  Briefcase,
  HeartPulse,
  BookOpen,
  DollarSign,
  Gift,
  HelpCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  Car,
  ShoppingBag,
  Wifi,
  Film,
  Briefcase,
  HeartPulse,
  BookOpen,
  DollarSign,
  Gift
};

export default function Budgets({ categories = [], budgets = [], setBudgets }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { showToast, confirmAction } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);

  // Filter Expense categories dynamically
  const expenseCategories = categories.filter((c) => c.type === 'Expense');

  // Form State
  const defaultExpenseCat = expenseCategories.length > 0 ? expenseCategories[0].name : '';
  const [formData, setFormData] = useState({
    category: defaultExpenseCat,
    limit: '',
    spent: '0',
  });

  // Calculate high-level summary metrics
  const totalLimit = budgets.reduce((acc, b) => acc + Number(b.limit), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent), 0);
  const totalOnTrack = budgets.filter((b) => Number(b.spent) <= Number(b.limit)).length;
  const totalExceeded = budgets.filter((b) => Number(b.spent) > Number(b.limit)).length;

  // Helper to render icon for dynamic categories
  const renderCategoryIcon = (catName) => {
    const matchedCategory = categories.find((c) => c.name === catName);
    const IconComponent = matchedCategory && ICON_MAP[matchedCategory.icon] ? ICON_MAP[matchedCategory.icon] : HelpCircle;
    return <IconComponent className="w-6 h-6 text-blue-600" />;
  };

  // Open Modal for Create or Edit
  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category,
        limit: budget.limit,
        spent: budget.spent,
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: expenseCategories.length > 0 ? expenseCategories[0].name : '',
        limit: '',
        spent: '0',
      });
    }
    setIsModalOpen(true);
  };

  // Save Budget (Create / Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.limit || !formData.category) return;

    const limitVal = parseFloat(formData.limit);
    const spentVal = parseFloat(formData.spent || 0);

    if (editingBudget) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === editingBudget.id
            ? { ...b, category: formData.category, limit: limitVal, spent: spentVal }
            : b
        )
      );
      showToast('Budget updated successfully!', 'success');
    } else {
      const exists = budgets.find((b) => b.category === formData.category);
      if (exists) {
        showToast(`A budget for ${formData.category} already exists! Update that budget instead.`, 'error');
        return;
      }

      const newBudget = {
        id: Date.now(),
        category: formData.category,
        limit: limitVal,
        spent: spentVal,
      };
      showToast('Budget created successfully!', 'success');
      setBudgets([...budgets, newBudget]);
    }

    setIsModalOpen(false);
  };

  // Delete Budget
  const handleDelete = (id) => {
    if (!itemToDelete) return;
    setBudgets((prev) => prev.filter((b) => b.id !== itemToDelete));
    showToast('Budget deleted successfully!', 'delete');
    setItemToDelete(null);
  };
  
  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Summary Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Budget</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
            ₦{totalLimit.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Spent</p>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
            ₦{totalSpent.toLocaleString()}
          </h2>
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

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {budgets.map((b) => {
          const pct = Math.round((b.spent / b.limit) * 100);
          const isExceeded = b.spent > b.limit;
          const remaining = b.limit - b.spent;

          return (
            <div
              key={b.id}
              className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Header: Category Icon & Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-50">
                      {renderCategoryIcon(b.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{b.category}</h3>
                      <p className="text-xs text-gray-400 font-medium">Monthly Limit</p>
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
                    {/* Confirmation Modal Component */}
      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
      />
                  </div>
                </div>

                {/* Progress Numbers */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900">
                      ₦{b.spent.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-gray-400 ml-1">
                      / ₦{b.limit.toLocaleString()}
                    </span>
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

                {/* Progress Bar */}
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

              {/* Status Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                {isExceeded ? (
                  <span className="text-red-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Exceeded by ₦
                    {Math.abs(remaining).toLocaleString()}
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

      {/* Create / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                >
                  {expenseCategories.length === 0 ? (
                    <option value="">No expense categories available</option>
                  ) : (
                    expenseCategories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Spending Limit (₦)
                </label>
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Amount Already Spent (₦)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.spent}
                  onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
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