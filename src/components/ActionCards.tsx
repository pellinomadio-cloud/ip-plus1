import React from 'react';
import { ChevronRight, BarChart3, Crown, ArrowUpToLine, Users, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ActionCardsProps {
  onOpenUpgrade: () => void;
  onOpenWithdraw: () => void;
  onOpenCommunity: () => void;
  onOpenTrade: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onOpenUpgrade,
  onOpenWithdraw,
  onOpenCommunity,
  onOpenTrade
}) => {
  const { hasPendingDeposit } = useAuth();

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
      {/* 1. Beautiful Upgrade Button */}
      <button
        onClick={onOpenUpgrade}
        className={`group relative overflow-hidden flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 text-left active:scale-[0.97] cursor-pointer shadow-lg ${
          hasPendingDeposit
            ? 'border-amber-400/70 bg-gradient-to-br from-amber-500/20 via-[#181D2B] to-[#111722] shadow-amber-500/10'
            : 'border-amber-400/45 hover:border-amber-400 bg-gradient-to-br from-amber-500/15 via-[#151C2A] to-[#111722] hover:from-amber-500/25 shadow-amber-500/10'
        }`}
      >
        {/* Subtle top-right ambient glow */}
        <div className="absolute -top-6 -right-6 w-14 h-14 bg-amber-400/20 rounded-full blur-xl pointer-events-none group-hover:bg-amber-400/35 transition-all" />

        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#F5BA31] to-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950/20 stroke-[2.2]" />
          </div>
          {hasPendingDeposit ? (
            <span className="text-[8px] font-mono font-bold text-amber-300 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 animate-pulse" />
            </span>
          ) : (
            <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
          )}
        </div>

        <div className="relative z-10 mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors leading-tight truncate">
            Upgrade
          </h3>
          <p className="text-[9px] sm:text-[10px] font-semibold text-amber-400/95 leading-tight mt-0.5 truncate">
            {hasPendingDeposit ? 'In Review' : 'VIP Tiers'}
          </p>
        </div>
      </button>

      {/* 2. Withdraw */}
      <button
        onClick={onOpenWithdraw}
        className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-[#111722] border border-slate-800/90 hover:border-slate-700 active:scale-[0.98] transition-all text-left cursor-pointer"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31] shrink-0">
            <ArrowUpToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F5BA31]" />
          </div>
          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate">Withdraw</h3>
          <p className="text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5 truncate">NGN Bank</p>
        </div>
      </button>

      {/* 3. Community (in between Withdraw and Trade) */}
      <button
        onClick={onOpenCommunity}
        className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-[#111722] border border-slate-800/90 hover:border-slate-700 active:scale-[0.98] transition-all text-left cursor-pointer"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate">Community</h3>
          <p className="text-[9px] sm:text-[10px] text-emerald-400/90 leading-tight mt-0.5 truncate">Traders Hub</p>
        </div>
      </button>

      {/* 4. Trade (Primary Action Card) */}
      <button
        onClick={onOpenTrade}
        className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.98] shadow-md shadow-amber-500/10 transition-all text-left cursor-pointer"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-950/15 flex items-center justify-center text-slate-950 shrink-0">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
          </div>
          <ChevronRight className="w-3 h-3 text-slate-950/70 group-hover:text-slate-950 transition-colors shrink-0" />
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs font-extrabold text-slate-950 leading-tight truncate">Trade</h3>
          <p className="text-[9px] sm:text-[10px] text-slate-900 font-semibold leading-tight mt-0.5 truncate">Live Market</p>
        </div>
      </button>
    </div>
  );
};
