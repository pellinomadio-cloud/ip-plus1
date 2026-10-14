import React, { createContext, useContext, useState, useEffect } from 'react';
import { MarketAsset, AssetCategory } from '../types';
import { INITIAL_ASSETS } from '../data/marketData';

interface MarketContextType {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  setSelectedAsset: (asset: MarketAsset) => void;
  activeCategory: AssetCategory;
  setActiveCategory: (category: AssetCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredAssets: MarketAsset[];
  lastPriceUpdate: { [symbol: string]: 'up' | 'down' | null };
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(INITIAL_ASSETS[0]);
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastPriceUpdate, setLastPriceUpdate] = useState<{ [symbol: string]: 'up' | 'down' | null }>({});

  // Simulate realistic market price ticks every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 2-3 random assets to tick
      setAssets(prevAssets => {
        const updated = [...prevAssets];
        const numUpdates = 2 + Math.floor(Math.random() * 2);
        const updatesMap: { [symbol: string]: 'up' | 'down' | null } = {};

        for (let i = 0; i < numUpdates; i++) {
          const randomIndex = Math.floor(Math.random() * updated.length);
          const target = updated[randomIndex];

          // Small volatility percentage between -0.15% and +0.15%
          const pctChange = (Math.random() * 0.3 - 0.145) / 100;
          const oldPrice = target.price;
          const newPrice = target.price > 10 
            ? Number((target.price * (1 + pctChange)).toFixed(2))
            : Number((target.price * (1 + pctChange)).toFixed(4));

          const direction = newPrice >= oldPrice ? 'up' : 'down';
          updatesMap[target.symbol] = direction;

          const newChange24h = Number((target.change24h + (newPrice - oldPrice)).toFixed(2));
          const newChangePct = Number((target.changePercent24h + pctChange * 10).toFixed(2));
          const updatedSparkline = [...target.sparkline.slice(1), newPrice];

          updated[randomIndex] = {
            ...target,
            price: newPrice,
            change24h: newChange24h,
            changePercent24h: newChangePct,
            sparkline: updatedSparkline,
            high24h: Math.max(target.high24h, newPrice),
            low24h: Math.min(target.low24h, newPrice)
          };
        }

        setLastPriceUpdate(prev => ({ ...prev, ...updatesMap }));

        // Clear highlight flash after 800ms
        setTimeout(() => {
          setLastPriceUpdate({});
        }, 800);

        return updated;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Sync selectedAsset when assets change
  useEffect(() => {
    const fresh = assets.find(a => a.symbol === selectedAsset.symbol);
    if (fresh) {
      setSelectedAsset(fresh);
    }
  }, [assets, selectedAsset.symbol]);

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = activeCategory === 'all' || asset.category === activeCategory;
    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MarketContext.Provider
      value={{
        assets,
        selectedAsset,
        setSelectedAsset,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        filteredAssets,
        lastPriceUpdate
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket must be used within a MarketProvider');
  return context;
};
