import React from 'react';
import { ChevronRight, BarChart3, Wallet, ArrowUpToLine } from 'lucide-react';

interface ActionCardsProps {
  onOpenWallet: () => void;
  onOpenWithdraw: () => void;
  onOpenTrade: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onOpenWallet,
  onOpenWithdraw,
  onOpenTrade
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {/* 1. Funds Wallet */}
      <button
        onClick={onOpenWallet}
        className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700/80 active:scale-[0.98] transition-all text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31]">
            {/* Wallet icon custom */}
            <Wallet className="w-4 h-4 fill-amber-400/20 text-[#F5BA31]" />
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>

        <div className="mt-3">
          <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Funds Wallet</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight mt-0.5">Manage your funds</p>
        </div>
      </button>

      {/* 2. Withdraw */}
      <button
        onClick={onOpenWithdraw}
        className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700/80 active:scale-[0.98] transition-all text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31]">
            <ArrowUpToLine className="w-4 h-4 text-[#F5BA31]" />
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>

        <div className="mt-3">
          <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">Withdraw</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight mt-0.5">Request withdrawal</p>
        </div>
      </button>

      {/* 3. Trade (Bright Gold Highlight Card) */}
      <button
        onClick={onOpenTrade}
        className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.98] shadow-lg shadow-amber-500/15 transition-all text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-8 h-8 rounded-lg bg-slate-950/10 flex items-center justify-center text-slate-950">
            <BarChart3 className="w-4 h-4 text-slate-950" />
          </div>
          <ChevronRight className="w-4 h-4 text-slate-950/70 group-hover:text-slate-950 transition-colors" />
        </div>

        <div className="mt-3">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-950 leading-tight">Trade</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-850 font-medium leading-tight mt-0.5">Start trading now</p>
        </div>
      </button>
    </div>
  );
};
