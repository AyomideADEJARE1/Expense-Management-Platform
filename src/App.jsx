import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth, AuthModal } from './Auth';
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
import { ToastProvider, useToast } from './context/ToastContext';
import { api } from './services/api';

function MainAppContent() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // State populated via Flask API
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Fetch data on load or auth change
  const loadAppData = useCallback(async () => {
    if (!user) return;
    try {
      const [catsRes, expsRes, bdgtsRes, mSumRes, cSumRes] = await Promise.all([
        api.get('/categories'),
        api.get('/expenses'),
        api.get('/budgets'),
        api.get('/summaries/monthly').catch(() => null),
        api.get('/summaries/category').catch(() => []),
      ]);

      setCategories(catsRes || []);
      setExpenses(expsRes || []);
      setBudgets(bdgtsRes || []);
      setMonthlySummary(mSumRes);
      setCategorySummary(cSumRes || []);
    } catch (err) {
      showToast('Failed to load application data', 'error');
    }
  }, [user, showToast]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Global Search Engine
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    expenses.forEach((exp) => {
      if (exp.description?.toLowerCase().includes(query)) {
        results.push({
          sourceType: 'Expense',
          tab: 'expenses',
          title: exp.description,
          subtitle: `Expense • ${exp.expense_date}`,
          amount: exp.amount,
        });
      }
    });

    budgets.forEach((b) => {
      results.push({
        sourceType: 'Budget',
        tab: 'budgets',
        title: `Category #${b.category_id} Budget`,
        subtitle: `Month: ${b.month} • Limit: ₦${b.amount?.toLocaleString()}`,
        amount: b.amount,
      });
    });

    categories.forEach((c) => {
      if (c.name?.toLowerCase().includes(query)) {
        results.push({
          sourceType: 'Category',
          tab: 'categories',
          title: c.name,
          subtitle: 'Category Item',
        });
      }
    });

    return results;
  }, [searchQuery, expenses, budgets, categories]);

  const handleSelectSearchResult = (result) => {
    setActiveTab(result.tab);
    setSearchQuery('');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-gray-900'
    }`}>
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
          notifications={[]}
          onClearNotifications={() => {}}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              budgets={budgets} 
              incomes={incomes} 
              transactions={expenses} 
              monthlySummary={monthlySummary}
              categorySummary={categorySummary}
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'expenses' && (
            <Expenses 
              categories={categories} 
              expenses={expenses} 
              setExpenses={setExpenses} 
              budgets={budgets} 
              loadAppData={loadAppData}
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'budgets' && (
            <Budgets 
              categories={categories} 
              budgets={budgets} 
              setBudgets={setBudgets} 
              loadAppData={loadAppData}
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'categories' && (
            <Categories 
              categories={categories} 
              setCategories={setCategories} 
              loadAppData={loadAppData}
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'reports' && (
            <Reports 
              monthlySummary={monthlySummary}
              categorySummary={categorySummary}
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'settings' && <Settings isDarkMode={isDarkMode} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}