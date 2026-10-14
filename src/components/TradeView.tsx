import React, { useState, useId } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { AssetIcon } from './AssetIcon';
import { formatCurrency, formatNumber } from '../data/marketData';
import { MarketAsset } from '../types';

interface TradeViewProps {
  onOpenDeposit: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const TradeView: React.FC<TradeViewProps> = ({ onOpenDeposit, onClose, isModal = false }) => {
  const { currentUser, openTrade, positions } = useAuth();
  const { assets, selectedAsset, setSelectedAsset } = useMarket();
  const gradientId = useId();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [leverage, setLeverage] = useState<number>(10);
  const [margin, setMargin] = useState<string>('50');
  const [timeframe, setTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '1D'>('15M');
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const balance = currentUser?.balance || 0;
  const marginNum = parseFloat(margin) || 0;
  const positionValue = marginNum * leverage;
  const positionUnits = selectedAsset.price > 0 ? (positionValue / selectedAsset.price) : 0;

  // Liquidation price estimate
  const liqDistance = (selectedAsset.price * (1 / leverage)) * 0.9;
  const estLiqPrice = tradeType === 'buy'
    ? Math.max(0, selectedAsset.price - liqDistance)
    : selectedAsset.price + liqDistance;

  const handlePercentageMargin = (pct: number) => {
    if (balance <= 0) {
      setMargin('25');
      return;
    }
    const val = (balance * pct).toFixed(2);
    setMargin(val);
  };

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);

    if (marginNum <= 0) {
      setOrderFeedback({ type: 'error', message: 'Please specify margin amount.' });
      return;
    }

    if (balance < marginNum) {
      setOrderFeedback({
        type: 'error',
        message: `Insufficient balance ($${balance.toFixed(2)}). Fund your wallet to trade with $${marginNum.toFixed(2)} margin.`
      });
      return;
    }

    const res = openTrade(
      selectedAsset.symbol,
      selectedAsset.name,
      tradeType,
      marginNum,
      leverage,
      selectedAsset.price
    );

    if (res.success) {
      setOrderFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setOrderFeedback(null);
        if (onClose && isModal) onClose();
      }, 1400);
    } else {
      setOrderFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className={`space-y-4 text-white ${isModal ? 'p-1' : 'pb-24'}`}>
      {/* Asset Selector Header */}
      <div className="relative">
        <button
          onClick={() => setShowAssetSelector(prev => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-[#141B27] border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AssetIcon iconType={selectedAsset.iconType} symbol={selectedAsset.symbol} size="md" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">{selectedAsset.symbol}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium uppercase">
                  {selectedAsset.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedAsset.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-base font-bold font-mono text-white">
                {formatCurrency(selectedAsset.price)}
              </div>
              <div className={`text-xs font-semibold ${selectedAsset.changePercent24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedAsset.changePercent24h >= 0 ? '▲ +' : '▼ '}
                {selectedAsset.changePercent24h.toFixed(2)}%
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </button>

        {/* Dropdown Asset Picker */}
        {showAssetSelector && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAssetSelector(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#121824] border border-slate-800 rounded-2xl p-2 shadow-2xl max-h-72 overflow-y-auto space-y-1">
              {assets.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowAssetSelector(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                    selectedAsset.symbol === asset.symbol ? 'bg-amber-400/10 border border-amber-400/30' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AssetIcon iconType={asset.iconType} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-white">{formatCurrency(asset.price)}</div>
                    <div className={`text-[10px] font-semibold ${asset.changePercent24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.changePercent24h >= 0 ? '+' : ''}{asset.changePercent24h.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Interactive Price Chart Canvas */}
      <div className="bg-[#141B27] border border-slate-800/80 rounded-2xl p-4 space-y-3">
        {/* Timeframe Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 text-xs">
          <div className="flex gap-1">
            {(['1M', '5M', '15M', '1H', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  timeframe === tf ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>24h H: <strong className="text-white">${formatNumber(selectedAsset.high24h)}</strong></span>
            <span>24h L: <strong className="text-white">${formatNumber(selectedAsset.low24h)}</strong></span>
          </div>
        </div>

        {/* Dynamic SVG Candlestick / Line Chart */}
        <div className="h-44 sm:h-52 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5BA31" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F5BA31" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1="40" x2="400" y2="40" stroke="#1E293B" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="#1E293B" strokeDasharray="3 3" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#1E293B" strokeDasharray="3 3" />

            {/* Price Area fill */}
            <path
              d="M 10 120 Q 50 135 90 90 T 170 85 T 250 50 T 320 65 T 390 30 L 390 155 L 10 155 Z"
              fill={`url(#${gradientId})`}
            />

            {/* Price Line */}
            <path
              d="M 10 120 Q 50 135 90 90 T 170 85 T 250 50 T 320 65 T 390 30"
              fill="none"
              stroke="#F5BA31"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Real-time active price pulse marker */}
            <circle cx="390" cy="30" r="4.5" fill="#F5BA31" className="animate-pulse" />
            <circle cx="390" cy="30" r="9" stroke="#F5BA31" strokeWidth="1.5" fill="none" opacity="0.6" className="animate-ping" />
          </svg>

          {/* Current price marker banner */}
          <div className="absolute right-0 top-3 bg-amber-400 text-slate-950 font-mono text-xs font-black px-2 py-0.5 rounded shadow">
            {formatCurrency(selectedAsset.price)}
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {orderFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          orderFeedback.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          {orderFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{orderFeedback.message}</span>
        </div>
      )}

      {/* Trading Form */}
      <form onSubmit={handleExecuteOrder} className="bg-[#141B27] border border-slate-800/80 rounded-2xl p-4 space-y-4">
        {/* Order Direction Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0F17] rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTradeType('buy')}
            className={`py-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              tradeType === 'buy'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>BUY / LONG</span>
          </button>
          <button
            type="button"
            onClick={() => setTradeType('sell')}
            className={`py-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              tradeType === 'sell'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>SELL / SHORT</span>
          </button>
        </div>

        {/* Leverage Selection */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-300">Leverage Multiplier</span>
            <span className="font-mono font-bold text-amber-400">{leverage}x</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[2, 5, 10, 20, 50].map(lev => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  leverage === lev
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-[#0B0F17] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Margin Input */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-300">Margin Capital (USD)</span>
            <span className="text-slate-400">
              Avail: <strong className="text-white font-mono">{formatCurrency(balance)}</strong>
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
            <input
              type="number"
              min="5"
              step="1"
              required
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400/60"
              placeholder="50"
            />
          </div>

          {/* Quick Percentages */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[0.25, 0.5, 0.75, 1].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageMargin(pct)}
                className="py-1 rounded bg-[#0B0F17] border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              >
                {pct * 100}%
              </button>
            ))}
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Position Size:</span>
            <span className="font-mono text-white font-semibold">
              ${formatNumber(positionValue)} ({positionUnits.toFixed(4)} {selectedAsset.symbol.split('/')[0]})
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Est. Liquidation Price:</span>
            <span className="font-mono text-rose-400 font-semibold">${formatNumber(estLiqPrice)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Execution Fee:</span>
            <span className="font-mono text-emerald-400 font-semibold">$0.00 (0.00%)</span>
          </div>
        </div>

        {/* Insufficient balance helper */}
        {balance < marginNum && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Balance is ${balance.toFixed(2)}. Fund to trade.</span>
            </div>
            <button
              type="button"
              onClick={onOpenDeposit}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shrink-0"
            >
              Deposit
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
            tradeType === 'buy'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
          }`}
        >
          <span>
            {tradeType === 'buy' ? 'CONFIRM BUY / LONG' : 'CONFIRM SELL / SHORT'} {selectedAsset.symbol}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
