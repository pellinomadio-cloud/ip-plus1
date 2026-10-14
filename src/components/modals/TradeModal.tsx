import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUp, Clock, HelpCircle, Sparkles } from 'lucide-react';
import { CandleChart } from '../CandleChart';
import { AssetIcon } from '../AssetIcon';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import { formatCurrency } from '../../data/marketData';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, onOpenDeposit }) => {
  const { currentUser, placeQuickTrade, quickTrades } = useAuth();
  const { selectedAsset } = useMarket();

  const [investment, setInvestment] = useState<number>(50);
  const [duration, setDuration] = useState<number>(60);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const activeTrade = quickTrades.find(t => t.assetSymbol === selectedAsset.symbol && t.status === 'active') || null;
  const balance = currentUser?.balance || 0;
  const payout = Number((investment * 0.85).toFixed(2));

  const handleExecute = (type: 'buy' | 'sell') => {
    setStatusMsg(null);
    if (balance < investment) {
      setStatusMsg({
        type: 'error',
        text: `Insufficient balance ($${balance.toFixed(2)}). Please deposit funds to invest $${investment}.`
      });
      return;
    }

    const res = placeQuickTrade(
      selectedAsset.symbol,
      selectedAsset.name,
      type,
      investment,
      duration,
      selectedAsset.price,
      85
    );

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1500);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[#0E131E] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative text-white space-y-3">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AssetIcon iconType={selectedAsset.iconType} symbol={selectedAsset.symbol} size="sm" />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{selectedAsset.symbol}</h3>
              <p className="text-[10px] text-slate-400">{selectedAsset.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-emerald-400">
              {formatCurrency(selectedAsset.price)}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Candlestick Chart */}
        <CandleChart
          currentPrice={selectedAsset.price}
          symbol={selectedAsset.symbol}
          activeTrade={activeTrade}
          trades={quickTrades}
        />

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            <span>{statusMsg.text}</span>
            {statusMsg.type === 'error' && (
              <button
                onClick={onOpenDeposit}
                className="px-2 py-0.5 bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
              >
                Deposit
              </button>
            )}
          </div>
        )}

        {/* Investment & Duration Selectors */}
        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-[#141B27] border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Investment Capital ($)</span>
              <span className="font-mono text-amber-400 font-bold">${investment.toLocaleString()}</span>
            </div>
            
            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-amber-400 font-bold">$</span>
              <input
                type="number"
                min="5"
                step="10"
                value={investment || ''}
                onChange={(e) => setInvestment(Math.max(0, Number(e.target.value)))}
                className="w-full pl-7 pr-3 py-1.5 bg-[#0B0F17] border border-slate-700 rounded-lg font-mono font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                placeholder="Enter amount (e.g. 3000, 5000)"
              />
            </div>

            {/* High Presets */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar pt-0.5">
              {[50, 100, 500, 1000, 3000, 5000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestment(amt)}
                  className={`flex-1 py-1 px-2 rounded font-mono font-bold text-[11px] shrink-0 border transition-colors ${
                    investment === amt 
                      ? 'bg-amber-400 text-slate-950 border-amber-400' 
                      : amt >= 3000 
                        ? 'bg-[#1A2333] text-amber-300 border-amber-500/40' 
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-[#141B27] border border-slate-800 rounded-xl flex items-center justify-between gap-2">
            <span className="text-slate-400 text-xs font-medium">Expiration Time:</span>
            <div className="flex gap-1">
              {[30, 60, 120, 300].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDuration(s)}
                  className={`px-3 py-1 rounded font-bold text-xs transition-colors ${
                    duration === s ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {s >= 60 ? `${s / 60}m` : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Large SELL & BUY Buttons matching screenshot */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleExecute('sell')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#E02B37] hover:bg-[#c92430] active:scale-[0.98] text-white font-bold transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.8]" />
            </div>
            <div className="text-right">
              <span className="block text-base font-black">SELL</span>
              <span className="block text-[11px] font-mono opacity-90">{selectedAsset.price.toFixed(selectedAsset.price < 2 ? 5 : 2)}</span>
            </div>
          </button>

          <button
            onClick={() => handleExecute('buy')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#00B050] hover:bg-[#009945] active:scale-[0.98] text-white font-bold transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <ArrowUp className="w-4 h-4 stroke-[2.8]" />
            </div>
            <div className="text-right">
              <span className="block text-base font-black">BUY</span>
              <span className="block text-[11px] font-mono opacity-90">{selectedAsset.price.toFixed(selectedAsset.price < 2 ? 5 : 2)}</span>
            </div>
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-400">
          Payout: +85% (+${payout}) • Zero trading commissions
        </div>
      </div>
    </div>
  );
};

