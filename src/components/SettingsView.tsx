import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Bell, 
  LogOut, 
  RotateCcw, 
  Check, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  X,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';
import { AdminDashboard } from './AdminDashboard';

interface SettingsViewProps {
  onOpenAdminDashboard?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAdminDashboard }) => {
  const { currentUser, logout, depositFunds } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [resetNotice, setResetNotice] = useState(false);

  // Admin Console States
  const [showAdminPasswordPrompt, setShowAdminPasswordPrompt] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleResetToZero = () => {
    if (currentUser) {
      // Set balance directly to 0.00
      depositFunds(-currentUser.balance, 'Balance Reset to $0.00');
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 2000);
    }
  };

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    // Check MAVELL key securely without displaying it
    if (adminPasswordInput.trim().toUpperCase() === 'MAVELL') {
      setShowAdminPasswordPrompt(false);
      setAdminPasswordInput('');
      setAdminError(null);
      if (onOpenAdminDashboard) {
        onOpenAdminDashboard();
      }
    } else {
      setAdminError('Invalid admin password. Access denied.');
    }
  };

  return (
    <div className="space-y-4 pb-24 text-white relative">
      {/* Profile Card */}
      <div className="p-4 rounded-2xl bg-[#141B27] border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-lg">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-base truncate">{currentUser?.name || 'Trader'}</h4>
              <span className="flex items-center gap-0.5 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                <ShieldCheck className="w-3 h-3" /> KYC Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Account Number:</span>
          <span className="font-mono font-bold text-amber-400">{currentUser?.accountNumber || 'IQ-881230'}</span>
        </div>
      </div>

      {/* Security & Preferences */}
      <div className="p-4 rounded-2xl bg-[#141B27] border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Security & Access</h4>

        {/* 2FA Toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-400">Google Authenticator or YubiKey</p>
            </div>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              twoFactorEnabled ? 'bg-amber-400' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
              twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-slate-300" />
            <div>
              <p className="text-xs font-bold text-white">Price Alerts & Execution Notices</p>
              <p className="text-[11px] text-slate-400">Push notifications on trade triggers</p>
            </div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              notificationsEnabled ? 'bg-amber-400' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
              notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Account Controls */}
      <div className="p-4 rounded-2xl bg-[#141B27] border border-slate-800 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Controls</h4>

        {resetNotice && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
            Balance successfully reset to $0.00!
          </div>
        )}

        <button
          onClick={handleResetToZero}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Balance to $0.00</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Set to zero</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of IQ-PLUS</span>
        </button>
      </div>

      {/* Secret Admin Small Red Dot 🔴 Button at the bottom */}
      <div className="pt-6 pb-2 flex flex-col items-center justify-center space-y-1">
        <button
          type="button"
          onClick={() => setShowAdminPasswordPrompt(true)}
          className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:scale-125 hover:shadow-lg hover:shadow-rose-500/50 active:scale-95 transition-all cursor-pointer focus:outline-none ring-2 ring-rose-500/30"
          title="Admin Control"
          aria-label="Admin Control Red Dot"
        />
        <span className="text-[9px] text-slate-600 font-mono select-none">v2.4.0</span>
      </div>

      {/* Admin Password Modal Prompt */}
      {showAdminPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121824] border border-rose-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl text-white space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-white">Admin Dashboard Access</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminPasswordPrompt(false);
                  setAdminError(null);
                  setAdminPasswordInput('');
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter admin key to open user account balance controls and management console.
            </p>

            {adminError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter admin password..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordPrompt(false);
                    setAdminError(null);
                    setAdminPasswordInput('');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl transition-colors shadow-lg shadow-rose-500/20 cursor-pointer"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
