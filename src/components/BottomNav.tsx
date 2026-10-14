import React from 'react';
import { Home, BarChart2, Wallet, Clock, Settings } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'trade' as NavTab, label: 'Trade', icon: BarChart2 },
    { id: 'wallet' as NavTab, label: 'Wallet', icon: Wallet },
    { id: 'history' as NavTab, label: 'History', icon: Clock },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-2">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive ? 'text-[#F5BA31]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`} 
              />
              <span className={`text-[11px] font-semibold mt-1 tracking-tight ${
                isActive ? 'text-[#F5BA31]' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
