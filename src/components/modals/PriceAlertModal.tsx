import React, { useState, useEffect } from 'react';
import { usePriceAlerts } from '../../context/PriceAlertContext';
import { useMarket } from '../../context/MarketContext';
import { AssetIcon } from '../AssetIcon';
import { 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  VolumeX, 
  Star, 
  Smartphone, 
  Zap, 
  Info,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose }) => {
  const { assets, selectedAsset } = useMarket();
  const {
    activeAlerts,
    triggeredAlerts,
    notificationPermission,
    requestPermission,
    addAlert,
    removeAlert,
    clearTriggeredAlerts,
    toggleAlertSound,
    toggleFavoriteSymbol,
    isFavoriteSymbol,
    presetAssetForModal,
    testNotification,
  } = usePriceAlerts();

  const [activeTab, setActiveTab] = useState<'create' | 'active' | 'history'>('create');
  
  // Create Alert Form State
  const [selectedSymbol, setSelectedSymbol] = useState<string>(selectedAsset?.symbol || assets[0]?.symbol || 'BTC/USD');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || selectedAsset || assets[0];

  // Sync selected symbol when preset change or modal opens
  useEffect(() => {
    if (presetAssetForModal) {
      setSelectedSymbol(presetAssetForModal);
      const matchingAsset = assets.find(a => a.symbol === presetAssetForModal);
      if (matchingAsset) {
        setTargetPrice(matchingAsset.price.toString());
      }
    } else if (selectedAsset) {
      setSelectedSymbol(selectedAsset.symbol);
      setTargetPrice(selectedAsset.price.toString());
    }
  }, [presetAssetForModal, selectedAsset, isOpen, assets]);

  // Update target price when user changes asset selection
  const handleAssetSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    const asset = assets.find(a => a.symbol === symbol);
    if (asset) {
      setTargetPrice(asset.price.toString());
      // Default condition: above target if target >= current
      setCondition('above');
    }
  };

  // Preset percentage calculations
  const applyPriceOffset = (percent: number) => {
    if (!currentAsset) return;
    const calculated = currentAsset.price * (1 + percent / 100);
    const formatted = currentAsset.price > 10 ? calculated.toFixed(2) : calculated.toFixed(4);
    setTargetPrice(formatted);
    setCondition(percent >= 0 ? 'above' : 'below');
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(targetPrice);
    if (!numPrice || isNaN(numPrice) || numPrice <= 0) return;

    if (!currentAsset) return;

    addAlert({
      symbol: currentAsset.symbol,
      assetName: currentAsset.name,
      targetPrice: numPrice,
      condition,
      note: note.trim()
    });

    setSuccessMessage(`Alert set for ${currentAsset.symbol} at $${numPrice.toLocaleString()}`);
    setNote('');
    setActiveTab('active');

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#141E33] border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                Price Point Push Alerts
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                  Live Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">Set target alerts for favorite assets & get device notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Push Notification Permission Card */}
        <div className="p-3 bg-[#0B101D] border-b border-slate-800/80">
          {notificationPermission === 'granted' ? (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Device Push Notifications Active</span>
              </div>
              <button
                type="button"
                onClick={testNotification}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Zap className="w-3 h-3" />
                Test Alert
              </button>
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Notifications blocked in browser. Enable notifications in site settings to receive device push alerts.</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Allow push notifications to get alerts on your device when price hits target!</span>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-500/10 shrink-0 text-center"
              >
                Enable Push Alerts
              </button>
            </div>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0F172A] px-3 pt-2 gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-3 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'create'
                ? 'bg-[#141E33] text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Set New Alert
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-3 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'active'
                ? 'bg-[#141E33] text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Active ({activeAlerts.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'history'
                ? 'bg-[#141E33] text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            History ({triggeredAlerts.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 no-scrollbar">
          {successMessage && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: CREATE ALERT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAlert} className="space-y-4">
              {/* Asset Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Asset to Track
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <select
                      value={selectedSymbol}
                      onChange={e => handleAssetSelect(e.target.value)}
                      className="w-full bg-[#141B27] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-400 appearance-none pr-8 cursor-pointer"
                    >
                      {assets.map(asset => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {isFavoriteSymbol(asset.symbol) ? '★ ' : ''}{asset.name} ({asset.symbol}) - ${asset.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Selected Asset Header Info */}
                {currentAsset && (
                  <div className="mt-2.5 p-3 bg-[#141E33] border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AssetIcon iconType={currentAsset.iconType} symbol={currentAsset.symbol} size="md" />
                      <div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 text-xs">{currentAsset.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{currentAsset.symbol}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          ${currentAsset.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFavoriteSymbol(currentAsset.symbol)}
                      className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs ${
                        isFavoriteSymbol(currentAsset.symbol)
                          ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Star asset as favorite"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavoriteSymbol(currentAsset.symbol) ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{isFavoriteSymbol(currentAsset.symbol) ? 'Starred' : 'Favorite'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Target Price & Preset Quick Percentages */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Target Price ($)</label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Current: ${currentAsset ? currentAsset.price.toLocaleString() : '0'}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    placeholder="Enter target price..."
                    className="w-full bg-[#141B27] border border-slate-700/80 rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                {/* Preset Quick Buttons */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-medium block">Quick Target Adjustment:</span>
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    {[
                      { label: '-5%', val: -5 },
                      { label: '-2%', val: -2 },
                      { label: '-1%', val: -1 },
                      { label: '+1%', val: 1 },
                      { label: '+2%', val: 2 },
                      { label: '+5%', val: 5 },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => applyPriceOffset(btn.val)}
                        className={`py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                          btn.val > 0
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trigger Condition Direction */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Trigger Condition</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCondition('above')}
                    className={`py-2.5 px-3 rounded-xl border font-medium flex items-center justify-center gap-2 transition-all ${
                      condition === 'above'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10 font-bold'
                        : 'bg-[#141B27] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Price Rises Above Target
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition('below')}
                    className={`py-2.5 px-3 rounded-xl border font-medium flex items-center justify-center gap-2 transition-all ${
                      condition === 'below'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/10 font-bold'
                        : 'bg-[#141B27] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    Price Drops Below Target
                  </button>
                </div>
              </div>

              {/* Custom Note */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Alert Note / Tag (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Resistance level, Buy entry point, Breakout target..."
                  className="w-full bg-[#141B27] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 text-xs flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4 fill-slate-950" />
                Set Price Push Alert
              </button>
            </form>
          )}

          {/* TAB 2: ACTIVE ALERTS */}
          {activeTab === 'active' && (
            <div className="space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <BellOff className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No active price alerts set.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    Set a price alert now →
                  </button>
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3 bg-[#141E33] border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        alert.condition === 'above' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {alert.condition === 'above' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-100">{alert.assetName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({alert.symbol})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            Target: ${alert.targetPrice.toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            alert.condition === 'above' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {alert.condition === 'above' ? '▲ Rise Above' : '▼ Drop Below'}
                          </span>
                        </div>
                        {alert.note && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">"{alert.note}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleAlertSound(alert.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          alert.soundEnabled !== false
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-500'
                        }`}
                        title="Toggle sound chime"
                      >
                        {alert.soundEnabled !== false ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeAlert(alert.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 rounded-lg transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TRIGGERED HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {triggeredAlerts.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearTriggeredAlerts}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Triggered History
                  </button>
                </div>
              )}

              {triggeredAlerts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Check className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No triggered alerts history yet.</p>
                </div>
              ) : (
                triggeredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-100">{alert.assetName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({alert.symbol})</span>
                        </div>
                        <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                          Hit Target ${alert.targetPrice.toLocaleString()}
                        </p>
                        {alert.triggeredAt && (
                          <span className="text-[10px] text-slate-500 block">
                            Triggered: {new Date(alert.triggeredAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAlert(alert.id)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
