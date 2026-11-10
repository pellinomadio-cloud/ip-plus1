import React from 'react';
import { Header } from './Header';
import { BalanceCard } from './BalanceCard';
import { ActionCards } from './ActionCards';
import { MarketOverview } from './MarketOverview';
import { TrustBanner } from './TrustBanner';
import { MarketAsset } from '../types';

interface DashboardViewProps {
  onOpenUpgrade: () => void;
  onOpenWithdraw: () => void;
  onOpenCommunity: () => void;
  onOpenTrade: () => void;
  onSelectAssetToTrade: (asset: MarketAsset) => void;
  onViewAllMarkets?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenUpgrade,
  onOpenWithdraw,
  onOpenCommunity,
  onOpenTrade,
  onSelectAssetToTrade,
  onViewAllMarkets
}) => {
  return (
    <div className="space-y-4 pb-24 text-white">
      {/* Top App Header */}
      <Header onOpenUpgrade={onOpenUpgrade} onOpenWithdraw={onOpenWithdraw} />

      {/* Main Total Balance Card */}
      <div className="px-4">
        <BalanceCard />
      </div>

      {/* Action Cards: Upgrade | Withdraw | Community | Trade */}
      <div className="px-4">
        <ActionCards
          onOpenUpgrade={onOpenUpgrade}
          onOpenWithdraw={onOpenWithdraw}
          onOpenCommunity={onOpenCommunity}
          onOpenTrade={onOpenTrade}
        />
      </div>

      {/* Market Overview List */}
      <div className="px-4">
        <MarketOverview 
          onSelectAssetToTrade={onSelectAssetToTrade}
          onViewAllMarkets={onViewAllMarkets}
        />
      </div>

      {/* Trust & Execution Banner */}
      <div className="px-4 pt-1">
        <TrustBanner />
      </div>
    </div>
  );
};
