import React, { useState } from 'react';
import { User as UserIcon, LogOut, ShieldCheck, CreditCard, ChevronDown, Check, Bell } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { usePriceAlerts } from '../context/PriceAlertContext';
import { formatCurrency } from '../data/marketData';

interface HeaderProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDeposit, onOpenWithdraw }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { activeAlertsCount, openCreateAlertForAsset } = usePriceAlerts();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="relative flex items-center justify-between pt-2 pb-3 px-4 z-30">
      {/* Brand mark */}
      <BrandLogo size="md" showTagline={true} />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Price Alerts Bell Button */}
        <button
          onClick={() => openCreateAlertForAsset()}
          className="relative w-10 h-10 rounded-full border border-slate-700/80 bg-[#141B27] flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          title="Price Point Push Alerts"
          aria-label="Price Point Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-bold font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#070A0F] shadow-sm">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Profile menu trigger */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="w-10 h-10 rounded-full border border-slate-700/80 bg-[#141B27] flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            aria-label="User Profile"
          >
            <UserIcon className="w-5 h-5" />
          </button>

        {/* Profile Dropdown */}
        {showProfileMenu && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
              onClick={() => setShowProfileMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-72 bg-[#121824] border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Trading Account</span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="w-3 h-3" /> Tier 2 Verified
                  </span>
                </div>
                <h4 className="font-bold text-white text-base mt-1 truncate">
                  {currentUser?.name || 'Verified Trader'}
                </h4>
                <p className="text-xs text-slate-400 truncate">{currentUser?.email || 'trader@iq-plus.io'}</p>
                <div className="mt-2.5 flex items-center justify-between bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-xs text-slate-400">Account ID</span>
                  <span className="text-xs font-mono font-medium text-amber-400">{currentUser?.accountNumber || 'IQ-882194'}</span>
                </div>
              </div>

              <div className="py-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Available Balance:</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(currentUser?.balance || 0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenDeposit();
                    }}
                    className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1 font-mono"
                  >
                    <span>₮ Deposit USDT</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenWithdraw();
                    }}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg text-center transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  </header>
);
};

