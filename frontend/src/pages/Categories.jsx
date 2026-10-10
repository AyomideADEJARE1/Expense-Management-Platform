import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { Plus, Edit3, Trash2, X, Folder } from 'lucide-react';

export default function Categories({
  categories = [],
  setCategories,
  loadAppData,
  isDarkMode = false,
}) {

  const pageStyle = isDarkMode
    ? 'bg-slate-900 text-slate-100'
    : 'bg-[#F8FAFC] text-gray-900';

  const cardStyle = isDarkMode
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200';

  const primaryText = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const secondaryText = isDarkMode ? 'text-slate-300' : 'text-gray-500';

  const inputStyle = isDarkMode
    ? 'bg-white text-gray-900 border-gray-300'
    : 'bg-gray-50 text-gray-900 border-gray-200';
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      try {
        const response = await api.get('/categories');
        setCategories(response?.data || []);
      } catch (err) {
        showToast(err.message || 'Error connecting to backend', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [setCategories, showToast]);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
      });
    }

    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();

    if (!name) {
      showToast('Category name is required.', 'error');
      return;
    }

    try {
      if (editingCategory) {
        const response = await api.put(
          `/categories/${editingCategory.id}`,
          {
            name,
            description: formData.description.trim(),
          }
        );

        const updatedCategory = response?.data;

        setCategories((prev) =>
          prev.map((category) =>
            category.id === editingCategory.id
              ? updatedCategory
              : category
          )
        );

        showToast('Category updated successfully!', 'success');
      } else {
        const response = await api.post('/categories', {
          name,
          description: formData.description.trim(),
        });

        const newCategory = response?.data;

        setCategories((prev) => [...prev, newCategory]);

        showToast('Category created successfully!', 'success');
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
      });
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/categories/${itemToDelete}`);

      setCategories((prev) =>
        prev.filter((category) => category.id !== itemToDelete)
      );

      showToast('Category deleted successfully!', 'delete');
    } catch (err) {
      showToast(
        err.message || 'Delete failed. The category may be in use.',
        'error'
      );
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <div className={`w-full min-h-screen p-4 sm:p-6 lg:p-8 ${pageStyle}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${primaryText}`}>Categories</h2>
          <p className={`text-sm ${secondaryText} mt-1`}>
            Organize your expenses into categories.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {loading ? (
        <div className={`text-center py-12 ${secondaryText}`}>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className={`${cardStyle} border rounded-2xl p-10 text-center`}>
          <Folder className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <h3 className={`text-lg font-bold ${primaryText} mb-1`}>
            No categories yet
          </h3>
          <p className={`text-xs ${secondaryText} line-clamp-2`}>
            Create your first expense category to get started.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`${cardStyle} p-6 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                    <Folder className="w-6 h-6" />
                  </div>

                  <span className={`block text-xs font-semibold ${secondaryText} mb-1`}>
                    Expense
                  </span>
                </div>

                <h3 className={`text-lg font-bold ${primaryText} mb-1`}>
                  {category.name}
                </h3>

                <p className={`text-xs ${secondaryText} line-clamp-2`}>
                  {category.description || 'No description added.'}
                </p>
              </div>

              <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} flex items-center justify-end gap-1`}>
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit category"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setItemToDelete(category.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
          <div className={`${cardStyle} rounded-2xl max-w-md w-full p-6 shadow-2xl relative`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} mb-4`}>
              <h3 className={`text-lg font-bold ${primaryText}`}>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category Name
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Food, Transport, Utilities"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className={`w-full ${inputStyle} border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                  <span className="font-normal text-gray-400">
                    {' '}
                    (Optional)
                  </span>
                </label>

                <textarea
                  rows="3"
                  placeholder="Short description of this expense category..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className={`w-full ${inputStyle} border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none`}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} mt-6`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                    isDarkMode
                      ? 'text-slate-200 hover:bg-slate-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                    isDarkMode
                      ? 'text-slate-200 hover:bg-slate-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
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
