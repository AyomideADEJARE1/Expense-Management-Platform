import React, { useState } from 'react';
import ConfirmationModal from '../Components/ConfirmationModal';
import {useToast} from '../context/ToastContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Lock, 
  CheckCircle2,
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
  HelpCircle
} from 'lucide-react';

// Icon mapping options for customization
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

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Food & Dining', type: 'Expense', icon: 'Utensils', color: 'Orange', description: 'Restaurants, groceries, and fast food', isSystem: true, editable: true },
  { id: 2, name: 'Salary', type: 'Income', icon: 'DollarSign', color: 'Emerald', description: 'Monthly fixed earnings and wages', isSystem: true, editable: false },
  { id: 3, name: 'Transportation', type: 'Expense', icon: 'Car', color: 'Blue', description: 'Fuel, cab fares, and vehicle servicing', isSystem: true, editable: true },
  { id: 4, name: 'Utilities', type: 'Expense', icon: 'Wifi', color: 'Purple', description: 'Electricity, water, and internet bills', isSystem: true, editable: true },
  { id: 5, name: 'Shopping', type: 'Expense', icon: 'ShoppingBag', color: 'Red', description: 'Clothing, gadgets, and personal buys', isSystem: true, editable: true },
  { id: 6, name: 'Freelance', type: 'Income', icon: 'Briefcase', color: 'Emerald', description: 'Side gigs, contracts, and client projects', isSystem: false, editable: true },
];

export default function Categories({ categories, setCategories }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const { showToast, confirmAction } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Expense',
    icon: 'Utensils',
    color: 'Blue',
    description: '',
  });

  // Filter Categories by Type
  const filteredCategories = categories.filter((cat) => {
    if (activeFilter === 'All') return true;
    return cat.type === activeFilter;
  });

  // Helper to render icon
  const getIconComponent = (iconName) => {
    const iconObj = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const IconComp = iconObj ? iconObj.icon : HelpCircle;
    return IconComp;
  };

  // Helper to get color classes
  const getColorConfig = (colorName) => {
    return COLOR_PALETTE.find((c) => c.name === colorName) || COLOR_PALETTE[0];
  };

  // Open Modal
  const handleOpenModal = (category = null) => {
    if (category) {
      if (!category.editable) {
        alert('This core system category cannot be modified.');
        return;
      }
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        description: category.description,
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

  // Save Category (Create or Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, ...formData }
            : c
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        ...formData,
        isSystem: false,
        editable: true,
      };
      setCategories([...categories, newCategory]);
      showToast('Category created successfully!', 'success');
    }

    setIsModalOpen(false);
  };

  // Delete Category
  const handleDelete = (cat) => {
   if (!itemToDelete) return;

  // Find the target category object whether itemToDelete is an object or an ID
  const targetId = typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete;
  const categoryToTarget = typeof itemToDelete === 'object' 
    ? itemToDelete 
    : categories.find((cat) => cat.id === targetId);

  // Safely check if editable using optional chaining (?.)
  if (categoryToTarget?.editable === false) {
    showToast('Default categories cannot be deleted.', 'error');
    setItemToDelete(null);
    return;
  }

  // Remove category
  setCategories((prev) => prev.filter((cat) => cat.id !== targetId));
  
  if (typeof showToast === 'function') {
    showToast('Category deleted successfully!', 'delete');
  }

  setItemToDelete(null);
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter Tabs */}
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

      {/* Category Cards Grid */}
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
                {/* Icon Header & Badges */}
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

                {/* Details */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{cat.description || 'No description added.'}</p>
              </div>

              {/* Action Bar */}
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
            </div>
          );
        })}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
              {/* Name */}
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

              {/* Type */}
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

              {/* Icon Selector */}
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

              {/* Color Selector */}
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

              {/* Description */}
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

              {/* Modal Actions */}
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