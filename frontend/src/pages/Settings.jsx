import { useState, useEffect } from 'react';
import { 
  User, Mail, Bell, Save, Check, 
  Phone, Sliders 
} from 'lucide-react';
import { useAuth } from '../Auth';

export default function Settings({ isDarkMode }) {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [userProfile, setUserProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '+234 812 345 6789',
    currency: user?.currency || 'NGN (₦)',
    dateFormat: user?.dateFormat || 'YYYY-MM-DD',
    budgetThreshold: user?.budgetThreshold || 85,
    notifications: user?.notifications ?? true,
    emailAlerts: user?.emailAlerts ?? true,
    twoFactor: user?.twoFactor ?? false,
  });

  useEffect(() => {
    if (user) {
      // Synchronize editable from state when authenticated user data changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserProfile((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateUserProfile({
      ...user,
      ...userProfile,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900';
  const tabActive = 'bg-blue-600 text-white';
  const tabInactive = isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 p-1.5 rounded-xl border ${cardBg}`}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === 'profile' ? tabActive : tabInactive}`}
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === 'preferences' ? tabActive : tabInactive}`}
        >
          <Sliders className="w-4 h-4" /> Preferences
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === 'notifications' ? tabActive : tabInactive}`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className={`p-6 sm:p-8 rounded-2xl border shadow-sm ${cardBg} space-y-6`}>
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-3 border-slate-700/50">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={userProfile.firstName}
                    onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Last Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={userProfile.lastName}
                    onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-3 border-slate-700/50">Regional & Display</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Preferred Currency</label>
                <select
                  value={userProfile.currency}
                  onChange={(e) => setUserProfile({ ...userProfile, currency: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                >
                  <option value="NGN (₦)">NGN (₦) - Nigerian Naira</option>
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Budget Alert Threshold (%)</label>
                <input
                  type="number"
                  value={userProfile.budgetThreshold}
                  onChange={(e) => setUserProfile({ ...userProfile, budgetThreshold: Number(e.target.value) })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                  min="50"
                  max="100"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-3 border-slate-700/50">Notification Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-700/40 cursor-pointer">
                <span className="text-xs sm:text-sm font-semibold">In-App Push Notifications</span>
                <input
                  type="checkbox"
                  checked={userProfile.notifications}
                  onChange={(e) => setUserProfile({ ...userProfile, notifications: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-700/40 cursor-pointer">
                <span className="text-xs sm:text-sm font-semibold">Weekly Summary Email Alerts</span>
                <input
                  type="checkbox"
                  checked={userProfile.emailAlerts}
                  onChange={(e) => setUserProfile({ ...userProfile, emailAlerts: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Changes Saved!' : 'Save Settings'}
          </button>

          {isSaved && <span className="text-xs text-emerald-500 font-semibold">Profile updated successfully</span>}
        </div>
      </form>
    </div>
  );
}
