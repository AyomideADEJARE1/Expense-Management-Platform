import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Edit3, Trash2, X, Lock, CheckCircle2,
  Utensils, Car, ShoppingBag, Wifi, Film,
  Briefcase, HeartPulse, BookOpen, DollarSign, Gift, HelpCircle
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Car', icon: Car },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Wifi', icon: Wifi },
  { name: 'Film', icon: Film },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Gift', icon: Gift },
];

const COLOR_PALETTE = [
  { name: 'Blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hex: '#2563EB' },
  { name: 'Emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hex: '#10B981' },
  { name: 'Orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', hex: '#F97316' },
  { name: 'Purple', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hex: '#8B5CF6' },
  { name: 'Pink', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', hex: '#EC4899' },
  { name: 'Amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hex: '#F59E0B' },
  { name: 'Red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', hex: '#EF4444' },
];

const API_BASE_URL = 'http://127.0.0.1:5000/api'; // Adjust Flask API URL as needed

export default function Categories({ categories = [], setCategories }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Expense',
    icon: 'Utensils',
    color: 'Blue',
    description: '',
  });

  // Fetch Categories from Flask backend on component mount
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      showToast(err.message || 'Error connecting to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) => {
    if (activeFilter === 'All') return true;
    return cat.type === activeFilter;
  });

  const getIconComponent = (iconName) => {
    const iconObj = AVAILABLE_ICONS.find((i) => i.name === iconName);
    return iconObj ? iconObj.icon : HelpCircle;
  };

  const getColorConfig = (colorName) => {
    return COLOR_PALETTE.find((c) => c.name === colorName) || COLOR_PALETTE[0];
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      if (category.editable === false) {
        showToast('This core system category cannot be modified.', 'error');
        return;
      }
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'Expense',
        icon: 'Utensils',
        color: 'Blue',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  // Create or Update Category via Flask API
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        // PUT Request
        const response = await fetch(`${API_BASE_URL}/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update category');
        const updatedCat = await response.json();

        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updatedCat : c))
        );
        showToast('Category updated successfully!', 'success');
      } else {
        // POST Request
        const response = await fetch(`${API_BASE_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, isSystem: false, editable: true }),
        });

        if (!response.ok) throw new Error('Failed to create category');
        const newCat = await response.json();

        setCategories((prev) => [...prev, newCat]);
        showToast('Category created successfully!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Delete Category via Flask API
  const handleDelete = async () => {
    if (!itemToDelete) return;

    const categoryToTarget = categories.find((cat) => cat.id === itemToDelete);
    if (categoryToTarget?.editable === false) {
      showToast('Default categories cannot be deleted.', 'error');
      setItemToDelete(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');

      setCategories((prev) => prev.filter((cat) => cat.id !== itemToDelete));
      showToast('Category deleted successfully!', 'delete');
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
          <span>Add Category</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
        {['All', 'Expense', 'Income'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
              activeFilter === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {tab} Categories
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => {
            const IconComponent = getIconComponent(cat.icon);
            const colorConfig = getColorConfig(cat.color);

            return (
              <div
                key={cat.id}
                className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3.5 rounded-2xl ${colorConfig.bg} ${colorConfig.text}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                          cat.type === 'Income'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {cat.type}
                      </span>

                      {!cat.editable && (
                        <span className="p-1 text-gray-400 bg-gray-100 rounded-md" title="Locked system category">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{cat.description || 'No description added.'}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-400">
                    {cat.isSystem ? 'System Default' : 'Custom Category'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      disabled={!cat.editable}
                      className={`p-1.5 rounded-lg transition ${
                        cat.editable
                          ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setItemToDelete(cat.id)} 
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
        title="Delete Category?"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCategory ? 'Customize Category' : 'Create New Category'}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscriptions, Gifts"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Choose Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((iObj) => {
                    const IconComp = iObj.icon;
                    const isSelected = formData.icon === iObj.name;
                    return (
                      <button
                        type="button"
                        key={iObj.name}
                        onClick={() => setFormData({ ...formData, icon: iObj.name })}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Choose Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((col) => {
                    const isSelected = formData.color === col.name;
                    return (
                      <button
                        type="button"
                        key={col.name}
                        onClick={() => setFormData({ ...formData, color: col.name })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${
                          isSelected ? 'border-gray-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Short note about what goes in this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}