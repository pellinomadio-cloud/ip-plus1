import React from 'react';
import { 
  X, 
  Home, 
  TrendingUp, 
  Wallet, 
  Clock, 
  Settings, 
  MessageSquare, 
  LogOut, 
  ShieldCheck, 
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';
import { NavTab } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenDeposit: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenDeposit
}) => {
  const { currentUser, logout } = useAuth();

  if (!isOpen) return null;

  const navItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
    { tab: 'home', label: 'Dashboard Home', icon: Home },
    { tab: 'trade', label: 'Trading Terminal (Candle Chart)', icon: TrendingUp },
    { tab: 'wallet', label: 'Funds Wallet & Custody', icon: Wallet },
    { tab: 'history', label: 'Trade & Order History', icon: Clock },
    { tab: 'settings', label: 'Account & Security Settings', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer content */}
      <div className="relative w-80 max-w-[85vw] bg-[#0E131E] border-r border-slate-800 text-white flex flex-col justify-between p-5 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="space-y-5">
          {/* Top Logo & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <BrandLogo size="md" showTagline={true} />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Info Card */}
          <div className="p-3.5 bg-[#141B27] border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Live Account</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3" /> Level 2 Verified
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white truncate">{currentUser?.name}</h4>
              <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Balance</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formatCurrency(currentUser?.balance || 0)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="w-full mt-1 py-1.5 bg-[#26A17B] hover:bg-[#208f6d] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors font-mono"
            >
              <span>Deposit Crypto</span>
            </button>
          </div>

          {/* PWA Install Button Option */}
          <div className="pt-1">
            <PWAInstallButton variant="drawer" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    onSelectTab(item.tab);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white transition-colors text-left text-xs font-semibold group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sign Out */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
