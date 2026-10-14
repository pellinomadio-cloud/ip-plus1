import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  X, 
  Sparkles, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import { QuickTrade } from '../../types';
import { AssetIcon } from '../AssetIcon';

interface TradeResultModalProps {
  trade: QuickTrade | null;
  onClose: () => void;
  onTradeAgain?: () => void;
}

export const TradeResultModal: React.FC<TradeResultModalProps> = ({ trade, onClose, onTradeAgain }) => {
  if (!trade) return null;

  const isWon = trade.status === 'won' || (trade.profit !== undefined && trade.profit > 0);
  const profitAmount = trade.profit !== undefined ? Math.abs(trade.profit) : 0;
  const totalPayout = isWon ? Number((trade.investment + profitAmount).toFixed(2)) : 0;
  const payoutRate = trade.payoutPercent || 85;

  const formatPrice = (val?: number) => {
    if (val === undefined) return '---';
    return val < 10 ? val.toFixed(5) : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all duration-300 relative overflow-hidden ${
          isWon 
            ? 'bg-gradient-to-b from-[#101D19] via-[#0D1815] to-[#0A1012] border-emerald-500/40 shadow-emerald-950/50' 
            : 'bg-gradient-to-b from-[#1F1316] via-[#170E10] to-[#0E0A0B] border-rose-500/30 shadow-rose-950/50'
        }`}
      >
        {/* Decorative Top Ambient Glow */}
        <div 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isWon ? 'bg-emerald-400' : 'bg-rose-500'
          }`} 
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Result Header & Icon */}
        <div className="text-center relative z-10 pt-2 pb-4">
          {isWon ? (
            <div className="inline-flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-slate-950 font-bold animate-bounce">
                  <Trophy className="w-10 h-10 text-slate-950 fill-current" />
                </div>
                <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full p-1 shadow-md">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trade Expired — Won!</span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                🎉 Congratulations!
              </h3>
              <p className="text-xs text-emerald-300/80 mt-1 max-w-xs">
                Your market forecast was spot on. Here are the details of your profit:
              </p>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white font-bold mb-3">
                <TrendingDown className="w-10 h-10 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-extrabold uppercase tracking-wider mb-2">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Trade Expired — Outcome</span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                Trade Closed
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                The market price moved against your order direction. Review the details below:
              </p>
            </div>
          )}
        </div>

        {/* Big Profit / Payout Banner */}
        <div 
          className={`p-4 rounded-2xl border text-center my-3 relative overflow-hidden ${
            isWon 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {isWon ? 'Net Profit Earned' : 'Amount Invested'}
          </div>

          <div className="text-3xl font-black font-mono tracking-tight flex items-center justify-center gap-1">
            {isWon ? (
              <span className="text-emerald-400 flex items-center">
                +${profitAmount.toFixed(2)}
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                -${trade.investment.toFixed(2)}
              </span>
            )}
          </div>

          {isWon && (
            <div className="mt-2 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs text-emerald-200">
              <span className="text-slate-400">Total Payout Credited:</span>
              <span className="font-bold font-mono text-emerald-400 text-sm">${totalPayout.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Detailed Trade Breakdown */}
        <div className="bg-[#101622] rounded-2xl p-4 border border-slate-800 space-y-3 my-4 text-xs">
          {/* Asset Info Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <AssetIcon iconType="forex" symbol={trade.assetSymbol} size="sm" />
              <div>
                <div className="font-extrabold text-sm text-white">{trade.assetSymbol}</div>
                <div className="text-[10px] text-slate-400">{trade.assetName}</div>
              </div>
            </div>

            <div className="text-right">
              <span 
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                  trade.type === 'buy' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {trade.type === 'buy' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trade.type === 'buy' ? 'CALL / BUY' : 'PUT / SELL'}
              </span>
            </div>
          </div>

          {/* Trade Math Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Entry Price</span>
              <span className="text-xs font-bold font-mono text-white mt-0.5 block">
                ${formatPrice(trade.entryPrice)}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Expiry Close Price</span>
              <span className={`text-xs font-bold font-mono mt-0.5 block ${isWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${formatPrice(trade.closePrice)}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Investment</span>
              <span className="text-xs font-bold font-mono text-white mt-0.5 block">
                ${trade.investment.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-medium block">Payout Yield</span>
              <span className="text-xs font-bold font-mono text-amber-400 mt-0.5 block">
                +{payoutRate}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Duration: {trade.durationSeconds}s
            </span>
            <span>
              Status: <strong className={isWon ? 'text-emerald-400' : 'text-rose-400'}>{isWon ? 'Profit Confirmed' : 'Expired Lost'}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {onTradeAgain ? (
            <button
              onClick={() => {
                onClose();
                onTradeAgain();
              }}
              className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                isWon 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-emerald-300 shadow-emerald-500/25' 
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 shadow-amber-500/25'
              }`}
            >
              <span>{isWon ? 'Place Another Trade' : 'Try Next Trade'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                isWon 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-emerald-300 shadow-emerald-500/25' 
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <span>Continue</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
