import React, { createContext, useContext, useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useToast } from './context/ToastContext';

const CURRENT_USER_KEY = 'expense_tracker_current_user';
const DB_USERS_KEY = 'expense_tracker_registered_users';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Retrieve active session
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Retrieve database of registered users
  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem(DB_USERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentMonthYear = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getInitials = (firstName = '', lastName = '') => {
    const f = firstName.trim().charAt(0).toUpperCase();
    const l = lastName.trim().charAt(0).toUpperCase();
    return `${f}${l}` || 'U';
  };

  const register = (firstName, lastName, email, password) => {
    const registeredUsers = getRegisteredUsers();

    // Check if user already exists
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      showToast('An account with this email already exists. Please log in.', 'error');
      return false;
    }

    const newProfile = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In production, never store plain text passwords
      phone: '+234 812 345 6789',
      currency: 'NGN (₦)',
      dateFormat: 'YYYY-MM-DD',
      budgetThreshold: 85,
      notifications: true,
      emailAlerts: true,
      twoFactor: false,
    };

    // Save to users database
    const updatedDb = [...registeredUsers, newProfile];
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(updatedDb));

    // Log user in automatically
    setUser(newProfile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
    showToast('Account created successfully!', 'success');
    return true;
  };

  const login = (email, password) => {
    const registeredUsers = getRegisteredUsers();
    const foundUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    
    if (!foundUser) {
      showToast('Invalid email or password. Please register if you do not have an account.', 'error');
      return false;
    }

    setUser(foundUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
    return true;
  };

  const updateUserProfile = (updatedProfile) => {
    setUser(updatedProfile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedProfile));
    // Also update in registered users list
    const registeredUsers = getRegisteredUsers();
    const updatedDb = registeredUsers.map((u) =>
      u.id === updatedProfile.id || u.email === updatedProfile.email ? updatedProfile : u
    );
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(updatedDb));
    showToast('Profile updated successfully!', 'success');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    showToast('You have been logged out successfully.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUserProfile,
        greeting: getGreeting(),
        currentMonthYear: getCurrentMonthYear(),
        getInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    showToast('An error occurred while accessing authentication.', 'error');
  }
  return context;
};

// Authentication Modal Component
export function AuthModal({ isDarkMode }) {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isRegistering) {
      if (!firstName) return;
      register(firstName, lastName, email, password);
    } else {
      login(email, password);
    }
  };

  const bgCard = isDarkMode
    ? 'bg-slate-800 text-white border-slate-700'
    : 'bg-white text-slate-900 border-slate-200';

  const inputBg = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className={`${bgCard} w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border space-y-6`}>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">
            {isRegistering ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRegistering
              ? 'Sign up to manage your financial dashboard'
              : 'Please sign in to access your dashboard'}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsRegistering(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegistering
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsRegistering(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegistering
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                    required={isRegistering}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Last Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all mt-2"
          >
            {isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Log In to Dashboard
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}