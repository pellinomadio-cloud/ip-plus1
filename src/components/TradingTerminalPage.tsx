import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Wallet, 
  ChevronDown, 
  Activity, 
  CandlestickChart, 
  LineChart, 
  Clock, 
  ArrowDownLeft, 
  ArrowUp, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  Search, 
  X,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  ArrowLeft
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { CandleChart } from './CandleChart';
import { TradingChat } from './TradingChat';
import { AssetIcon } from './AssetIcon';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatNumber } from '../data/marketData';
import { MarketAsset, QuickTrade } from '../types';

interface TradingTerminalPageProps {
  onOpenMenu: () => void;
  onOpenDeposit: () => void;
}

export const TradingTerminalPage: React.FC<TradingTerminalPageProps> = ({
  onOpenMenu,
  onOpenDeposit
}) => {
  const { currentUser, placeQuickTrade, quickTrades } = useAuth();
  const { assets, selectedAsset, setSelectedAsset } = useMarket();

  // Trading configuration states
  const [investment, setInvestment] = useState<number>(50);
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [timeframeLabel, setTimeframeLabel] = useState<string>('1m');

  // Full Screen modes
  const [isFullScreenChart, setIsFullScreenChart] = useState<boolean>(false);
  const [isFullScreenChat, setIsFullScreenChat] = useState<boolean>(false);

  // Modals & Drawers
  const [showAssetPicker, setShowAssetPicker] = useState<boolean>(false);
  const [showTimeframePicker, setShowTimeframePicker] = useState<boolean>(false);
  const [showInvestmentPicker, setShowInvestmentPicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [showChatDrawer, setShowChatDrawer] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [searchAsset, setSearchAsset] = useState<string>('');

  // Active trade feedback
  const [tradeNotice, setTradeNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [winCelebration, setWinCelebration] = useState<{ profit: number; symbol: string } | null>(null);

  // Active quick trade for this asset
  const activeTrade = quickTrades.find(t => t.assetSymbol === selectedAsset.symbol && t.status === 'active') || null;

  // Real-time countdown clock for active trade
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!activeTrade) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeTrade.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, [activeTrade]);

  // Check if recent trade just won
  useEffect(() => {
    const recentWon = quickTrades.find(t => t.status === 'won' && Date.now() - t.expiresAt < 4000);
    if (recentWon && recentWon.profit) {
      setWinCelebration({ profit: recentWon.profit, symbol: recentWon.assetSymbol });
      const timer = setTimeout(() => setWinCelebration(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [quickTrades]);

  const payoutRate = 85; // 85% payout standard
  const estimatedProfit = Number((investment * (payoutRate / 100)).toFixed(2));
  const totalPayout = Number((investment + estimatedProfit).toFixed(2));

  const handlePlaceTrade = (type: 'buy' | 'sell') => {
    setTradeNotice(null);

    const balance = currentUser?.balance || 0;
    if (balance < investment) {
      setTradeNotice({
        type: 'error',
        message: `Insufficient balance ($${balance.toFixed(2)}). Deposit funds to invest $${investment}.`
      });
      return;
    }

    const res = placeQuickTrade(
      selectedAsset.symbol,
      selectedAsset.name,
      type,
      investment,
      durationSeconds,
      selectedAsset.price,
      payoutRate
    );

    if (res.success) {
      setTradeNotice({ type: 'success', message: res.message });
      setTimeout(() => setTradeNotice(null), 3000);
    } else {
      setTradeNotice({ type: 'error', message: res.message });
    }
  };

  const formattedCurrentPrice = selectedAsset.price < 2 
    ? selectedAsset.price.toFixed(5) 
    : selectedAsset.price.toFixed(2);

  // Filtered asset list
  const filteredAssets = assets.filter(a => 
    a.symbol.toLowerCase().includes(searchAsset.toLowerCase()) || 
    a.name.toLowerCase().includes(searchAsset.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-white pb-20 select-none">
      {/* 1. TOP APP BAR matching screenshot */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-40">
        {/* Left Hamburger & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMenu}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo size="md" showTagline={false} />
        </div>

        {/* Right Balance Pill matching screenshot */}
        <button
          onClick={onOpenDeposit}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141B27] border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all"
        >
          <div className="w-5 h-5 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-sm text-white">
            {formatCurrency(currentUser?.balance || 0)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* 2. INSTRUMENT & TIMEFRAME SUB-BAR matching screenshot */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0B0F17] border-b border-slate-800/60 gap-2">
        {/* Asset Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowAssetPicker(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700 text-xs font-bold text-white transition-colors"
          >
            <AssetIcon iconType={selectedAsset.iconType} symbol={selectedAsset.symbol} size="sm" />
            <span className="tracking-tight">{selectedAsset.symbol}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Timeframe & Chart Style Controls */}
        <div className="flex items-center gap-1.5">
          {/* Timeframe dropdown pill */}
          <button
            onClick={() => setShowTimeframePicker(prev => !prev)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141B27] border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <span className="font-mono">{timeframeLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Area/Line toggle button */}
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-xl border transition-colors ${
              chartType === 'line'
                ? 'bg-amber-400/15 border-amber-400 text-amber-400'
                : 'bg-[#141B27] border-slate-800/80 text-slate-400 hover:text-white'
            }`}
            title="Line Chart"
          >
            <LineChart className="w-4 h-4" />
          </button>

          {/* Candlestick toggle button */}
          <button
            onClick={() => setChartType('candles')}
            className={`p-1.5 rounded-xl border transition-colors ${
              chartType === 'candles'
                ? 'bg-amber-400/15 border-amber-400 text-amber-400'
                : 'bg-[#141B27] border-slate-800/80 text-slate-400 hover:text-white'
            }`}
            title="Candlestick Chart"
          >
            <CandlestickChart className="w-4 h-4" />
          </button>

          {/* Full Screen Chart button for clear market view */}
          <button
            onClick={() => setIsFullScreenChart(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-bold text-xs transition-colors"
            title="Full Screen Chart (Observe Market Clear View)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Screen</span>
          </button>
        </div>
      </div>

      {/* Timeframe Picker Popover */}
      {showTimeframePicker && (
        <div className="px-3 py-1.5 bg-[#0D121B] border-b border-slate-800 flex gap-1.5 text-xs overflow-x-auto no-scrollbar">
          {['5s', '15s', '30s', '1m', '5m', '15m'].map(tf => (
            <button
              key={tf}
              onClick={() => {
                setTimeframeLabel(tf);
                setShowTimeframePicker(false);
              }}
              className={`px-3 py-1 rounded-lg font-mono font-bold ${
                timeframeLabel === tf ? 'bg-amber-400 text-slate-950' : 'bg-[#141B27] text-slate-400'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      )}

      {/* "Trading Made Easy" Educational Banner Toggle */}
      <div className="px-3 pt-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span><strong>How to trade:</strong> Predict if price goes UP or DOWN in 1 min.</span>
          </div>
          <button
            onClick={() => setShowGuide(prev => !prev)}
            className="text-[11px] text-amber-400 underline font-bold shrink-0 ml-1"
          >
            {showGuide ? 'Hide Guide' : 'Explain'}
          </button>
        </div>

        {/* Collapsible Easy Guide */}
        {showGuide && (
          <div className="mt-2 p-3 bg-[#121824] border border-slate-800 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Easy 3-Step Trading Guide
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
              <div className="p-2 bg-[#0A0E17] rounded-lg border border-slate-800">
                <strong className="text-amber-400 block font-mono">1. Select Investment</strong>
                Pick amount (e.g. $50) & 1 min timer.
              </div>
              <div className="p-2 bg-[#0A0E17] rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block font-mono">2. Choose BUY / SELL</strong>
                Click BUY if price rises, SELL if drops.
              </div>
              <div className="p-2 bg-[#0A0E17] rounded-lg border border-slate-800">
                <strong className="text-amber-400 block font-mono">3. Win +85% Return</strong>
                Correct prediction credits <strong className="text-white">${totalPayout}</strong>!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CANDLESTICK CHART AREA */}
      <div className="px-3 pt-2">
        <CandleChart
          currentPrice={selectedAsset.price}
          symbol={selectedAsset.symbol}
          activeTrade={activeTrade}
          trades={quickTrades}
          chartType={chartType}
          onToggleFullScreen={() => setIsFullScreenChart(true)}
        />
      </div>

      {/* Active Position Countdown Indicator */}
      {activeTrade && activeTrade.status === 'active' && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-slate-900/40 border border-blue-500/40 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              activeTrade.type === 'buy' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}>
              {activeTrade.type}
            </span>
            <span className="font-bold text-white">Entry: ${activeTrade.entryPrice}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300">Expires in:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              00:{timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Trade Notice Banner */}
      {tradeNotice && (
        <div className={`mx-3 mt-2 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          tradeNotice.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {tradeNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{tradeNotice.message}</span>
          </div>
          {tradeNotice.type === 'error' && (
            <button
              onClick={onOpenDeposit}
              className="px-2 py-0.5 bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
            >
              Deposit
            </button>
          )}
        </div>
      )}

      {/* Win Celebration Toast Modal */}
      {winCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-[#121824] border border-amber-400/40 rounded-3xl text-center shadow-2xl max-w-xs w-full space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-black text-white">TRADE WON!</h3>
            <p className="text-sm text-slate-300">{winCelebration.symbol} 1m contract expired in the money.</p>
            <div className="text-2xl font-black text-emerald-400 font-mono pt-1">
              +${winCelebration.profit.toFixed(2)} Profit
            </div>
          </div>
        </div>
      )}

      {/* 4. BOTTOM TRADE CONTROLS matching screenshot */}
      <div className="px-3 pt-3 space-y-3">
        {/* Row 1: Investment & Time Selectors */}
        <div className="grid grid-cols-2 gap-3">
          {/* Investment Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Investment Amount</label>
            <button
              type="button"
              onClick={() => setShowInvestmentPicker(prev => !prev)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#141B27] border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <span className="font-mono font-bold text-base text-amber-400">
                ${investment.toLocaleString()}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Time Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
            <button
              type="button"
              onClick={() => setShowTimePicker(prev => !prev)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#141B27] border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-sm text-white">
                  {durationSeconds >= 60 ? `${durationSeconds / 60} min` : `${durationSeconds} sec`}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Investment Popover Picker */}
        {showInvestmentPicker && (
          <div className="p-3.5 bg-[#121824] border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-100">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-bold text-white">Set Trade Amount</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvestment(prev => Math.max(5, prev - 100))}
                  className="px-2 py-1 rounded bg-slate-800 text-white font-mono font-bold hover:bg-slate-700"
                  title="Subtract $100"
                >
                  -$100
                </button>
                <button
                  onClick={() => setInvestment(prev => prev + 100)}
                  className="px-2 py-1 rounded bg-slate-800 text-white font-mono font-bold hover:bg-slate-700"
                  title="Add $100"
                >
                  +$100
                </button>
              </div>
            </div>

            {/* Direct Custom Amount Input */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Enter Custom Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-amber-400 text-sm">$</span>
                <input
                  type="number"
                  min="5"
                  max="100000"
                  step="10"
                  value={investment || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setInvestment(val);
                  }}
                  className="w-full pl-7 pr-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl font-mono font-bold text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="3000 or 5000"
                />
              </div>
            </div>

            {/* Quick Amount Preset Grid including high $3,000 and $5,000 buttons */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1.5">Preset High & Standard Amounts</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[50, 100, 250, 500, 1000, 2000, 3000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setInvestment(amt);
                      setShowInvestmentPicker(false);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      investment === amt
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20'
                        : amt >= 3000
                          ? 'bg-[#1A2333] text-amber-300 border-amber-500/40 hover:bg-amber-400/20'
                          : 'bg-[#161F2E] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Time Popover Picker */}
        {showTimePicker && (
          <div className="p-3 bg-[#121824] border border-slate-800 rounded-xl space-y-1.5 animate-in fade-in duration-100">
            <span className="text-xs text-slate-400 block mb-1">Contract Duration</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { sec: 30, label: '30 sec' },
                { sec: 60, label: '1 min' },
                { sec: 120, label: '2 min' },
                { sec: 300, label: '5 min' }
              ].map(t => (
                <button
                  key={t.sec}
                  onClick={() => {
                    setDurationSeconds(t.sec);
                    setShowTimePicker(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    durationSeconds === t.sec
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-[#161F2E] text-slate-300 border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 2: SELL and BUY Buttons matching screenshot */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* SELL BUTTON (Red) */}
          <button
            onClick={() => handlePlaceTrade('sell')}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#E02B37] hover:bg-[#c92430] active:scale-[0.98] shadow-lg shadow-rose-900/30 transition-all text-white cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              {/* Diagonal downward-left arrow matching screenshot */}
              <ArrowDownLeft className="w-5 h-5 stroke-[2.8]" />
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black tracking-wide leading-tight">SELL</div>
              <div className="text-xs font-mono font-medium opacity-90 leading-tight mt-0.5">
                {formattedCurrentPrice}
              </div>
            </div>
          </button>

          {/* BUY BUTTON (Green) */}
          <button
            onClick={() => handlePlaceTrade('buy')}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#00B050] hover:bg-[#009945] active:scale-[0.98] shadow-lg shadow-emerald-900/30 transition-all text-white cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              {/* Upward arrow matching screenshot */}
              <ArrowUp className="w-5 h-5 stroke-[2.8]" />
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black tracking-wide leading-tight">BUY</div>
              <div className="text-xs font-mono font-medium opacity-90 leading-tight mt-0.5">
                {formattedCurrentPrice}
              </div>
            </div>
          </button>
        </div>

        {/* Payout Information note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
          <span>Profit Payout: <strong className="text-emerald-400 font-mono">+{payoutRate}%</strong> (+${estimatedProfit})</span>
          <span>Return on Win: <strong className="text-white font-mono">${totalPayout}</strong></span>
        </div>
      </div>

      {/* Live Trader Chat Trigger & Container */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatDrawer(prev => !prev)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Trader Community Room & Signals</span>
            </div>
            <span className="text-[11px] text-amber-400 font-bold">
              {showChatDrawer ? 'Close' : 'Open Chat (1,482 online)'}
            </span>
          </button>

          <button
            onClick={() => setIsFullScreenChat(true)}
            className="px-3 py-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            title="Open Chat in Full Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Screen</span>
          </button>
        </div>

        {showChatDrawer && (
          <div className="mt-2 animate-in fade-in duration-150">
            <TradingChat
              symbol={selectedAsset.symbol}
              onClose={() => setShowChatDrawer(false)}
              isDrawer={false}
              onToggleFullScreen={() => setIsFullScreenChat(true)}
              onOpenFullScreenChart={() => setIsFullScreenChart(true)}
              currentPrice={selectedAsset.price}
            />
          </div>
        )}
      </div>

      {/* FULL SCREEN CHART OVERLAY (Observe Market Clear View) */}
      {isFullScreenChart && (
        <div className="fixed inset-0 z-50 bg-[#06090F] flex flex-col text-white animate-in fade-in zoom-in-95 duration-150 overflow-y-auto select-none">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#0A0E17] border-b border-slate-800 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreenChart(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Back to Terminal"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Asset Selector */}
              <button
                onClick={() => setShowAssetPicker(true)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#141B27] border border-slate-800 text-xs font-bold text-white hover:border-slate-700"
              >
                <AssetIcon iconType={selectedAsset.iconType} symbol={selectedAsset.symbol} size="sm" />
                <span>{selectedAsset.symbol}</span>
                <span className="font-mono text-amber-400 font-extrabold">{formattedCurrentPrice}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Balance Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#141B27] border border-slate-800 text-xs font-mono font-bold text-emerald-400">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatCurrency(currentUser?.balance || 0)}</span>
              </div>

              {/* Open Full Screen Chat Button */}
              <button
                onClick={() => {
                  setIsFullScreenChart(false);
                  setIsFullScreenChat(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-bold text-xs transition-colors"
                title="Full Screen Trading Chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Chat</span>
              </button>

              {/* Exit Full Screen */}
              <button
                onClick={() => setIsFullScreenChart(false)}
                className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Exit Full Screen"
              >
                <Minimize2 className="w-5 h-5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Sub-bar Timeframe & Controls */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0A0D14] border-b border-slate-800/80 gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {['5s', '15s', '30s', '1m', '5m', '15m'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframeLabel(tf)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors ${
                    timeframeLabel === tf ? 'bg-amber-400 text-slate-950' : 'bg-[#141B27] text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Observe Market Clear View</span>
              </div>
            </div>
          </div>

          {/* Active Position Banner if running */}
          {activeTrade && activeTrade.status === 'active' && (
            <div className="mx-3 mt-2 p-2 rounded-xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-slate-900/40 border border-blue-500/40 flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  activeTrade.type === 'buy' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}>
                  {activeTrade.type}
                </span>
                <span className="font-bold text-white">Entry: ${activeTrade.entryPrice}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Expires in:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          {/* Expanded Chart Canvas */}
          <div className="flex-1 px-2 py-2 flex flex-col justify-center w-full min-h-[460px] sm:min-h-[580px]">
            <CandleChart
              currentPrice={selectedAsset.price}
              symbol={selectedAsset.symbol}
              activeTrade={activeTrade}
              trades={quickTrades}
              chartType={chartType}
              isFullScreen={true}
              onToggleFullScreen={() => setIsFullScreenChart(false)}
            />
          </div>

          {/* Bottom Order Execution Panel in Full Screen Chart */}
          <div className="p-3 bg-[#0A0E17] border-t border-slate-800 space-y-2 sticky bottom-0 z-40">
            {/* Quick Investment & Duration */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                <span className="text-slate-400 font-medium shrink-0">Invest:</span>
                {[100, 500, 1000, 3000, 5000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setInvestment(amt)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all shrink-0 ${
                      investment === amt
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : amt >= 3000
                          ? 'bg-[#1A2333] text-amber-300 border-amber-500/40 hover:bg-amber-400/20'
                          : 'bg-[#141B27] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="relative flex items-center">
                  <span className="absolute left-2 font-mono text-amber-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    min="5"
                    step="50"
                    value={investment || ''}
                    onChange={(e) => setInvestment(Math.max(0, Number(e.target.value)))}
                    className="w-24 pl-5 pr-2 py-1 bg-[#141B27] border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    placeholder="Custom $"
                  />
                </div>

                <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px] shrink-0 bg-[#141B27] px-2 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>1 min</span>
                </div>
              </div>
            </div>

            {/* BUY / SELL Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePlaceTrade('sell')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#E02B37] hover:bg-[#c92430] active:scale-[0.98] shadow-lg shadow-rose-900/40 text-white font-bold cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.8]" />
                </div>
                <div className="text-right">
                  <div className="text-base font-black tracking-wide">SELL</div>
                  <div className="text-[11px] font-mono opacity-90">${investment.toLocaleString()}</div>
                </div>
              </button>

              <button
                onClick={() => handlePlaceTrade('buy')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#00B050] hover:bg-[#009945] active:scale-[0.98] shadow-lg shadow-emerald-900/40 text-white font-bold cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 stroke-[2.8]" />
                </div>
                <div className="text-right">
                  <div className="text-base font-black tracking-wide">BUY</div>
                  <div className="text-[11px] font-mono opacity-90">${investment.toLocaleString()}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN CHAT OVERLAY */}
      {isFullScreenChat && (
        <div className="fixed inset-0 z-50 bg-[#06090F] flex flex-col text-white animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex-1 flex flex-col h-full">
            <TradingChat
              symbol={selectedAsset.symbol}
              onClose={() => setIsFullScreenChat(false)}
              isDrawer={false}
              isFullScreen={true}
              onToggleFullScreen={() => setIsFullScreenChat(false)}
              onOpenFullScreenChart={() => {
                setIsFullScreenChat(false);
                setIsFullScreenChart(true);
              }}
              currentPrice={selectedAsset.price}
            />
          </div>

          {/* Quick Trade Action Ribbon at bottom of Full Screen Chat */}
          <div className="p-2.5 bg-[#0A0E17] border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{selectedAsset.symbol}</span>
              <span className="font-mono text-amber-400 font-bold">${formattedCurrentPrice}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlaceTrade('sell')}
                className="px-3 py-1.5 bg-[#E02B37] hover:bg-[#c92430] text-white font-black rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>SELL ${investment}</span>
              </button>
              <button
                onClick={() => handlePlaceTrade('buy')}
                className="px-3 py-1.5 bg-[#00B050] hover:bg-[#009945] text-white font-black rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>BUY ${investment}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121824] border border-slate-800 rounded-3xl p-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Select Trading Instrument</h3>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search instrument..."
                value={searchAsset}
                onChange={(e) => setSearchAsset(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredAssets.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowAssetPicker(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                    selectedAsset.symbol === asset.symbol
                      ? 'bg-amber-400/10 border border-amber-400/40 text-amber-300'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AssetIcon iconType={asset.iconType} symbol={asset.symbol} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white">{asset.symbol}</div>
                      <div className="text-[10px] text-slate-400">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-white">
                      {formatCurrency(asset.price)}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold font-mono">
                      +85% Payout
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
