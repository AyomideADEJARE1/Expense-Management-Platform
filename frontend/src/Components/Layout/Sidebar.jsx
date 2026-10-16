import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  FolderKanban, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart3,
  X 
} from 'lucide-react';
import { useAuth } from "../../Auth";

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { name: 'Transactions', icon: Receipt, path: 'transactions' },
  { name: 'Budgets', icon: PieChart, path: 'budgets' },
  { name: 'Categories', icon: FolderKanban, path: 'categories' },
  { name: 'Reports', icon: FileText, path: 'reports' },
  { name: 'Settings', icon: Settings, path: 'settings' },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const { user, logout, getInitials } = useAuth();
  const fullName = [
    user?.first_name || user?.firstName,
    user?.last_name || user?.lastName
  ].filter(Boolean).join(' ') || 'User';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0B0F19] text-white flex flex-col justify-between p-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between px-2 py-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-wide text-white">ExpenseTracker</span>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setActiveTab(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer Card */}
        <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between px-2 mt-auto">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm ring-2 ring-blue-500/50 shrink-0">
        {getInitials(
          user?.first_name || user?.firstName,
          user?.last_name || user?.lastName
        )}
      </div>
      <div className="text-left truncate">
        <p className="text-sm font-semibold text-white truncate">{fullName}</p>
        <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
      </div>
    </div>
    <button 
      onClick={logout}
      title="Log Out"
      type="button"
      className="text-gray-400 hover:text-rose-500 p-2 shrink-0 transition-colors rounded-lg hover:bg-gray-800"
    >
      <LogOut className="w-5 h-5" />
    </button>
  </div>
      </aside>
    </>
  );
}
