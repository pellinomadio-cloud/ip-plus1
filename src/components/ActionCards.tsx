import React from 'react';
import { ChevronRight, BarChart3, Wallet, ArrowUpToLine, Coins, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ActionCardsProps {
  onOpenWallet: () => void;
  onOpenWithdraw: () => void;
  onOpenInvest: () => void;
  onOpenTrade: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onOpenWallet,
  onOpenWithdraw,
  onOpenInvest,
  onOpenTrade
}) => {
  const { hasPendingDeposit } = useAuth();

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
      {/* 1. Funds Wallet */}
      <button
        onClick={onOpenWallet}
        className={`group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-[#141B27] border transition-all text-left active:scale-[0.98] ${
          hasPendingDeposit 
            ? 'border-amber-400/50 bg-gradient-to-b from-[#1b1912] to-[#141B27]' 
            : 'border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31] shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400/20 text-[#F5BA31]" />
          </div>
          {hasPendingDeposit ? (
            <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 border border-amber-400/40 px-1 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
              <Clock className="w-2.5 h-2.5" />
              <span>PENDING</span>
            </span>
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
          )}
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-white leading-tight truncate">Funds</h3>
          <p className={`text-[9px] sm:text-[10px] leading-tight mt-0.5 truncate ${hasPendingDeposit ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
            {hasPendingDeposit ? 'In Review' : 'Wallet'}
          </p>
        </div>
      </button>

      {/* 2. Withdraw */}
      <button
        onClick={onOpenWithdraw}
        className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700/80 active:scale-[0.98] transition-all text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31] shrink-0">
            <ArrowUpToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F5BA31]" />
          </div>
          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-white leading-tight truncate">Withdraw</h3>
          <p className="text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5 truncate">Payout</p>
        </div>
      </button>

      {/* 3. Invest (in between Withdraw and Trade) */}
      <button
        onClick={onOpenInvest}
        className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-gradient-to-b from-[#14202c] to-[#121924] border border-emerald-500/30 hover:border-emerald-400/60 active:scale-[0.98] transition-all text-left shadow-sm"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">EARN</span>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-emerald-300 leading-tight truncate">Invest</h3>
          <p className="text-[9px] sm:text-[10px] text-emerald-400/80 leading-tight mt-0.5 truncate">Crypto Yield</p>
        </div>
      </button>

      {/* 4. Trade (Bright Gold Highlight Card) */}
      <button
        onClick={onOpenTrade}
        className="group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.98] shadow-lg shadow-amber-500/15 transition-all text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-950/15 flex items-center justify-center text-slate-950 shrink-0">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
          </div>
          <ChevronRight className="w-3 h-3 text-slate-950/70 group-hover:text-slate-950 transition-colors shrink-0" />
        </div>

        <div className="mt-2 sm:mt-2.5">
          <h3 className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-950 leading-tight truncate">Trade</h3>
          <p className="text-[9px] sm:text-[10px] text-slate-900 font-semibold leading-tight mt-0.5 truncate">Live Market</p>
        </div>
      </button>
    </div>
  );
};
