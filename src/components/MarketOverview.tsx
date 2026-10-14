import React, { useState } from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Search, ArrowUpDown, Bell } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { usePriceAlerts } from '../context/PriceAlertContext';
import { AssetIcon } from './AssetIcon';
import { formatCurrency } from '../data/marketData';
import { MarketAsset } from '../types';

interface MarketOverviewProps {
  onSelectAssetToTrade: (asset: MarketAsset) => void;
  onViewAllMarkets?: () => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ 
  onSelectAssetToTrade,
  onViewAllMarkets 
}) => {
  const { assets, lastPriceUpdate } = useMarket();
  const { openCreateAlertForAsset } = usePriceAlerts();

  const [showAllModal, setShowAllModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'crypto' | 'commodities' | 'forex'>('all');
  const [search, setSearch] = useState('');

  // Primary list from screenshot (first 5 primary items)
  const displayAssets = showAllModal 
    ? assets.filter(a => (filterCategory === 'all' || a.category === filterCategory) && 
        (a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase())))
    : assets.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Market Overview</h3>
        <button
          onClick={() => {
            if (onViewAllMarkets) {
              onViewAllMarkets();
            } else {
              setShowAllModal(prev => !prev);
            }
          }}
          className="text-xs sm:text-sm font-semibold text-[#F5BA31] hover:text-[#ffc842] flex items-center gap-0.5 transition-colors group"
        >
          <span>{showAllModal ? 'Show Less' : 'See All'}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Expanded filters if showAllModal is open */}
      {showAllModal && (
        <div className="space-y-2 pb-1 animate-in fade-in duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coin, pair, or commodity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#141B27] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {(['all', 'crypto', 'commodities', 'forex'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-[#F5BA31] text-slate-950 font-bold'
                    : 'bg-[#141B27] text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Market Rows */}
      <div className="space-y-2.5">
        {displayAssets.map(asset => {
          const isUp = asset.changePercent24h >= 0;
          const flash = lastPriceUpdate[asset.symbol];

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectAssetToTrade(asset)}
              className={`w-full group flex items-center justify-between p-3.5 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700/80 active:scale-[0.99] transition-all text-left ${
                flash === 'up' ? 'ring-1 ring-emerald-500/50 bg-emerald-950/10' : flash === 'down' ? 'ring-1 ring-rose-500/50 bg-rose-950/10' : ''
              }`}
            >
              {/* Left icon and pair details */}
              <div className="flex items-center gap-3 min-w-0">
                <AssetIcon iconType={asset.iconType} symbol={asset.symbol} size="md" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors">
                    {asset.symbol}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{asset.name}</p>
                </div>
              </div>

              {/* Right price, alert bell, and 24h change */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono tabular-nums">
                    {formatCurrency(asset.price)}
                  </div>
                  <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span className="text-[10px]">{isUp ? '▲' : '▼'}</span>
                    <span>{isUp ? '+' : ''}{asset.changePercent24h.toFixed(2)}%</span>
                  </div>
                </div>

                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateAlertForAsset(asset.symbol);
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0E1420] text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-colors cursor-pointer"
                  title={`Set price alert for ${asset.symbol}`}
                >
                  <Bell className="w-3.5 h-3.5" />
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
