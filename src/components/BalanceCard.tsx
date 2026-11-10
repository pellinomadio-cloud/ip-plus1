import React, { useState } from 'react';
import { Eye, EyeOff, Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';
import { USD_TO_NGN_EXCHANGE_RATE } from '../data/countries';

export const BalanceCard: React.FC = () => {
  const {
    currentUser,
    hideBalance,
    toggleHideBalance,
    todayPnl,
    staffAccount,
    claimDailyGift,
    canClaimDailyGift,
    dailyRewardAmount,
    currentAccountLevel
  } = useAuth();
  const balance = currentUser?.balance ?? 0.00;
  const exchangeRate = staffAccount?.exchangeRateNgn || USD_TO_NGN_EXCHANGE_RATE;
  const balanceNgn = Math.round(balance * exchangeRate);

  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  const handleClaim = () => {
    const res = claimDailyGift();
    if (res.success) {
      setClaimFeedback(`+$${(res.amountAdded || dailyRewardAmount).toFixed(2)} Daily Reward Added!`);
      setTimeout(() => setClaimFeedback(null), 3500);
    } else {
      setClaimFeedback(res.message);
      setTimeout(() => setClaimFeedback(null), 3500);
    }
  };

  // Compute daily display stats
  const isPositive = todayPnl.amount >= 0;
  const pnlSign = isPositive ? '+' : '-';
  const pnlAmountStr = Math.abs(todayPnl.amount).toFixed(2);
  const pnlPercentStr = Math.abs(todayPnl.percent).toFixed(2);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131926] via-[#111722] to-[#161F2E] border border-slate-800/80 p-5 shadow-xl shadow-black/30 space-y-3">
      {/* Golden subtle ambient backlight glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        {/* Left balance stats */}
        <div className="z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs sm:text-sm font-medium">Total Balance</span>
            <button
              onClick={toggleHideBalance}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
              aria-label={hideBalance ? "Show balance" : "Hide balance"}
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-1.5 flex flex-col">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono tabular-nums">
              {hideBalance ? '••••••' : formatCurrency(balance)}
            </h2>
            {/* Naira Balance Display */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums">
                {hideBalance ? '••••••' : `≈ ₦${balanceNgn.toLocaleString()} NGN`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                (@ ₦{exchangeRate.toLocaleString()}/$)
              </span>
            </div>
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
        <div className="w-28 h-18 sm:w-36 sm:h-22 relative flex items-center justify-end shrink-0">
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

            <path
              d="M 10 65 L 20 62 L 28 68 L 38 52 L 48 58 L 60 42 L 72 48 L 88 32 L 98 38 L 115 22 L 128 26 L 148 10"
              stroke="#F5BA31"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadowFilter)"
            />

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

      {/* Daily Reward Claim Strip (Scales with Account Upgrade Level) */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              Daily Reward (${dailyRewardAmount.toFixed(2)}) · Level {currentAccountLevel}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {canClaimDailyGift
                ? `Tap to claim $${dailyRewardAmount.toFixed(2)} (Upgrade to increase)`
                : `Claimed today! Upgrade level to increase daily reward`}
            </span>
          </div>
        </div>

        {canClaimDailyGift ? (
          <button
            onClick={handleClaim}
            className="px-3 py-1.5 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.98] text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Claim ${dailyRewardAmount}</span>
          </button>
        ) : (
          <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Claimed</span>
          </span>
        )}
      </div>

      {claimFeedback && (
        <div className="p-2 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold text-center animate-in fade-in">
          {claimFeedback}
        </div>
      )}
    </div>
  );
};
