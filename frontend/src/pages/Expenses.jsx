import { useState, useMemo } from 'react';
import ConfirmationModal from '../Components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Plus, Search, Filter, Edit3, Trash2, X, TrendingDown, Download } from 'lucide-react';

export default function Expenses({ categories = [], expenses = [], setExpenses, loadAppData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const { showToast } = useToast();
  const [itemToDelete, setItemToDelete] = useState(null);

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});
  }, [categories]);

  const [formData, setFormData] = useState({
    category_id: categories[0]?.id || '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category_id: expense.category_id || categories[0]?.id || '',
        amount: expense.amount || '',
        expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
        description: expense.description || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category_id: categories[0]?.id || '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount) return;

    const payload = {
      category_id: parseInt(formData.category_id, 10),
      amount: parseFloat(formData.amount),
      expense_date: formData.expense_date,
      description: formData.description,
    };

    try {
      if (editingExpense) {
        const updated = await api.put(`/expenses/${editingExpense.id}`, payload);
        setExpenses((prev) => prev.map((exp) => (exp.id === editingExpense.id ? updated : exp)));
        showToast('Expense updated successfully!', 'success');
      } else {
        const created = await api.post('/expenses', payload);
        setExpenses((prev) => [created, ...prev]);
        showToast('Expense added successfully!', 'success');
      }
      if (loadAppData) loadAppData();
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to save expense', 'error');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/expenses/${itemToDelete}`);
      setExpenses((prev) => prev.filter((item) => item.id !== itemToDelete));
      showToast('Expense deleted successfully!', 'delete');
      if (loadAppData) loadAppData();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.get('/expenses/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      showToast('Failed to export CSV', 'error');
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || String(item.category_id) === String(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const totalExpenseSum = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-rose-600 to-pink-700 rounded-2xl p-6 text-white shadow-lg mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-wider text-rose-100 font-bold">Total Logged Expenses</span>
          <h2 className="text-3xl font-extrabold mt-1">₦{totalExpenseSum.toLocaleString()}</h2>
        </div>
        <TrendingDown className="w-8 h-8 text-rose-200" />
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-xl px-3 py-2"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-xs uppercase font-semibold">
              <th className="py-3.5 px-6">Description</th>
              <th className="py-3.5 px-6">Category</th>
              <th className="py-3.5 px-6">Date</th>
              <th className="py-3.5 px-6">Amount</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredExpenses.map((item) => (
              <tr key={item.id}>
                <td className="py-4 px-6 font-semibold text-gray-900">{item.description}</td>
                <td className="py-4 px-6">
                  <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-xs font-semibold">
                    {categoryMap[item.category_id] || `ID: ${item.category_id}`}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">{item.expense_date}</td>
                <td className="py-4 px-6 font-bold text-rose-600">-₦{Number(item.amount).toLocaleString()}</td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-rose-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setItemToDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        message="Are you sure you want to delete this expense?"
        confirmText="Delete"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl shadow-md">
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