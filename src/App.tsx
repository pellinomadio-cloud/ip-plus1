/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketProvider, useMarket } from './context/MarketContext';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { TradeView } from './components/TradeView';
import { WalletView } from './components/WalletView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNav } from './components/BottomNav';
import { FundsWalletPage } from './components/FundsWalletPage';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { TradeModal } from './components/modals/TradeModal';
import { TradeResultModal } from './components/modals/TradeResultModal';
import { TradingTerminalPage } from './components/TradingTerminalPage';
import { NavigationDrawer } from './components/NavigationDrawer';
import { NavTab, MarketAsset } from './types';
import { Smartphone, Monitor, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PriceAlertProvider, usePriceAlerts } from './context/PriceAlertContext';
import { PriceAlertModal } from './components/modals/PriceAlertModal';
import { PriceAlertBanner } from './components/PriceAlertBanner';
import { InvestModal } from './components/modals/InvestModal';


function AppContent() {
  const { isAuthenticated, currentUser, expiredTradeResult, clearExpiredTradeResult } = useAuth();
  const { setSelectedAsset } = useMarket();
  const { isAlertModalOpen, setIsAlertModalOpen } = usePriceAlerts();

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [desktopMode, setDesktopMode] = useState<'mobile' | 'wide'>('mobile');


  // Intercept physical/device back button presses
  // Returns the user to the main dashboard balance view ('home') from any page instead of leaving the app
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Ensure baseline history state exists
    if (!window.history.state || window.history.state.appState !== 'iq_trading_app') {
      window.history.replaceState({ appState: 'iq_trading_app', tab: 'home' }, '');
    }

    // Always push a history state so back button press can be captured
    window.history.pushState({ appState: 'iq_trading_app', tab: activeTab }, '');

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();

      // 1. Close open modals or drawers if active
      if (isWithdrawModalOpen || isTradeModalOpen || isDrawerOpen || isInvestModalOpen) {
        setIsWithdrawModalOpen(false);
        setIsTradeModalOpen(false);
        setIsDrawerOpen(false);
        setIsInvestModalOpen(false);
        window.history.pushState({ appState: 'iq_trading_app', tab: activeTab }, '');
        return;
      }

      // 2. If user is on any subpage/view other than dashboard balance ('home'), return to dashboard
      if (activeTab !== 'home') {
        setActiveTab('home');
        window.history.pushState({ appState: 'iq_trading_app', tab: 'home' }, '');
        return;
      }

      // 3. If already on home dashboard balance, retain user on dashboard
      window.history.pushState({ appState: 'iq_trading_app', tab: 'home' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, activeTab, isWithdrawModalOpen, isTradeModalOpen, isDrawerOpen]);

  // If not authenticated, show registration/login page
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleSelectAssetToTrade = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    setIsTradeModalOpen(true);
  };

  const handleOpenTradeTab = () => {
    setActiveTab('trade');
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-amber-400 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Helper Bar (visible on md+ screens) */}
      <div className="w-full bg-[#0D121B] border-b border-slate-800/80 px-4 py-2 hidden md:flex items-center justify-between text-xs text-slate-400 z-50">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showTagline={false} />
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Trading as <strong className="text-amber-400">{currentUser?.name}</strong> (Balance: ${currentUser?.balance.toFixed(2)})</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton variant="button" />
          <div className="bg-[#141B27] p-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setDesktopMode('mobile')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                desktopMode === 'mobile' ? 'bg-[#F5BA31] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Frame (1:1 Design)</span>
            </button>
            <button
              onClick={() => setDesktopMode('wide')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                desktopMode === 'wide' ? 'bg-[#F5BA31] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main App Container */}
      <main className={`w-full relative transition-all duration-200 ${
        desktopMode === 'mobile'
          ? 'max-w-[430px] min-h-screen sm:min-h-[920px] sm:my-6 sm:border sm:border-slate-800 sm:rounded-[40px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden bg-[#0B0F17]'
          : 'max-w-5xl min-h-screen px-4 sm:px-6 py-4 bg-[#0B0F17]'
      }`}>
        {/* Top PWA Install Banner */}
        <PWAInstallButton variant="banner" />
        {/* Dynamic Screen Content based on Active Tab */}
        {activeTab === 'home' && (
          <DashboardView
            onOpenWallet={() => setActiveTab('funds_wallet')}
            onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
            onOpenInvest={() => setIsInvestModalOpen(true)}
            onOpenTrade={handleOpenTradeTab}
            onSelectAssetToTrade={handleSelectAssetToTrade}
            onViewAllMarkets={() => setActiveTab('trade')}
          />
        )}

        {activeTab === 'funds_wallet' && (
          <FundsWalletPage
            onBack={() => setActiveTab('home')}
            onGoToTrade={() => setActiveTab('trade')}
          />
        )}

        {activeTab === 'trade' && (
          <TradingTerminalPage
            onOpenMenu={() => setIsDrawerOpen(true)}
            onOpenDeposit={() => setActiveTab('funds_wallet')}
          />
        )}

        {activeTab === 'wallet' && (
          <div className="pt-2 px-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Portfolio & Wallet</h2>
            </div>
            <WalletView
              onOpenDeposit={() => setActiveTab('funds_wallet')}
              onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="pt-2 px-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Trade & Order History</h2>
            </div>
            <HistoryView />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="pt-2 px-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Account & Settings</h2>
            </div>
            <SettingsView onOpenAdminDashboard={() => setActiveTab('admin_dashboard')} />
          </div>
        )}

        {activeTab === 'admin_dashboard' && (
          <AdminDashboard onClose={() => setActiveTab('settings')} />
        )}

        {/* Fixed Bottom Navigation Bar */}
        <BottomNav activeTab={activeTab === 'funds_wallet' || activeTab === 'admin_dashboard' ? 'settings' : activeTab} onChangeTab={setActiveTab} />
      </main>

      {/* Popups & Modals */}
      <InvestModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        onOpenDeposit={() => {
          setIsInvestModalOpen(false);
          setActiveTab('funds_wallet');
        }}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onOpenDeposit={() => {
          setIsWithdrawModalOpen(false);
          setActiveTab('funds_wallet');
        }}
      />

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onOpenDeposit={() => {
          setIsTradeModalOpen(false);
          setActiveTab('funds_wallet');
        }}
      />

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsDrawerOpen(false);
        }}
        onOpenDeposit={() => {
          setIsDrawerOpen(false);
          setActiveTab('funds_wallet');
        }}
      />

      <TradeResultModal
        trade={expiredTradeResult}
        onClose={clearExpiredTradeResult}
        onTradeAgain={() => setActiveTab('trade')}
      />

      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />

      <PriceAlertBanner />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <PriceAlertProvider>
          <AppContent />
        </PriceAlertProvider>
      </MarketProvider>
    </AuthProvider>
  );
}

