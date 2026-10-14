import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';

export const BalanceCard: React.FC = () => {
  const { currentUser, hideBalance, toggleHideBalance, todayPnl } = useAuth();
  const balance = currentUser?.balance ?? 0.00;

  // Compute daily display stats
  const isPositive = todayPnl.amount >= 0;
  const pnlSign = isPositive ? '+' : '-';
  const pnlAmountStr = Math.abs(todayPnl.amount).toFixed(2);
  const pnlPercentStr = Math.abs(todayPnl.percent).toFixed(2);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131926] via-[#111722] to-[#161F2E] border border-slate-800/80 p-5 shadow-xl shadow-black/30">
      {/* Golden subtle ambient backlight glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        {/* Left balance stats */}
        <div className="z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs sm:text-sm font-medium">Total Balance</span>
            <button
              onClick={toggleHideBalance}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
              aria-label={hideBalance ? "Show balance" : "Hide balance"}
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-1.5 flex items-baseline gap-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono tabular-nums">
              {hideBalance ? '••••••' : formatCurrency(balance)}
            </h2>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm">
            <span className={`font-semibold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className="text-[10px]">{isPositive ? '▲' : '▼'}</span>
              <span>{pnlSign}${pnlAmountStr} ({pnlPercentStr}%)</span>
            </span>
            <span className="text-slate-400 font-normal">Today</span>
          </div>
        </div>

        {/* Right golden chart curve with arrow */}
        <div className="w-36 h-20 sm:w-44 sm:h-24 relative flex items-center justify-end shrink-0">
          <svg
            viewBox="0 0 160 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="goldGlow" x1="0" y1="80" x2="160" y2="10" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F5BA31" stopOpacity="0.3" />
                <stop offset="1" stopColor="#F5BA31" stopOpacity="1" />
              </linearGradient>
              <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F5BA31" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Glowing gold upward jagged trajectory exactly like the screenshot */}
            <path
              d="M 10 65 L 20 62 L 28 68 L 38 52 L 48 58 L 60 42 L 72 48 L 88 32 L 98 38 L 115 22 L 128 26 L 148 10"
              stroke="#F5BA31"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadowFilter)"
            />

            {/* Terminal arrowhead pointing up & right */}
            <path
              d="M 139 10 L 148 10 L 148 19"
              stroke="#F5BA31"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
