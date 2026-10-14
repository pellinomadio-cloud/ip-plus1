import React, { useState } from 'react';
import { Clock, TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatNumber } from '../data/marketData';

export const HistoryView: React.FC = () => {
  const { positions, closedPositions, closeTrade, quickTrades } = useAuth();
  const { assets } = useMarket();
  const [tab, setTab] = useState<'open' | 'closed'>('open');

  const activeQuickTrades = quickTrades.filter(t => t.status === 'active');
  const finishedQuickTrades = quickTrades.filter(t => t.status !== 'active');

  const handleClose = (posId: string, symbol: string) => {
    const asset = assets.find(a => a.symbol === symbol);
    const currentPrice = asset ? asset.price : 0;
    closeTrade(posId, currentPrice);
  };

  const totalOpenCount = positions.length + activeQuickTrades.length;
  const totalClosedCount = closedPositions.length + finishedQuickTrades.length;

  return (
    <div className="space-y-4 pb-24 text-white">
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-[#141B27] rounded-xl border border-slate-800">
        <button
          onClick={() => setTab('open')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            tab === 'open' ? 'bg-[#F5BA31] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Open Trades ({totalOpenCount})
        </button>
        <button
          onClick={() => setTab('closed')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            tab === 'closed' ? 'bg-[#F5BA31] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Closed History ({totalClosedCount})
        </button>
      </div>

      {/* Content */}
      {tab === 'open' ? (
        totalOpenCount === 0 ? (
          <div className="p-12 bg-[#141B27] border border-slate-800/80 rounded-2xl text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Active Trades</h4>
            <p className="text-xs text-slate-400">Head to the Trade tab and click BUY or SELL to start trading.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Quick Option Trades */}
            {activeQuickTrades.map(qt => (
              <div
                key={qt.id}
                className="p-3.5 rounded-xl bg-gradient-to-r from-[#141B27] to-[#162132] border border-blue-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      qt.type === 'buy' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {qt.type} 1m
                    </span>
                    <span className="font-bold text-sm text-white">{qt.assetSymbol}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 animate-pulse">
                    ACTIVE
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Investment: <strong className="text-white">${qt.investment}</strong></span>
                  <span>Entry: <strong className="text-white">${qt.entryPrice}</strong></span>
                  <span>Payout: <strong className="text-emerald-400">+{qt.payoutPercent}%</strong></span>
                </div>
              </div>
            ))}

            {/* CFD Positions */}
            {positions.map(pos => {
              const liveAsset = assets.find(a => a.symbol === pos.symbol);
              const currentPrice = liveAsset ? liveAsset.price : pos.currentPrice;
              const priceDelta = pos.type === 'buy' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
              const livePnl = Number((priceDelta * pos.size).toFixed(2));
              const livePnlPct = Number(((livePnl / pos.margin) * 100).toFixed(2));
              const isProfit = livePnl >= 0;

              return (
                <div
                  key={pos.id}
                  className="p-4 rounded-xl bg-[#141B27] border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        pos.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {pos.type} {pos.leverage}x
                      </span>
                      <span className="font-bold text-sm text-white">{pos.symbol}</span>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${livePnl.toFixed(2)} ({isProfit ? '+' : ''}{livePnlPct.toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-800/80 text-slate-400">
                    <div>
                      <span className="block text-[10px]">Entry Price</span>
                      <span className="font-mono text-white font-semibold">${formatNumber(pos.entryPrice)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Mark Price</span>
                      <span className="font-mono text-white font-semibold">${formatNumber(currentPrice)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Margin</span>
                      <span className="font-mono text-white font-semibold">${formatNumber(pos.margin)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClose(pos.id, pos.symbol)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-xs font-bold text-slate-200 rounded-lg transition-colors"
                  >
                    Close Position Market
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        totalClosedCount === 0 ? (
          <div className="p-12 bg-[#141B27] border border-slate-800/80 rounded-2xl text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Trade History Yet</h4>
            <p className="text-xs text-slate-400">Closed positions and expired contracts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Finished Quick Trades */}
            {finishedQuickTrades.map(qt => {
              const isWon = qt.status === 'won';
              return (
                <div
                  key={qt.id}
                  className="p-3.5 rounded-xl bg-[#141B27] border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isWon ? 'WIN' : 'LOSS'} • {qt.type.toUpperCase()}
                      </span>
                      <span className="font-bold text-white">{qt.assetSymbol}</span>
                    </div>
                    <div className={`font-mono font-bold ${isWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWon ? '+' : ''}${qt.profit?.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Invested: ${qt.investment}</span>
                    <span>Entry: ${qt.entryPrice} → Exit: ${qt.closePrice || qt.entryPrice}</span>
                  </div>
                </div>
              );
            })}

            {/* Closed Positions */}
            {closedPositions.map(pos => {
              const isProfit = pos.pnl >= 0;

              return (
                <div
                  key={pos.id}
                  className="p-3.5 rounded-xl bg-[#141B27] border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pos.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {pos.type.toUpperCase()} {pos.leverage}x
                      </span>
                      <span className="font-bold text-white">{pos.symbol}</span>
                    </div>
                    <div className={`font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}{pos.pnlPercent}%)
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Entry: ${formatNumber(pos.entryPrice)} → Exit: ${formatNumber(pos.currentPrice)}</span>
                    <span>Margin: ${formatNumber(pos.margin)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
