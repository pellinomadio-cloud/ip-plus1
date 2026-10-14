import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PriceAlert } from '../types';
import { useMarket } from './MarketContext';
import { playAlertChime, sendDevicePushNotification } from '../utils/notificationUtils';

interface PriceAlertContextType {
  alerts: PriceAlert[];
  activeAlerts: PriceAlert[];
  triggeredAlerts: PriceAlert[];
  activeAlertsCount: number;
  notificationPermission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  addAlert: (data: { symbol: string; assetName: string; targetPrice: number; condition?: 'above' | 'below'; note?: string }) => void;
  removeAlert: (id: string) => void;
  clearTriggeredAlerts: () => void;
  toggleAlertSound: (id: string) => void;
  favoriteSymbols: string[];
  toggleFavoriteSymbol: (symbol: string) => void;
  isFavoriteSymbol: (symbol: string) => boolean;
  lastTriggeredAlert: PriceAlert | null;
  clearLastTriggeredAlert: () => void;
  isAlertModalOpen: boolean;
  setIsAlertModalOpen: (open: boolean) => void;
  presetAssetForModal: string | null;
  openCreateAlertForAsset: (assetSymbol?: string) => void;
  testNotification: () => Promise<void>;
}

const PriceAlertContext = createContext<PriceAlertContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'iq_trading_price_alerts';
const FAVORITES_STORAGE_KEY = 'iq_trading_favorite_symbols';

const DEFAULT_ALERTS: PriceAlert[] = [
  {
    id: 'sample-btc-1',
    symbol: 'BTC/USD',
    assetName: 'Bitcoin',
    targetPrice: 95000,
    condition: 'above',
    createdAt: Date.now() - 3600000,
    triggered: false,
    note: 'Resistance breakout target',
    soundEnabled: true,
  },
  {
    id: 'sample-gold-1',
    symbol: 'XAU/USD',
    assetName: 'Gold',
    targetPrice: 2650,
    condition: 'below',
    createdAt: Date.now() - 1800000,
    triggered: false,
    note: 'Support dip re-entry',
    soundEnabled: true,
  }
];

const DEFAULT_FAVORITES = ['BTC/USD', 'EUR/USD', 'XAU/USD', 'ETH/USD', 'SOL/USD'];

