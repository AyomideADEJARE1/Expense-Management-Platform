import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth, AuthModal } from './Auth'; // Adjust path if auth.jsx is in a subfolder like './context/auth'
import Sidebar from './Components/Layout/Sidebar';
import Header from './Components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { ToastProvider } from './context/ToastContext';


function MainAppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Light / Dark Mode Toggle State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('expense_tracker_theme') === 'dark';
  });

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextMode = !prev;
      localStorage.setItem('expense_tracker_theme', nextMode ? 'dark' : 'light');
      return nextMode;
    });
  };

  // --- Notifications State ---
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('expense_tracker_notifications');
      return saved ? JSON.parse(saved) : [
        { id: 1, title: 'Welcome!', message: 'Your financial dashboard is ready.', time: 'Just now', read: false }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title, message) => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // --- Data States with LocalStorage Persistence ---
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('expense_tracker_categories')) || []);
  const [budgets, setBudgets] = useState(() => JSON.parse(localStorage.getItem('expense_tracker_budgets')) || []);
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('expense_tracker_transactions')) || []);
  const [incomes, setIncomes] = useState(() => JSON.parse(localStorage.getItem('expense_tracker_incomes')) || []);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expense_tracker_expenses')) || []);

  // Sync Data
  useEffect(() => localStorage.setItem('expense_tracker_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('expense_tracker_incomes', JSON.stringify(incomes)), [incomes]);
  useEffect(() => localStorage.setItem('expense_tracker_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('expense_tracker_budgets', JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem('expense_tracker_categories', JSON.stringify(categories)), [categories]);

  // --- Action Handlers + Notifications ---
  const handleAddIncome = (incomeItem) => {
    const newId = incomeItem.id || Date.now();
    const numericAmount = Number(incomeItem.amount);
    const formattedIncome = { ...incomeItem, id: newId, amount: numericAmount };

    setIncomes((prev) => [formattedIncome, ...prev]);
    setTransactions((prev) => [{
      id: newId,
      date: incomeItem.date,
      desc: incomeItem.source,
      category: incomeItem.category,
      amount: numericAmount,
      type: 'Income',
    }, ...prev]);

    addNotification('Income Added', `Added ₦${numericAmount.toLocaleString()} from ${incomeItem.source}`);
  };

  const handleAddExpense = (expenseItem) => {
    const newId = expenseItem.id || Date.now();
    const numericAmount = Number(expenseItem.amount);

    setExpenses((prev) => [{ ...expenseItem, id: newId, amount: numericAmount }, ...prev]);
    setTransactions((prev) => [{
      id: newId,
      date: expenseItem.date,
      desc: expenseItem.title || expenseItem.desc || expenseItem.category,
      category: expenseItem.category,
      amount: numericAmount,
      type: 'Expense',
    }, ...prev]);

    setBudgets((prev) => prev.map((b) => {
      if (b.category.toLowerCase() === expenseItem.category.toLowerCase()) {
        const updatedSpent = Number(b.spent || 0) + numericAmount;
        if (updatedSpent > b.limit) {
          addNotification('Budget Alert ⚠️', `Budget limit exceeded for ${b.category}! Total spent: ₦${updatedSpent.toLocaleString()}`);
        }
        return { ...b, spent: updatedSpent };
      }
      return b;
    }));

    addNotification('Expense Recorded', `Recorded expense of ₦${numericAmount.toLocaleString()} for ${expenseItem.title || expenseItem.category}`);
  };

  const handleAddTransaction = (tx) => {
    if (tx.type === 'Income') handleAddIncome(tx);
    else handleAddExpense(tx);
  };

  // --- Global App Search Engine ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    // Search Transactions
    transactions.forEach((tx) => {
      if (tx.desc?.toLowerCase().includes(query) || tx.category?.toLowerCase().includes(query)) {
        results.push({
          sourceType: tx.type,
          tab: 'transactions',
          title: tx.desc || tx.category,
          subtitle: `Transaction • ${tx.date} • ${tx.category}`,
          amount: tx.amount,
        });
      }
    });

    // Search Budgets
    budgets.forEach((b) => {
      if (b.category?.toLowerCase().includes(query)) {
        results.push({
          sourceType: 'Budget',
          tab: 'budgets',
          title: `${b.category} Budget`,
          subtitle: `Spent ₦${b.spent.toLocaleString()} / Limit ₦${b.limit.toLocaleString()}`,
          amount: b.limit,
        });
      }
    });

    // Search Categories
    categories.forEach((c) => {
      if (c.name?.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)) {
        results.push({
          sourceType: 'Category',
          tab: 'categories',
          title: c.name,
          subtitle: `${c.type} Category • ${c.description || ''}`,
        });
      }
    });

    return results;
  }, [searchQuery, transactions, budgets, categories]);

  const handleSelectSearchResult = (result) => {
    setActiveTab(result.tab);
    setSearchQuery('');
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-gray-900'
    }`}>
      {/* Prompt Authentication Modal if user is not logged in */}
      {!user && <AuthModal isDarkMode={isDarkMode} />}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
      />

      <main className="flex-1 lg:ml-64 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <Header 
          activeTab={activeTab}
          toggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          onSelectSearchResult={handleSelectSearchResult}
          notifications={notifications}
          onClearNotifications={handleClearNotifications}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        <div className="space-y-6">
          {activeTab === 'dashboard' && <Dashboard budgets={budgets} incomes={incomes} transactions={transactions} isDarkMode={isDarkMode} />}
          {(activeTab === 'income' || activeTab === 'incomes') && <Income categories={categories} incomes={incomes} setIncomes={setIncomes} onAddIncome={handleAddIncome} isDarkMode={isDarkMode} />}
          {activeTab === 'expenses' && <Expenses categories={categories} expenses={expenses} setExpenses={setExpenses} budgets={budgets} onAddExpense={handleAddExpense} isDarkMode={isDarkMode} />}
          {activeTab === 'transactions' && <Transactions categories={categories} transactions={transactions} setTransactions={setTransactions} onAddTransaction={handleAddTransaction} isDarkMode={isDarkMode} />}
          {activeTab === 'budgets' && <Budgets categories={categories} budgets={budgets} setBudgets={setBudgets} onAddExpense={handleAddExpense} isDarkMode={isDarkMode} />}
          {activeTab === 'categories' && <Categories categories={categories} setCategories={setCategories} isDarkMode={isDarkMode} />}
          {activeTab === 'reports' && <Reports transactions={transactions} budgets={budgets} isDarkMode={isDarkMode} />}
          {activeTab === 'settings' && <Settings isDarkMode={isDarkMode} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}