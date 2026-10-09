import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useToast } from './context/ToastContext';
import { api, getAuthToken, setAuthToken, removeAuthToken } from './services/api';

const AuthContext = createContext(null);

function normalizeUser(payload) {
  const raw = payload?.data?.data ?? payload?.data ?? payload;
  if (!raw || typeof raw !== 'object') return null;
  const fullName = String(raw.full_name ?? raw.fullName ?? '').trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  return {
    ...raw,
    firstName: raw.firstName ?? raw.first_name ?? parts[0] ?? '',
    lastName: raw.lastName ?? raw.last_name ?? parts.slice(1).join(' '),
    email: raw.email ?? '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      const currentUser = normalizeUser(response);
      if (!currentUser) throw new Error('The server returned an invalid user response.');
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      removeAuthToken();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      if (!getAuthToken()) {
        if (active) setLoading(false);
        return;
      }
      try {
        await fetchCurrentUser();
      } catch {
        // A stale token is cleared by fetchCurrentUser; show the login form.
      }
    };

    initialize();

    const handleUnauthorized = () => {
      removeAuthToken();
      setUser(null);
      showToast('Your session has expired. Please log in again.', 'info');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchCurrentUser, showToast]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      const envelope = response?.data ?? response;
      const payload = envelope?.data ?? envelope;
      const token = payload?.access_token ?? payload?.token;
      if (!token) throw new Error(envelope?.message || response?.message || 'The server did not return an authentication token.');

      setAuthToken(token);
      const currentUser = payload.user
        ? normalizeUser(payload.user)
        : await fetchCurrentUser();
      if (currentUser) setUser(currentUser);
      showToast('Logged in successfully!', 'success');
      return true;
    } catch (error) {
      removeAuthToken();
      setUser(null);
      showToast(error.message || 'Unable to log in. Please check your details and try again.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName, lastName, email, password) => {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    try {
      const response = await api.post('/auth/register', {
        full_name: fullName,
        email: email.trim(),
        password,
      });
      if (response?.success === false) {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }
      showToast('Account created. Signing you in…', 'success');
      return await login(email, password);
    } catch (error) {
      showToast(error.message || 'Registration failed. Please try again.', 'error');
      return false;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setLoading(false);
    showToast('You have been logged out successfully.', 'info');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentMonthYear = () =>
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getInitials = (firstName = '', lastName = '') => {
    const first = (firstName || user?.firstName || '').trim().charAt(0).toUpperCase();
    const last = (lastName || user?.lastName || '').trim().charAt(0).toUpperCase();
    return `${first}${last}` || 'U';
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      greeting: getGreeting(),
      currentMonthYear: getCurrentMonthYear(),
      getInitials,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function AuthModal({ isDarkMode }) {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register(firstName, lastName, email, password);
      } else {
        await login(email, password);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardClass = isDarkMode
    ? 'bg-slate-800 text-white border-slate-700'
    : 'bg-white text-slate-900 border-slate-200';
  const inputClass = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className={`${cardClass} w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border space-y-6`}>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">{isRegistering ? 'Create Your Account' : 'Welcome Back'}</h2>
          <p className="text-xs text-slate-500">{isRegistering ? 'Sign up to manage your financial dashboard' : 'Please sign in to access your dashboard'}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button type="button" onClick={() => setIsRegistering(false)} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${!isRegistering ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Log In</button>
          <button type="button" onClick={() => setIsRegistering(true)} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${isRegistering ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="register-first-name">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input id="register-first-name" autoComplete="given-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="register-last-name">Last Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input id="register-last-name" autoComplete="family-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="auth-email">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input id="auth-email" autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" htmlFor="auth-password">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input id="auth-password" autoComplete={isRegistering ? 'new-password' : 'current-password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`} required minLength={6} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all mt-2">
            {isSubmitting ? 'Please wait…' : isRegistering ? <><UserPlus className="w-4 h-4" /> Create Account</> : <><LogIn className="w-4 h-4" /> Log In to Dashboard</>}
          </button>
        </form>
      </div>
    </div>
  );
}
