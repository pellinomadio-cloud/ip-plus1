import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PriceAlert, BroadcastNotification } from '../types';
import { useMarket } from './MarketContext';
import { playAlertChime, sendDevicePushNotification } from '../utils/notificationUtils';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface PriceAlertContextType {
  // User-facing messages inbox (read-only for users)
  messages: BroadcastNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
  lastTriggeredNotification: BroadcastNotification | null;
  clearLastTriggeredNotification: () => void;

  // Modal state for Messages Inbox
  isAlertModalOpen: boolean;
  setIsAlertModalOpen: (open: boolean) => void;
  openMessagesModal: () => void;

  // Device notification permission state
  notificationPermission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;

  // Admin-only Price Point Alert & Broadcast Controls (used in AdminDashboard)
  adminPriceAlerts: PriceAlert[];
  adminAddPriceAlert: (data: {
    symbol: string;
    assetName: string;
    targetPrice: number;
    condition: 'above' | 'below';
    note?: string;
  }) => void;
  adminRemovePriceAlert: (id: string) => void;
  adminTriggerPriceAlertNow: (alertId: string) => void;
  adminSendBroadcastMessage: (data: {
    title: string;
    message: string;
    type?: 'message' | 'price_alert' | 'signal';
    symbol?: string;
    assetName?: string;
    targetPrice?: number;
    condition?: 'above' | 'below';
  }) => void;
  adminDeleteBroadcastMessage: (id: string) => void;
  adminClearAllMessages: () => void;
}

const PriceAlertContext = createContext<PriceAlertContextType | undefined>(undefined);

const MESSAGES_STORAGE_KEY = 'iq_trading_broadcast_messages_v2';
const ADMIN_ALERTS_STORAGE_KEY = 'iq_trading_admin_price_alerts_v2';
const DELIVERED_IDS_STORAGE_KEY = 'iq_trading_delivered_notif_ids_v2';
const LAST_READ_TS_KEY = 'iq_trading_last_read_notif_ts_v2';