export const PriceAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { assets } = useMarket();

  // Load alerts from localStorage
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load price alerts:', e);
    }
    return DEFAULT_ALERTS;
  });

  // Favorite symbols
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load favorite symbols:', e);
    }
    return DEFAULT_FAVORITES;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [lastTriggeredAlert, setLastTriggeredAlert] = useState<PriceAlert | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [presetAssetForModal, setPresetAssetForModal] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Sync alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.error('Failed to save price alerts:', e);
    }
  }, [alerts]);

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSymbols));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favoriteSymbols]);

  // Request Notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm === 'granted';
    } catch (err) {
      console.error('Permission request failed:', err);
      return false;
    }
  };

  // Toggle favorite
  const toggleFavoriteSymbol = useCallback((symbol: string) => {
    setFavoriteSymbols(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  }, []);

  const isFavoriteSymbol = useCallback((symbol: string) => {
    return favoriteSymbols.includes(symbol);
  }, [favoriteSymbols]);

  // Add alert
  const addAlert = useCallback((data: {
    symbol: string;
    assetName: string;
    targetPrice: number;
    condition?: 'above' | 'below';
    note?: string;
  }) => {
    const asset = assets.find(a => a.symbol === data.symbol);
    const currentPrice = asset ? asset.price : data.targetPrice;
    
    // Auto-determine condition if not specified
    const condition = data.condition || (data.targetPrice >= currentPrice ? 'above' : 'below');

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      symbol: data.symbol,
      assetName: data.assetName,
      targetPrice: data.targetPrice,
      condition,
      createdAt: Date.now(),
      triggered: false,
      note: data.note || '',
      soundEnabled: true,
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Request notification permission if still default
    if (notificationPermission === 'default' && isSupported) {
      Notification.requestPermission().then(perm => setNotificationPermission(perm));
    }
  }, [assets, notificationPermission, isSupported]);

  // Remove alert
  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Clear triggered history
  const clearTriggeredAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(a => !a.triggered));
  }, []);

  // Toggle sound for an alert
  const toggleAlertSound = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, soundEnabled: !a.soundEnabled } : a));
  }, []);

  // Price tracking & alert checking engine
  const previousPricesRef = useRef<{ [symbol: string]: number }>({});

  useEffect(() => {
    if (!assets || assets.length === 0) return;

    let updatedAlerts = false;
    const currentAlerts = [...alerts];

    assets.forEach(asset => {
      const prevPrice = previousPricesRef.current[asset.symbol] ?? asset.price;
      const currentPrice = asset.price;

      currentAlerts.forEach((alert, index) => {
        if (alert.symbol === asset.symbol && !alert.triggered) {
          let isConditionHit = false;

          if (alert.condition === 'above') {
            // Trigger if current price >= target OR crossed upwards
            isConditionHit = currentPrice >= alert.targetPrice || (prevPrice < alert.targetPrice && currentPrice >= alert.targetPrice);
          } else if (alert.condition === 'below') {
            // Trigger if current price <= target OR crossed downwards
            isConditionHit = currentPrice <= alert.targetPrice || (prevPrice > alert.targetPrice && currentPrice <= alert.targetPrice);
          }

          if (isConditionHit) {
            updatedAlerts = true;
            const triggeredAlert: PriceAlert = {
              ...alert,
              triggered: true,
              triggeredAt: Date.now(),
            };

            currentAlerts[index] = triggeredAlert;
            setLastTriggeredAlert(triggeredAlert);

            // Play sound if enabled
            if (alert.soundEnabled !== false) {
              playAlertChime();
            }

            // Fire native device notification
            const title = `🚨 Target Hit: ${alert.symbol}`;
            const body = `${alert.assetName} reached $${currentPrice.toLocaleString()}! Target was $${alert.targetPrice.toLocaleString()} (${alert.condition.toUpperCase()}).`;
            sendDevicePushNotification(title, body, `alert-${alert.id}`);
          }
        }
      });

      previousPricesRef.current[asset.symbol] = currentPrice;
    });

    if (updatedAlerts) {
      setAlerts(currentAlerts);
    }
  }, [assets, alerts]);

  const clearLastTriggeredAlert = useCallback(() => {
    setLastTriggeredAlert(null);
  }, []);

  const openCreateAlertForAsset = useCallback((assetSymbol?: string) => {
    if (assetSymbol) {
      setPresetAssetForModal(assetSymbol);
    } else {
      setPresetAssetForModal(null);
    }
    setIsAlertModalOpen(true);
  }, []);

  const testNotification = async () => {
    if (notificationPermission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    playAlertChime();
    await sendDevicePushNotification(
      '🔔 Device Notification Active',
      'Price alerts will notify you instantly when your target market price is hit!'
    );

    const testAlert: PriceAlert = {
      id: `test-${Date.now()}`,
      symbol: 'BTC/USD',
      assetName: 'Bitcoin Test Alert',
      targetPrice: 98500,
      condition: 'above',
      createdAt: Date.now(),
      triggered: true,
      triggeredAt: Date.now(),
      note: 'Test push notification fired successfully',
      soundEnabled: true,
    };
    setLastTriggeredAlert(testAlert);
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <PriceAlertContext.Provider
      value={{
        alerts,
        activeAlerts,
        triggeredAlerts,
        activeAlertsCount: activeAlerts.length,
        notificationPermission,
        isSupported,
        requestPermission,
        addAlert,
        removeAlert,
        clearTriggeredAlerts,
        toggleAlertSound,
        favoriteSymbols,
        toggleFavoriteSymbol,
        isFavoriteSymbol,
        lastTriggeredAlert,
        clearLastTriggeredAlert,
        isAlertModalOpen,
        setIsAlertModalOpen,
        presetAssetForModal,
        openCreateAlertForAsset,
        testNotification,
      }}
    >
      {children}
    </PriceAlertContext.Provider>
  );
};

export const usePriceAlerts = () => {
  const context = useContext(PriceAlertContext);
  if (!context) {
    throw new Error('usePriceAlerts must be used within a PriceAlertProvider');
  }
  return context;
};
