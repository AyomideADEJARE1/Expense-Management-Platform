import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth, AuthModal } from './Auth';
import Sidebar from './Components/Layout/Sidebar';
import Header from './Components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
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

  // Fetch data on load or auth change
  const loadAppData = useCallback(async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const [catsRes, expsRes, bdgtsRes, mSumRes, cSumRes] = await Promise.all([
        api.get('/categories'),
        api.get('/expenses'),
        api.get('/budgets'),
        api.get(`/summaries/monthly?month=${currentMonth}`).catch(() => null),
        api.get(`/summaries/category?month=${currentMonth}`).catch(() => ({ data: [] })),
      ]);

      setCategories(catsRes?.data || []);
      setExpenses(expsRes?.data || []);
      
      const expenseData = expsRes?.data || [];
      const budgetData = bdgtsRes?.data || [];

      setBudgets(
        budgetData.map((budget) => {
          const budgetMonth = String(budget.month || '').slice(0, 7);

          const spent = expenseData
            .filter((expense) => {
              const expenseCategoryId =
                expense.category_id ?? expense.category?.id;

              const expenseDate =
                expense.expense_date ?? expense.date;

              return (
                Number(expenseCategoryId) === Number(budget.category_id) &&
                String(expenseDate || '').slice(0, 7) === budgetMonth
              );
            })
            .reduce(
              (total, expense) => total + Number(expense.amount || 0),
              0
            );

          return {
            ...budget,
            limit: Number(budget.amount || 0),
            spent,
          };
        })
      );
    

      setMonthlySummary(mSumRes?.data || null);
      setCategorySummary(cSumRes?.data || []);
    } catch {
      showToast('Failed to load application data', 'error');
    }
  }, [user, showToast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
    loadAppData();
    }, 0);

    return () => clearTimeout(timeoutId);
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
          tab: 'transactions',
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
              transactions={expenses} 
              monthlySummary={monthlySummary}
              categorySummary={categorySummary}
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'transactions' && (
            <Transactions
              categories={categories}
              onTransactionChange={loadAppData}
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