export const PriceAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { assets } = useMarket();

  // Sent messages / notifications inbox
  const [messages, setMessages] = useState<BroadcastNotification[]>(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load broadcast messages:', e);
    }
    return [];
  });

  // Admin-configured global price point alerts
  const [adminPriceAlerts, setAdminPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_ALERTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load admin price alerts:', e);
    }
    return [];
  });

  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LAST_READ_TS_KEY);
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [lastTriggeredNotification, setLastTriggeredNotification] = useState<BroadcastNotification | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Keep track of notification IDs already pushed on this device so we only push once per message
  const deliveredIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      const savedIds = localStorage.getItem(DELIVERED_IDS_STORAGE_KEY);
      if (savedIds) {
        const arr: string[] = JSON.parse(savedIds);
        arr.forEach(id => deliveredIdsRef.current.add(id));
      } else {
        // Mark any pre-existing messages on initial boot as already delivered
        messages.forEach(m => deliveredIdsRef.current.add(m.id));
        localStorage.setItem(DELIVERED_IDS_STORAGE_KEY, JSON.stringify(Array.from(deliveredIdsRef.current)));
      }
    } catch {
      // ignore
    }
    isInitialMountRef.current = false;
  }, []);

  const markIdDelivered = useCallback((id: string) => {
    deliveredIdsRef.current.add(id);
    try {
      const arr = Array.from(deliveredIdsRef.current).slice(-200);
      localStorage.setItem(DELIVERED_IDS_STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // ignore
    }
  }, []);

  // Automatically request device notification permission on first user gesture so devices receive background push alerts
  useEffect(() => {
    if (!isSupported || Notification.permission !== 'default') return;

    const handleFirstInteraction = () => {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then(perm => setNotificationPermission(perm))
          .catch(() => {});
      }
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [isSupported]);

  // Helper to fire device push notification + audio chime + in-app toast for any newly arrived message
  const deliverIncomingNotifications = useCallback((incomingList: BroadcastNotification[]) => {
    if (!Array.isArray(incomingList) || incomingList.length === 0) return;

    // Sort newest first
    const sorted = [...incomingList].sort((a, b) => b.createdAt - a.createdAt);

    sorted.forEach(notif => {
      if (!deliveredIdsRef.current.has(notif.id)) {
        markIdDelivered(notif.id);
        // Only trigger live push if created within the last 5 minutes
        if (Date.now() - notif.createdAt < 5 * 60 * 1000) {
          playAlertChime();
          sendDevicePushNotification(notif.title, notif.message, notif.id);
          setLastTriggeredNotification(notif);
        }
      }
    });
  }, [markIdDelivered]);

  // Persist helper to Firestore + localStorage + BroadcastChannel
  const syncNotificationsState = useCallback(
    async (nextMessages: BroadcastNotification[], nextAdminAlerts: PriceAlert[]) => {
      try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(nextMessages));
        localStorage.setItem(ADMIN_ALERTS_STORAGE_KEY, JSON.stringify(nextAdminAlerts));
      } catch (e) {
        console.error('Failed to save notifications state to localStorage:', e);
      }

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'SYNC_NOTIFICATIONS',
            messages: nextMessages,
            adminPriceAlerts: nextAdminAlerts,
          });
        } catch {
          // ignore
        }
      }

      try {
        const configRef = doc(db, 'system_settings', 'notifications_config');
        await setDoc(
          configRef,
          {
            messages: nextMessages.slice(0, 100),
            adminPriceAlerts: nextAdminAlerts.slice(0, 50),
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore notifications sync note:', err);
      }
    },
    []
  );

  // Set up BroadcastChannel & storage event listener for instant cross-tab / background PWA delivery
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('iq_plus_global_push');
      broadcastChannelRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'SYNC_NOTIFICATIONS') {
          if (Array.isArray(ev.data.messages)) {
            setMessages(ev.data.messages);
            deliverIncomingNotifications(ev.data.messages);
          }
          if (Array.isArray(ev.data.adminPriceAlerts)) {
            setAdminPriceAlerts(ev.data.adminPriceAlerts);
          }
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === MESSAGES_STORAGE_KEY && e.newValue) {
        try {
          const parsed: BroadcastNotification[] = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
            deliverIncomingNotifications(parsed);
          }
        } catch {
          // ignore
        }
      } else if (e.key === ADMIN_ALERTS_STORAGE_KEY && e.newValue) {
        try {
          const parsed: PriceAlert[] = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAdminPriceAlerts(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [deliverIncomingNotifications]);

  // Real-time Firestore listener so all users across all devices get notified immediately
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const configRef = doc(db, 'system_settings', 'notifications_config');
      unsubscribe = onSnapshot(
        configRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.messages)) {
              setMessages(data.messages);
              try {
                localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(data.messages));
              } catch {}
              deliverIncomingNotifications(data.messages);
            }
            if (Array.isArray(data.adminPriceAlerts)) {
              setAdminPriceAlerts(data.adminPriceAlerts);
              try {
                localStorage.setItem(ADMIN_ALERTS_STORAGE_KEY, JSON.stringify(data.adminPriceAlerts));
              } catch {}
            }
          }
        },
        (err) => {
          console.warn('Firestore notifications listener note:', err.message);
        }
      );
    } catch (e) {
      console.warn('Firestore notifications setup note:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [deliverIncomingNotifications]);

  // Request Notification permission explicitly
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

  // Mark all messages as read when user views the notification inbox
  const markAllAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadTimestamp(now);
    try {
      localStorage.setItem(LAST_READ_TS_KEY, String(now));
    } catch {
      // ignore
    }
  }, []);

  const openMessagesModal = useCallback(() => {
    setIsAlertModalOpen(true);
    markAllAsRead();
  }, [markAllAsRead]);

  // Admin: Send instant broadcast message or price alert notification to all users
  const adminSendBroadcastMessage = useCallback(
    (data: {
      title: string;
      message: string;
      type?: 'message' | 'price_alert' | 'signal';
      symbol?: string;
      assetName?: string;
      targetPrice?: number;
      condition?: 'above' | 'below';
    }) => {
      const newNotif: BroadcastNotification = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type || 'message',
        symbol: data.symbol,
        assetName: data.assetName,
        targetPrice: data.targetPrice,
        condition: data.condition,
        createdAt: Date.now(),
        sender: 'IQ-PLUS Trading Desk',
      };

      const nextMessages = [newNotif, ...messages].slice(0, 100);
      setMessages(nextMessages);
      deliverIncomingNotifications(nextMessages);
      syncNotificationsState(nextMessages, adminPriceAlerts);
    },
    [messages, adminPriceAlerts, deliverIncomingNotifications, syncNotificationsState]
  );

  // Admin: Set a global price point alert that monitors live market prices and notifies all users when hit
  const adminAddPriceAlert = useCallback(
    (data: {
      symbol: string;
      assetName: string;
      targetPrice: number;
      condition: 'above' | 'below';
      note?: string;
    }) => {
      const newAlert: PriceAlert = {
        id: `adm-alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        symbol: data.symbol,
        assetName: data.assetName,
        targetPrice: data.targetPrice,
        condition: data.condition,
        createdAt: Date.now(),
        triggered: false,
        note: data.note?.trim() || '',
        soundEnabled: true,
      };

      const nextAlerts = [newAlert, ...adminPriceAlerts];
      setAdminPriceAlerts(nextAlerts);
      syncNotificationsState(messages, nextAlerts);
    },
    [adminPriceAlerts, messages, syncNotificationsState]
  );

  // Admin: Remove a global price alert
  const adminRemovePriceAlert = useCallback(
    (id: string) => {
      const nextAlerts = adminPriceAlerts.filter(a => a.id !== id);
      setAdminPriceAlerts(nextAlerts);
      syncNotificationsState(messages, nextAlerts);
    },
    [adminPriceAlerts, messages, syncNotificationsState]
  );

  // Admin: Trigger an existing price alert immediately to all users
  const adminTriggerPriceAlertNow = useCallback(
    (alertId: string) => {
      const target = adminPriceAlerts.find(a => a.id === alertId);
      if (!target) return;

      const updatedAlerts = adminPriceAlerts.map(a =>
        a.id === alertId ? { ...a, triggered: true, triggeredAt: Date.now() } : a
      );

      const directionText = target.condition === 'above' ? 'broke above' : 'dropped below';
      const newNotif: BroadcastNotification = {
        id: `msg-alert-${target.id}-${Date.now()}`,
        title: `Price Alert: ${target.symbol} at $${target.targetPrice.toLocaleString()}`,
        message:
          target.note ||
          `${target.assetName} (${target.symbol}) ${directionText} target price $${target.targetPrice.toLocaleString()}.`,
        type: 'price_alert',
        symbol: target.symbol,
        assetName: target.assetName,
        targetPrice: target.targetPrice,
        condition: target.condition,
        createdAt: Date.now(),
        sender: 'Market Execution Desk',
      };

      const nextMessages = [newNotif, ...messages].slice(0, 100);
      setAdminPriceAlerts(updatedAlerts);
      setMessages(nextMessages);
      deliverIncomingNotifications(nextMessages);
      syncNotificationsState(nextMessages, updatedAlerts);
    },
    [adminPriceAlerts, messages, deliverIncomingNotifications, syncNotificationsState]
  );

  // Admin: Delete a sent broadcast message
  const adminDeleteBroadcastMessage = useCallback(
    (id: string) => {
      const nextMessages = messages.filter(m => m.id !== id);
      setMessages(nextMessages);
      syncNotificationsState(nextMessages, adminPriceAlerts);
    },
    [messages, adminPriceAlerts, syncNotificationsState]
  );

  const adminClearAllMessages = useCallback(() => {
    setMessages([]);
    syncNotificationsState([], adminPriceAlerts);
  }, [adminPriceAlerts, syncNotificationsState]);

  // Global Price Tracking Engine: checks admin-configured price alerts against live asset prices
  const previousPricesRef = useRef<{ [symbol: string]: number }>({});

  useEffect(() => {
    if (!assets || assets.length === 0 || adminPriceAlerts.length === 0) return;

    let alertsChanged = false;
    const nextAlerts = [...adminPriceAlerts];
    const newlyTriggeredMessages: BroadcastNotification[] = [];

    assets.forEach(asset => {
      const prevPrice = previousPricesRef.current[asset.symbol] ?? asset.price;
      const currentPrice = asset.price;

      nextAlerts.forEach((alert, idx) => {
        if (alert.symbol === asset.symbol && !alert.triggered) {
          let hit = false;
          if (alert.condition === 'above') {
            hit = currentPrice >= alert.targetPrice || (prevPrice < alert.targetPrice && currentPrice >= alert.targetPrice);
          } else {
            hit = currentPrice <= alert.targetPrice || (prevPrice > alert.targetPrice && currentPrice <= alert.targetPrice);
          }

          if (hit) {
            alertsChanged = true;
            nextAlerts[idx] = {
              ...alert,
              triggered: true,
              triggeredAt: Date.now(),
            };

            const directionLabel = alert.condition === 'above' ? 'rose above' : 'dropped below';
            newlyTriggeredMessages.push({
              id: `msg-auto-${alert.id}`,
              title: `Market Alert: ${alert.symbol} Hit $${alert.targetPrice.toLocaleString()}`,
              message:
                alert.note ||
                `${alert.assetName} (${alert.symbol}) ${directionLabel} $${alert.targetPrice.toLocaleString()} (Live: $${currentPrice.toLocaleString()}).`,
              type: 'price_alert',
              symbol: alert.symbol,
              assetName: alert.assetName,
              targetPrice: alert.targetPrice,
              condition: alert.condition,
              createdAt: Date.now(),
              sender: 'Market Execution Desk',
            });
          }
        }
      });

      previousPricesRef.current[asset.symbol] = currentPrice;
    });

    if (alertsChanged && newlyTriggeredMessages.length > 0) {
      // Avoid duplicate messages with the same deterministic ID
      const existingIds = new Set(messages.map(m => m.id));
      const uniqueNew = newlyTriggeredMessages.filter(m => !existingIds.has(m.id));
      const nextMessages = [...uniqueNew, ...messages].slice(0, 100);

      setAdminPriceAlerts(nextAlerts);
      setMessages(nextMessages);
      deliverIncomingNotifications(nextMessages);
      syncNotificationsState(nextMessages, nextAlerts);
    }
  }, [assets, adminPriceAlerts, messages, deliverIncomingNotifications, syncNotificationsState]);

  const clearLastTriggeredNotification = useCallback(() => {
    setLastTriggeredNotification(null);
  }, []);

  const unreadCount = messages.filter(m => m.createdAt > lastReadTimestamp).length;

  return (
    <PriceAlertContext.Provider
      value={{
        messages,
        unreadCount,
        markAllAsRead,
        lastTriggeredNotification,
        clearLastTriggeredNotification,
        isAlertModalOpen,
        setIsAlertModalOpen,
        openMessagesModal,
        notificationPermission,
        isSupported,
        requestPermission,
        adminPriceAlerts,
        adminAddPriceAlert,
        adminRemovePriceAlert,
        adminTriggerPriceAlertNow,
        adminSendBroadcastMessage,
        adminDeleteBroadcastMessage,
        adminClearAllMessages,
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
