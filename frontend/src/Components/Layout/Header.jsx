import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Menu, ArrowUpRight, ArrowDownRight, Folder, PieChart, X } from 'lucide-react';
import { useAuth } from "../../Auth";

export default function Header({ 
  toggleMobileSidebar, 
  activeTab = 'dashboard',
  searchQuery,
  setSearchQuery,
  searchResults = [],
  onSelectSearchResult,
  notifications = [],
  onClearNotifications,
  isDarkMode,
  onToggleTheme
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const { user, greeting, currentMonthYear, } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (tab) => {
    const titles = {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      income: 'Income',
      incomes: 'Income',
      expenses: 'Expenses',
      budgets: 'Budgets',
      categories: 'Categories',
      reports: 'Reports',
      settings: 'Settings'
    };
    return titles[tab] || 'Expense Tracker';
  };

  const bgCard = isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400';
  const hoverBg = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50';

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      {/* Dynamic Header Title & Mobile Hamburger */}
      <div className="flex items-center justify-between w-full lg:w-auto">
        <div>
          {activeTab === 'dashboard' ? (
            <>
              <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
  {greeting}, {user?.firstName || 'User'} <span className="inline-block animate-bounce">👋</span>
</h1>
              <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Here's your financial summary for {currentMonthYear}
              </p>
            </>
          ) : (
            <>
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {getPageTitle(activeTab)}
              </h1>
              <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage your {getPageTitle(activeTab).toLowerCase()} and records
              </p>
            </>
          )}
        </div>
        
        <button 
          onClick={toggleMobileSidebar}
          className={`lg:hidden p-2.5 rounded-xl border shadow-sm shrink-0 ${bgCard}`}
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Search, Notifications & Dark Mode Toggle */}
      <div className="flex items-center gap-3 w-full lg:w-auto relative">
        
        {/* 1. Global Search Box */}
        <div className="relative flex-1 lg:w-80" ref={searchRef}>
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search transactions, budgets, categories..." 
            className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition ${inputBg}`}
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto p-2 ${bgCard}`}>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No records found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      onSelectSearchResult(item);
                      setIsSearchOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${hoverBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                        {item.sourceType === 'Income' && <ArrowDownRight className="w-4 h-4 text-emerald-500" />}
                        {item.sourceType === 'Expense' && <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        {item.sourceType === 'Category' && <Folder className="w-4 h-4 text-purple-500" />}
                        {item.sourceType === 'Budget' && <PieChart className="w-4 h-4 text-orange-500" />}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                        <p className="text-[10px] text-gray-400">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold">
                      {item.amount ? `₦${Number(item.amount).toLocaleString()}` : item.sourceType}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* 2. Notification Box */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2.5 rounded-xl border shadow-sm transition shrink-0 ${bgCard}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className={`absolute right-0 top-full mt-2 w-80 border rounded-2xl shadow-xl z-50 p-4 space-y-3 ${bgCard}`}>
              <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearNotifications}
                    className="text-[11px] text-gray-400 hover:text-red-500 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No recent notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                        isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{notif.title}</span>
                        <span className="text-[10px] text-gray-400">{notif.time}</span>
                      </div>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Sun/Moon Light-Dark Mode Switcher */}
        <button 
          onClick={onToggleTheme}
          className={`p-2.5 rounded-xl border shadow-sm transition shrink-0 ${bgCard}`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>
    </header>
  );
}