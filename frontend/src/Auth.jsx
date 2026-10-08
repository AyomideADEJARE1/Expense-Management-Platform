import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useToast } from './context/ToastContext';
import { api, getAuthToken, setAuthToken, removeAuthToken } from './services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      const userData = response.data || response;

      const nameParts = (userData.full_name || '').trim().split(/\s+/);

      const formatName = (name) =>
        name
          ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
          : '';

      setUser({
        ...userData,
        first_name: userData.first_name
          ? formatName(userData.first_name)
          : formatName(nameParts[0]),
        last_name: userData.last_name
          ? formatName(userData.last_name)
          : nameParts.slice(1).map(formatName).join(' '),
      });



    } catch {
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCurrentUser();
    }, 0);

    const handleUnauthorized = () => {
      setUser(null);
      showToast('Session expired. Please log in again.', 'info');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {

      clearTimeout(timer);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchCurrentUser, showToast]);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      const token = data.data?.access_token || data.data?.token;
      setAuthToken(token);
      await fetchCurrentUser();
      showToast('Logged in successfully!', 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Invalid email or password.', 'error');
      return false;
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
      await api.post('/auth/register', {
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      });
      showToast('Account created successfully! Logging you in...', 'success');
      return await login(email, password);
    } catch (err) {
      showToast(err.message || 'Registration failed. Try again.', 'error');
      return false;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    showToast('You have been logged out successfully.', 'info');
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
    const f = (firstName || user?.first_name || '').trim().charAt(0).toUpperCase();
    const l = (lastName || user?.last_name || '').trim().charAt(0).toUpperCase();
    return `${f}${l}` || 'U';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        greeting: getGreeting(),
        currentMonthYear: getCurrentMonthYear(),
        getInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Modal remains intact and connected to new auth logic
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
