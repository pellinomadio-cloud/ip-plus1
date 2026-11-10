import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Position, Transaction, QuickTrade, DepositRequest, UserInvestment, StaffManagementAccount } from '../types';
import { INVESTMENT_PLANS } from '../data/investmentPlans';
import { recordTradeResultOnCandles } from '../utils/candleGenerator';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const STORAGE_KEY_USER = 'iq_plus_active_user';
const STORAGE_KEY_USERS_DB = 'iq_plus_registered_users';
const STORAGE_KEY_POSITIONS = 'iq_plus_positions';
const STORAGE_KEY_CLOSED = 'iq_plus_closed_positions';
const STORAGE_KEY_TXS = 'iq_plus_transactions';
const STORAGE_KEY_QUICK_TRADES = 'iq_plus_quick_trades';
const STORAGE_KEY_TRC20_ADDRESS = 'iq_plus_trc20_address';
const STORAGE_KEY_CRYPTO_ADDRESSES = 'iq_plus_crypto_addresses';
const STORAGE_KEY_DEPOSIT_REQUESTS = 'iq_plus_deposit_requests';
const STORAGE_KEY_ADMIN_WIN_RATE = 'iq_plus_admin_win_rate';
const STORAGE_KEY_INVESTMENTS = 'iq_plus_user_investments';
const STORAGE_KEY_STAFF_ACCOUNT = 'iq_plus_staff_management_account';

export const isNigeriaPhoneUser = (user: User | null | undefined): boolean => {
  if (!user) return false;
  // Since country selection is no longer required at registration, all standard users support Nigeria banking channels
  if (!user.countryCode || user.countryCode === 'NG' || (user.country || '').toLowerCase() === 'nigeria') return true;
  const phone = (user.phoneNumber || '').trim();
  if (phone.startsWith('+234') || phone.startsWith('234') || phone.startsWith('07') || phone.startsWith('08') || phone.startsWith('09')) return true;
  return true;
};

export const DEFAULT_STAFF_ACCOUNT: StaffManagementAccount = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  exchangeRateNgn: 1550,
  paymentInstructions: '',
  isConfigured: false
};

export const LEGACY_DUMMY_CRYPTO_ADDRESSES = new Set([
  'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc',
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  '7xKXtg2CW87d97TXJSDp15X27sJvB3P8s9XyZ1w2Q3E4'
]);

export const DEFAULT_CRYPTO_ADDRESSES: Record<string, string> = {
  'usdt-trc20': '',
  'btc': '',
  'eth': '',
  'usdt-erc20': '',
  'bnb': '',
  'sol': '',
  'trx': ''
};

export const sanitizeCryptoAddressMap = (raw: Record<string, string> | undefined | null): Record<string, string> => {
  const cleaned: Record<string, string> = { ...DEFAULT_CRYPTO_ADDRESSES };
  if (!raw || typeof raw !== 'object') return cleaned;
  Object.entries(raw).forEach(([key, val]) => {
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (trimmed && !LEGACY_DUMMY_CRYPTO_ADDRESSES.has(trimmed)) {
      cleaned[key] = trimmed;
    } else {
      cleaned[key] = '';
    }
  });
  return cleaned;
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string, country?: string, countryCode?: string, phoneNumber?: string) => { success: boolean; message?: string };
  login: (email: string, password: string) => { success: boolean; message?: string };
  quickDemoLogin: () => void;
  logout: () => void;
  updateUserCountry: (country: string, countryCode?: string) => void;
  depositFunds: (amount: number, method: string) => void;
  withdrawFunds: (amount: number, method: string, address: string, details?: Transaction['destinationDetails']) => { success: boolean; message: string };
  positions: Position[];

  closedPositions: Position[];
  transactions: Transaction[];
  openTrade: (symbol: string, assetName: string, type: 'buy' | 'sell', margin: number, leverage: number, currentPrice: number, takeProfit?: number, stopLoss?: number) => { success: boolean; message: string };
  closeTrade: (positionId: string, currentMarketPrice: number) => { success: boolean; message: string };
  quickTrades: QuickTrade[];
  placeQuickTrade: (
    symbol: string,
    assetName: string,
    type: 'buy' | 'sell',
    investment: number,
    durationSeconds: number,
    entryPrice: number,
    payoutPercent?: number
  ) => { success: boolean; message: string; tradeId?: string };
  hideBalance: boolean;
  toggleHideBalance: () => void;
  todayPnl: { amount: number; percent: number };
  trc20WalletAddress: string;
  updateTrc20WalletAddress: (address: string) => void;
  cryptoAddresses: Record<string, string>;
  updateCryptoAddress: (cryptoId: string, address: string) => void;
  updateAllCryptoAddresses: (addresses: Record<string, string>) => void;
  depositRequests: DepositRequest[];
  hasPendingDeposit: boolean;
  userPendingDeposit: DepositRequest | null;
  submitDepositRequest: (amount: number, network: string, txHash: string) => void;
  approveDepositRequest: (requestId: string) => { success: boolean; message: string };
  rejectDepositRequest: (requestId: string) => { success: boolean; message: string };
  isFirebaseConnected: boolean;
  expiredTradeResult: QuickTrade | null;
  clearExpiredTradeResult: () => void;
  adminWinRatePercent: number;
  updateAdminWinRatePercent: (rate: number) => void;
  investments: UserInvestment[];
  createInvestment: (planId: string, amount: number) => { success: boolean; message: string };
  claimInvestmentEarnings: (investmentId?: string) => { success: boolean; message: string; amountClaimed?: number };
  settleDailyYield: (investmentId: string) => { success: boolean; message: string; amountAdded?: number };
  cancelOrRedeemInvestment: (investmentId: string) => { success: boolean; message: string };
  staffAccount: StaffManagementAccount;
  updateStaffAccount: (account: StaffManagementAccount) => void;
  submitBankTransferDeposit: (params: {
    amountUsd: number;
    amountNgn: number;
    senderName?: string;
    senderBank?: string;
    referenceOrSessionId?: string;
    proofImageUrl?: string;
    proofFileName?: string;
    upgradeLevel?: number;
  }) => { success: boolean; message: string; requestId: string };
  claimDailyGift: () => { success: boolean; message: string; amountAdded?: number };
  canClaimDailyGift: boolean;
  dailyRewardAmount: number;
  currentAccountLevel: number;
  upgradeTierPrices: UpgradeTierPrices;
  updateUpgradeTierPrices: (prices: UpgradeTierPrices) => void;
}

export interface UpgradeTierPrices {
  2: number;
  3: number;
  4: number;
  5: number;
}

export const DEFAULT_UPGRADE_PRICES: UpgradeTierPrices = {
  2: 17350,
  3: 28000,
  4: 42500,
  5: 89000
};

const STORAGE_KEY_UPGRADE_PRICES = 'iq_upgrade_tier_prices';

export const DAILY_REWARD_BY_LEVEL: Record<number, number> = {
  1: 1.00,
  2: 5.00,
  3: 10.00,
  4: 20.00,
  5: 50.00
};

export const getDailyRewardForLevel = (level: number = 1): number => {
  return DAILY_REWARD_BY_LEVEL[level] || 1.00;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSITIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [closedPositions, setClosedPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLOSED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TXS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expiredTradeResult, setExpiredTradeResult] = useState<QuickTrade | null>(null);
  const clearExpiredTradeResult = () => setExpiredTradeResult(null);

  const [hideBalance, setHideBalance] = useState<boolean>(false);

  // Keep localStorage updated
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      // Also update in registered DB
      try {
        const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
        const usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
        const index = usersDb.findIndex((u: User) => u.email.toLowerCase() === currentUser.email.toLowerCase());
        if (index >= 0) {
          usersDb[index] = { ...usersDb[index], ...currentUser };
        } else {
          usersDb.push(currentUser);
        }
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLOSED, JSON.stringify(closedPositions));
  }, [closedPositions]);

  const [quickTrades, setQuickTrades] = useState<QuickTrade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUICK_TRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }

      // Default sample past trades on EUR/USD in the historical candles
      const now = Date.now();
      const initialSeed: QuickTrade[] = [
        {
          id: 'seed_trade_lost_01',
          assetSymbol: 'EUR/USD',
          assetName: 'Euro / US Dollar',
          type: 'sell',
          entryPrice: 1.08260,
          investment: 50,
          payoutPercent: 85,
          durationSeconds: 60,
          startTime: now - 14 * 60 * 1000, // 14 mins ago
          expiresAt: now - 13 * 60 * 1000,
          status: 'lost',
          closePrice: 1.08310,
          profit: -50
        },
        {
          id: 'seed_trade_won_02',
          assetSymbol: 'EUR/USD',
          assetName: 'Euro / US Dollar',
          type: 'buy',
          entryPrice: 1.08305,
          investment: 50,
          payoutPercent: 85,
          durationSeconds: 60,
          startTime: now - 8 * 60 * 1000, // 8 mins ago
          expiresAt: now - 7 * 60 * 1000,
          status: 'won',
          closePrice: 1.08365,
          profit: 42.50
        }
      ];
      return initialSeed;
    } catch {
      return [];
    }
  });

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  const [trc20WalletAddress, setTrc20WalletAddress] = useState<string>(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY_TRC20_ADDRESS) || '').trim();
      if (saved && !LEGACY_DUMMY_CRYPTO_ADDRESSES.has(saved)) {
        return saved;
      }
      return '';
    } catch {
      return '';
    }
  });

  const [cryptoAddresses, setCryptoAddresses] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CRYPTO_ADDRESSES);
      if (saved) {
        return sanitizeCryptoAddressMap(JSON.parse(saved));
      }
    } catch {}
    return { ...DEFAULT_CRYPTO_ADDRESSES };
  });

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEPOSIT_REQUESTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEPOSIT_REQUESTS, JSON.stringify(depositRequests));
  }, [depositRequests]);

  // Firestore Real-Time sync for deposit_requests
  useEffect(() => {
    try {
      const q = query(collection(db, 'deposit_requests'), orderBy('timestamp', 'desc'), limit(100));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: DepositRequest[] = [];
          snapshot.forEach((d) => list.push(d.data() as DepositRequest));
          if (list.length > 0) {
            setDepositRequests(prev => {
              const map = new Map<string, DepositRequest>();
              list.forEach(item => map.set(item.id, item));
              prev.forEach(item => {
                if (!map.has(item.id)) map.set(item.id, item);
              });
              return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });
          }
        }
      }, () => {});
      return () => unsubscribe();
    } catch {}
  }, []);

  // Compute active user's pending deposit
  const userPendingDeposit = useMemo(() => {
    if (!currentUser) return null;
    const req = depositRequests.find(r => 
      (r.userId === currentUser.id || (r.userEmail && r.userEmail.toLowerCase() === currentUser.email.toLowerCase())) &&
      r.status === 'pending_review'
    );
    if (req) return req;

    const pendingTx = transactions.find(t => 
      t.type === 'deposit' && t.status === 'pending' && !t.title.toLowerCase().includes('reject')
    );
    if (pendingTx) {
      return {
        id: pendingTx.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: currentUser.phoneNumber || '',
        amount: pendingTx.amount,
        network: pendingTx.method || 'Bank Transfer',
        depositType: (pendingTx.title?.toLowerCase().includes('bank') ? 'bank_transfer' : 'crypto') as 'crypto' | 'bank_transfer',
        txHash: pendingTx.reference,
        status: 'pending_review' as const,
        timestamp: pendingTx.timestamp
      };
    }
    return null;
  }, [currentUser, depositRequests, transactions]);

  const hasPendingDeposit = Boolean(userPendingDeposit);

  const [adminWinRatePercent, setAdminWinRatePercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_WIN_RATE);
      return saved !== null ? Number(saved) : 50;
    } catch {
      return 50;
    }
  });

  const updateAdminWinRatePercent = (rate: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(rate)));
    setAdminWinRatePercent(clamped);
    localStorage.setItem(STORAGE_KEY_ADMIN_WIN_RATE, clamped.toString());

    try {
      const configRef = doc(db, 'system_settings', 'trade_config');
      setDoc(configRef, {
        adminWinRatePercent: clamped,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Firestore update win rate note:', e);
    }
  };

  // Firestore Real-Time Listener: Win Rate Config
  useEffect(() => {
    try {
      const configRef = doc(db, 'system_settings', 'trade_config');
      const unsubscribe = onSnapshot(configRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (typeof data.adminWinRatePercent === 'number') {
            setAdminWinRatePercent(data.adminWinRatePercent);
            localStorage.setItem(STORAGE_KEY_ADMIN_WIN_RATE, data.adminWinRatePercent.toString());
          }
        }
      }, () => {});
      return () => unsubscribe();
    } catch (e) {}
  }, []);

  // 1. Firebase Firestore Real-Time Listener: Payment Addresses Config
  useEffect(() => {
    try {
      const configRef = doc(db, 'system_settings', 'payment_config');
      const unsubscribe = onSnapshot(configRef, (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            if (typeof data.trc20WalletAddress === 'string') {
              const cleanTrc = data.trc20WalletAddress.trim();
              const validTrc = cleanTrc && !LEGACY_DUMMY_CRYPTO_ADDRESSES.has(cleanTrc) ? cleanTrc : '';
              setTrc20WalletAddress(validTrc);
              localStorage.setItem(STORAGE_KEY_TRC20_ADDRESS, validTrc);
            }
            if (data.cryptoAddresses && typeof data.cryptoAddresses === 'object') {
              const cleaned = sanitizeCryptoAddressMap(data.cryptoAddresses);
              setCryptoAddresses(cleaned);
              localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(cleaned));
            }
          }
        }
        // Do NOT auto-populate dummy crypto addresses if document does not exist
      }, (err) => {
        console.warn('Firestore payment_config notice (fallback to local):', err.message);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore listener setup failed:', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(cryptoAddresses));
  }, [cryptoAddresses]);

  const updateCryptoAddress = (cryptoId: string, address: string) => {
    if (!cryptoId) return;
    const cleanAddr = (address || '').trim();
    const updated = { ...cryptoAddresses, [cryptoId]: cleanAddr };
    if (cryptoId === 'usdt-trc20' || cryptoId === 'trx') {
      setTrc20WalletAddress(cleanAddr);
      localStorage.setItem(STORAGE_KEY_TRC20_ADDRESS, cleanAddr);
    }
    setCryptoAddresses(updated);
    localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(updated));

    try {
      const configRef = doc(db, 'system_settings', 'payment_config');
      setDoc(configRef, {
        trc20WalletAddress: updated['usdt-trc20'] || updated['trx'] || '',
        cryptoAddresses: updated,
        isAdminConfigured: true,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore update cryptoAddresses warning:', err);
      });
    } catch (e) {
      console.warn('Firestore update cryptoAddresses error:', e);
    }
  };

  const updateAllCryptoAddresses = (newAddresses: Record<string, string>) => {
    const cleaned: Record<string, string> = { ...DEFAULT_CRYPTO_ADDRESSES };
    Object.entries({ ...cryptoAddresses, ...newAddresses }).forEach(([k, v]) => {
      cleaned[k] = typeof v === 'string' ? v.trim() : '';
    });
    setCryptoAddresses(cleaned);
    localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(cleaned));
    const trcAddr = cleaned['usdt-trc20'] || cleaned['trx'] || '';
    setTrc20WalletAddress(trcAddr);
    localStorage.setItem(STORAGE_KEY_TRC20_ADDRESS, trcAddr);

    try {
      const configRef = doc(db, 'system_settings', 'payment_config');
      setDoc(configRef, {
        trc20WalletAddress: trcAddr,
        cryptoAddresses: cleaned,
        isAdminConfigured: true,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore update all cryptoAddresses warning:', err);
      });
    } catch (e) {
      console.warn('Firestore update all cryptoAddresses error:', e);
    }
  };

  const updateTrc20WalletAddress = (address: string) => {
    updateCryptoAddress('usdt-trc20', address);
  };

  // Staff Management Account state for Nigerian Bank Transfers
  const [staffAccount, setStaffAccount] = useState<StaffManagementAccount>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF_ACCOUNT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          parsed.isConfigured &&
          parsed.bankName?.trim() &&
          parsed.accountNumber?.trim() &&
          parsed.accountNumber !== '8102345678' &&
          parsed.accountName !== 'STAFF MANAGEMENT TREASURY / IQ PLUS'
        ) {
          return { ...parsed, isConfigured: true };
        }
      }
      return DEFAULT_STAFF_ACCOUNT;
    } catch {
      return DEFAULT_STAFF_ACCOUNT;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STAFF_ACCOUNT, JSON.stringify(staffAccount));
  }, [staffAccount]);

  // Firestore sync for Staff Management Account
  useEffect(() => {
    try {
      const configRef = doc(db, 'system_settings', 'staff_management_account');
      const unsubscribe = onSnapshot(configRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as StaffManagementAccount;
          if (
            data &&
            data.isConfigured &&
            data.bankName?.trim() &&
            data.accountNumber?.trim() &&
            data.accountNumber !== '8102345678'
          ) {
            setStaffAccount(data);
            localStorage.setItem(STORAGE_KEY_STAFF_ACCOUNT, JSON.stringify(data));
          } else if (data && data.isConfigured === false) {
            setStaffAccount(DEFAULT_STAFF_ACCOUNT);
            localStorage.setItem(STORAGE_KEY_STAFF_ACCOUNT, JSON.stringify(DEFAULT_STAFF_ACCOUNT));
          }
        }
        // Do NOT call setDoc with default fake account if document does not exist!
      }, (err) => {
        console.warn('Firestore staff_account notice:', err.message);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore staff account listener error:', e);
    }
  }, []);

  const updateStaffAccount = (newAccount: StaffManagementAccount) => {
    const isConfigured = Boolean(
      newAccount.isConfigured !== false &&
      newAccount.bankName?.trim() &&
      newAccount.accountNumber?.trim() &&
      newAccount.accountName?.trim()
    );

    const updated: StaffManagementAccount = {
      bankName: newAccount.bankName?.trim() || '',
      accountNumber: newAccount.accountNumber?.trim() || '',
      accountName: newAccount.accountName?.trim() || '',
      exchangeRateNgn: Number(newAccount.exchangeRateNgn) || 1550,
      paymentInstructions: newAccount.paymentInstructions?.trim() || '',
      isConfigured,
      updatedAt: new Date().toISOString()
    };

    setStaffAccount(updated);
    localStorage.setItem(STORAGE_KEY_STAFF_ACCOUNT, JSON.stringify(updated));

    try {
      const configRef = doc(db, 'system_settings', 'staff_management_account');
      setDoc(configRef, updated).catch((err) => {
        console.warn('Firestore staff account update warning:', err);
      });
    } catch (e) {
      console.warn('Firestore staff account update error:', e);
    }
  };

  // Account Upgrade Tier Prices State (Admin Configurable in NGN)
  const [upgradeTierPrices, setUpgradeTierPrices] = useState<UpgradeTierPrices>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPGRADE_PRICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          2: Number(parsed[2]) > 0 ? Number(parsed[2]) : DEFAULT_UPGRADE_PRICES[2],
          3: Number(parsed[3]) > 0 ? Number(parsed[3]) : DEFAULT_UPGRADE_PRICES[3],
          4: Number(parsed[4]) > 0 ? Number(parsed[4]) : DEFAULT_UPGRADE_PRICES[4],
          5: Number(parsed[5]) > 0 ? Number(parsed[5]) : DEFAULT_UPGRADE_PRICES[5]
        };
      }
      return DEFAULT_UPGRADE_PRICES;
    } catch {
      return DEFAULT_UPGRADE_PRICES;
    }
  });

  useEffect(() => {
    try {
      const configRef = doc(db, 'system_settings', 'upgrade_prices');
      const unsubscribe = onSnapshot(configRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            const nextPrices: UpgradeTierPrices = {
              2: Number(data[2] ?? data.level2) > 0 ? Number(data[2] ?? data.level2) : DEFAULT_UPGRADE_PRICES[2],
              3: Number(data[3] ?? data.level3) > 0 ? Number(data[3] ?? data.level3) : DEFAULT_UPGRADE_PRICES[3],
              4: Number(data[4] ?? data.level4) > 0 ? Number(data[4] ?? data.level4) : DEFAULT_UPGRADE_PRICES[4],
              5: Number(data[5] ?? data.level5) > 0 ? Number(data[5] ?? data.level5) : DEFAULT_UPGRADE_PRICES[5]
            };
            setUpgradeTierPrices(nextPrices);
            localStorage.setItem(STORAGE_KEY_UPGRADE_PRICES, JSON.stringify(nextPrices));
          }
        }
      }, () => {});
      return () => unsubscribe();
    } catch {}
  }, []);

  const updateUpgradeTierPrices = (prices: UpgradeTierPrices) => {
    const cleaned: UpgradeTierPrices = {
      2: Math.max(100, Number(prices[2]) || DEFAULT_UPGRADE_PRICES[2]),
      3: Math.max(100, Number(prices[3]) || DEFAULT_UPGRADE_PRICES[3]),
      4: Math.max(100, Number(prices[4]) || DEFAULT_UPGRADE_PRICES[4]),
      5: Math.max(100, Number(prices[5]) || DEFAULT_UPGRADE_PRICES[5])
    };
    setUpgradeTierPrices(cleaned);
    localStorage.setItem(STORAGE_KEY_UPGRADE_PRICES, JSON.stringify(cleaned));

    try {
      const configRef = doc(db, 'system_settings', 'upgrade_prices');
      setDoc(configRef, {
        ...cleaned,
        updatedAt: new Date().toISOString()
      }).catch((err) => {
        console.warn('Firestore updateUpgradeTierPrices warning:', err);
      });
    } catch (e) {
      console.warn('Firestore updateUpgradeTierPrices error:', e);
    }
  };

  const submitDepositRequest = (amount: number, network: string, txHash: string) => {
    if (!currentUser || amount <= 0 || hasPendingDeposit) return;

    const newRequest: DepositRequest = {
      id: 'dep_req_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phoneNumber || '',
      amount,
      network: network || 'TRC20',
      depositType: 'crypto',
      txHash: txHash || '0x' + Math.random().toString(16).substring(2, 10),
      status: 'pending_review',
      timestamp: new Date().toISOString()
    };

    setDepositRequests(prev => [newRequest, ...prev]);

    // Push to Firebase Firestore so admin dashboard on any device can see & approve
    try {
      const reqRef = doc(db, 'deposit_requests', newRequest.id);
      setDoc(reqRef, newRequest).catch((err) => {
        console.warn('Firestore submitDepositRequest warning:', err);
      });
    } catch (e) {
      console.warn('Firestore submitDepositRequest error:', e);
    }

    // Add pending transaction for user
    const pendingTx: Transaction = {
      id: 'tx_dep_req_' + Date.now(),
      type: 'deposit',
      amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
      title: `USDT (${network || 'TRC20'}) Deposit`,
      reference: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
      method: `${network || 'TRC20'} Network`
    };

    setTransactions(prev => [pendingTx, ...prev]);
  };

  const submitBankTransferDeposit = (params: {
    amountUsd: number;
    amountNgn: number;
    senderName?: string;
    senderBank?: string;
    referenceOrSessionId?: string;
    proofImageUrl?: string;
    proofFileName?: string;
    upgradeLevel?: number;
  }) => {
    if (!currentUser || params.amountUsd <= 0) {
      return { success: false, message: 'Invalid deposit amount or not logged in.', requestId: '' };
    }

    if (!staffAccount || !staffAccount.isConfigured || !staffAccount.bankName?.trim() || !staffAccount.accountNumber?.trim()) {
      return {
        success: false,
        message: 'Naira bank transfer is currently unavailable. Payment account has not been configured by the admin yet.',
        requestId: ''
      };
    }

    if (hasPendingDeposit) {
      return {
        success: false,
        message: 'You already have a pending request awaiting admin approval.',
        requestId: ''
      };
    }

    const reqId = 'dep_bank_' + Date.now();
    const cleanRef = params.referenceOrSessionId?.trim() || 'TRF-' + Math.floor(10000000 + Math.random() * 90000000);
    const newRequest: DepositRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phoneNumber || '',
      amount: params.amountUsd,
      ngnAmount: params.amountNgn,
      depositType: 'bank_transfer',
      network: `Bank Transfer (${staffAccount.bankName})`,
      txHash: cleanRef,
      proofImageUrl: params.proofImageUrl || '',
      proofFileName: params.proofFileName || 'transfer_receipt.jpg',
      senderName: params.senderName || currentUser.name,
      senderBank: params.senderBank || 'Local Bank',
      upgradeLevel: params.upgradeLevel,
      staffAccountDetails: {
        bankName: staffAccount.bankName,
        accountNumber: staffAccount.accountNumber,
        accountName: staffAccount.accountName
      },
      status: 'pending_review',
      timestamp: new Date().toISOString()
    };

    setDepositRequests(prev => [newRequest, ...prev]);

    try {
      const reqRef = doc(db, 'deposit_requests', newRequest.id);
      setDoc(reqRef, newRequest).catch((err) => {
        console.warn('Firestore submitBankTransferDeposit warning:', err);
      });
    } catch (e) {
      console.warn('Firestore submitBankTransferDeposit error:', e);
    }

    const pendingTx: Transaction = {
      id: 'tx_bank_' + Date.now(),
      type: 'deposit',
      amount: params.amountUsd,
      status: 'pending',
      timestamp: new Date().toISOString(),
      title: `Bank Transfer (₦${params.amountNgn.toLocaleString()} NGN)`,
      reference: cleanRef,
      method: `Bank Transfer (${staffAccount.bankName})`
    };

    setTransactions(prev => [pendingTx, ...prev]);

    return {
      success: true,
      message: 'Bank transfer payment proof submitted! Awaiting admin review and approval.',
      requestId: reqId
    };
  };

  const approveDepositRequest = (requestId: string) => {
    const targetReq = depositRequests.find(r => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Deposit request not found.' };

    // Detect if this request is an account upgrade and determine the target level
    let detectedUpgradeLevel = targetReq.upgradeLevel || 0;
    if (!detectedUpgradeLevel && targetReq.senderBank) {
      const match = targetReq.senderBank.match(/Level\s*(\d+)/i);
      if (match) detectedUpgradeLevel = Number(match[1]);
    }
    if (!detectedUpgradeLevel && targetReq.ngnAmount) {
      if (targetReq.ngnAmount === upgradeTierPrices[2] || targetReq.ngnAmount === 17350) detectedUpgradeLevel = 2;
      else if (targetReq.ngnAmount === upgradeTierPrices[3] || targetReq.ngnAmount === 28000) detectedUpgradeLevel = 3;
      else if (targetReq.ngnAmount === upgradeTierPrices[4] || targetReq.ngnAmount === 42500) detectedUpgradeLevel = 4;
      else if (targetReq.ngnAmount === upgradeTierPrices[5] || targetReq.ngnAmount === 89000) detectedUpgradeLevel = 5;
    }

    // Update local request status
    setDepositRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'completed' } : r));

    // Update in Firestore
    try {
      const reqRef = doc(db, 'deposit_requests', requestId);
      updateDoc(reqRef, {
        status: 'completed',
        approvedAt: new Date().toISOString()
      }).catch((e) => console.warn('Firestore approve request warning:', e));

      // Also update user's balance & accountLevel in Firestore
      if (targetReq.userId) {
        getDocs(collection(db, 'users')).then((snap) => {
          snap.forEach((uDoc) => {
            const uData = uDoc.data();
            if (uDoc.id === targetReq.userId || (uData.email && uData.email.toLowerCase() === targetReq.userEmail.toLowerCase())) {
              const currentBal = typeof uData.balance === 'number' ? uData.balance : 0;
              const newBal = Number((currentBal + targetReq.amount).toFixed(2));
              const currentLvl = typeof uData.accountLevel === 'number' ? uData.accountLevel : 1;
              const newLvl = detectedUpgradeLevel > 0 ? Math.max(currentLvl, detectedUpgradeLevel) : currentLvl;
              updateDoc(doc(db, 'users', uDoc.id), {
                balance: newBal,
                accountLevel: newLvl,
                ...(detectedUpgradeLevel > currentLvl ? { lastDailyGiftClaimDate: '' } : {})
              }).catch(() => {});
            }
          });
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore approve error:', e);
    }

    // Credit target user balance & accountLevel in registered DB
    try {
      const savedDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const dbUsers: User[] = savedDbStr ? JSON.parse(savedDbStr) : [];
      const userIdx = dbUsers.findIndex(u => u.email.toLowerCase() === targetReq.userEmail.toLowerCase());

      if (userIdx >= 0) {
        dbUsers[userIdx].balance = Number((dbUsers[userIdx].balance + targetReq.amount).toFixed(2));
        const currentLvl = dbUsers[userIdx].accountLevel || 1;
        if (detectedUpgradeLevel > 0) {
          dbUsers[userIdx].accountLevel = Math.max(currentLvl, detectedUpgradeLevel);
          if (detectedUpgradeLevel > currentLvl) {
            dbUsers[userIdx].lastDailyGiftClaimDate = '';
          }
        }
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(dbUsers));
      }
    } catch (e) {
      console.error(e);
    }

    // If active user is the target, credit their active balance & upgrade their account level
    if (currentUser && currentUser.email.toLowerCase() === targetReq.userEmail.toLowerCase()) {
      const updatedBalance = Number((currentUser.balance + targetReq.amount).toFixed(2));
      const currentLvl = currentUser.accountLevel || 1;
      const newLvl = detectedUpgradeLevel > 0 ? Math.max(currentLvl, detectedUpgradeLevel) : currentLvl;
      setCurrentUser({
        ...currentUser,
        balance: updatedBalance,
        accountLevel: newLvl,
        ...(detectedUpgradeLevel > currentLvl ? { lastDailyGiftClaimDate: '' } : {})
      });
    }

    // Update user pending transactions to completed
    setTransactions(prev => prev.map(tx => {
      if (tx.type === 'deposit' && tx.status === 'pending' && Math.abs(tx.amount - targetReq.amount) < 0.01) {
        const confirmedTitle = detectedUpgradeLevel > 0
          ? `Account Upgraded to Level ${detectedUpgradeLevel} (Daily Reward: $${getDailyRewardForLevel(detectedUpgradeLevel).toFixed(2)})`
          : targetReq.depositType === 'bank_transfer'
          ? `Bank Transfer (${targetReq.staffAccountDetails?.bankName || 'Staff Account'}) Confirmed`
          : `USDT (${targetReq.network}) Deposit Confirmed`;
        return { ...tx, status: 'completed', title: confirmedTitle };
      }
      return tx;
    }));

    return {
      success: true,
      message: detectedUpgradeLevel > 0
        ? `Approved Level ${detectedUpgradeLevel} Upgrade for ${targetReq.userName}! Daily reward is now $${getDailyRewardForLevel(detectedUpgradeLevel).toFixed(2)}.`
        : `Approved $${targetReq.amount.toFixed(2)} deposit for ${targetReq.userName}!`
    };
  };

  const rejectDepositRequest = (requestId: string) => {
    const targetReq = depositRequests.find(r => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Deposit request not found.' };

    setDepositRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));

    // Update in Firestore
    try {
      const reqRef = doc(db, 'deposit_requests', requestId);
      updateDoc(reqRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      }).catch((e) => console.warn('Firestore reject warning:', e));
    } catch (e) {
      console.warn('Firestore reject error:', e);
    }

    // Update transaction to rejected/cancelled
    setTransactions(prev => prev.map(tx => {
      if (tx.type === 'deposit' && tx.status === 'pending' && Math.abs(tx.amount - targetReq.amount) < 0.01) {
        const rejectedTitle = targetReq.depositType === 'bank_transfer'
          ? `Bank Transfer (${targetReq.staffAccountDetails?.bankName || 'Staff Account'}) Rejected`
          : `USDT (${targetReq.network}) Deposit Rejected`;
        return { ...tx, status: 'completed', title: rejectedTitle };
      }
      return tx;
    }));

    return { success: true, message: `Rejected deposit request for ${targetReq.userName}.` };
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUICK_TRADES, JSON.stringify(quickTrades));
  }, [quickTrades]);

  // Register function: Balance is strictly initialized to 0.00
  const register = (
    name: string, 
    email: string, 
    password: string, 
    country: string = 'Nigeria', 
    countryCode: string = 'NG', 
    phoneNumber: string = ''
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) return { success: false, message: 'Please enter your full name.' };
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Please provide a valid email address.' };
    if (!password || password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };

    try {
      const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
      const exists = usersDb.some((u: { email: string }) => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return { success: false, message: 'An account with this email already exists. Please log in.' };
      }

      const randomAcc = 'IQ-' + Math.floor(100000 + Math.random() * 900000);
      const todayDateStr = new Date().toISOString().split('T')[0];
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        balance: 20.00, // $20 registration gift credited directly to balance
        currency: 'USD',
        registeredAt: new Date().toISOString(),
        isKycVerified: true,
        accountNumber: randomAcc,
        country: country || 'Nigeria',
        countryCode: countryCode || 'NG',
        phoneNumber: phoneNumber || '',
        lastDailyGiftClaimDate: todayDateStr,
        totalClaimedGifts: 1,
        accountLevel: 1
      };

      usersDb.push({ ...newUser, password });
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
      setCurrentUser(newUser);


      // Save user to Cloud Firestore
      try {
        setDoc(doc(db, 'users', newUser.id), {
          ...newUser,
          password
        }).catch((e) => console.warn('Firestore register warning:', e));
      } catch (err) {
        console.warn('Firestore register error:', err);
      }

      // Add registration gift credit transaction
      const welcomeGiftTx: Transaction = {
        id: 'tx_gift_' + Date.now(),
        type: 'deposit',
        amount: 20.00,
        status: 'completed',
        timestamp: new Date().toISOString(),
        title: 'Welcome Gift: $20.00 Registration Bonus',
        reference: 'GIFT-' + Math.floor(100000 + Math.random() * 900000),
        method: 'Registration Trading Gift'
      };
      setTransactions([welcomeGiftTx]);
      setPositions([]);
      setClosedPositions([]);

      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const login = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
      const matched = usersDb.find((u: { email: string; password?: string }) => u.email.toLowerCase() === cleanEmail);

      if (matched) {
        if (matched.password && matched.password !== password) {
          return { success: false, message: 'Incorrect password. Please try again.' };
        }

        const userSession: User = {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          balance: typeof matched.balance === 'number' ? matched.balance : 0.00,
          currency: matched.currency || 'USD',
          registeredAt: matched.registeredAt || new Date().toISOString(),
          isKycVerified: matched.isKycVerified ?? true,
          accountNumber: matched.accountNumber || 'IQ-883192',
          country: matched.country || 'Nigeria',
          countryCode: matched.countryCode || 'NG',
          phoneNumber: matched.phoneNumber || '',
          lastDailyGiftClaimDate: matched.lastDailyGiftClaimDate,
          totalClaimedGifts: matched.totalClaimedGifts,
          accountLevel: matched.accountLevel || 1
        };
        setCurrentUser(userSession);
        return { success: true };
      }

      // If not in local storage, attempt to fetch from Firestore
      getDocs(collection(db, 'users')).then((snap) => {
        snap.forEach((uDoc) => {
          const uData = uDoc.data();
          if (uData.email && uData.email.toLowerCase() === cleanEmail) {
            if (uData.password === password) {
              const cloudUser: User = {
                id: uDoc.id,
                name: uData.name || 'User',
                email: uData.email,
                balance: typeof uData.balance === 'number' ? uData.balance : 0.00,
                currency: uData.currency || 'USD',
                registeredAt: uData.registeredAt || new Date().toISOString(),
                isKycVerified: uData.isKycVerified ?? true,
                accountNumber: uData.accountNumber || 'IQ-883192',
                country: uData.country || 'Nigeria',
                countryCode: uData.countryCode || 'NG',
                phoneNumber: uData.phoneNumber || '',
                lastDailyGiftClaimDate: uData.lastDailyGiftClaimDate,
                totalClaimedGifts: uData.totalClaimedGifts,
                accountLevel: uData.accountLevel || 1
              };
              setCurrentUser(cloudUser);
              // Cache locally
              usersDb.push({ ...cloudUser, password });
              localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
            }
          }
        });
      }).catch(() => {});

      return { success: false, message: 'No account found with this email. Please register.' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Login failed. Please check credentials.' };
    }
  };

  const quickDemoLogin = () => {
    // Quick Demo account with Nigerian country preset
    const demoUser: User = {
      id: 'usr_demo_01',
      name: 'Alex Vance',
      email: 'alex.vance@iq-plus.io',
      balance: 0.00, // Starts at 0.00 as required
      currency: 'USD',
      registeredAt: new Date().toISOString(),
      isKycVerified: true,
      accountNumber: 'IQ-724910',
      country: 'Nigeria',
      countryCode: 'NG',
      phoneNumber: '+234 803 123 4567'
    };
    setCurrentUser(demoUser);
  };

  const updateUserCountry = (country: string, countryCode?: string) => {
    if (!currentUser) return;
    const code = countryCode || (country === 'Nigeria' ? 'NG' : 'US');
    const updated = { ...currentUser, country, countryCode: code };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    try {
      const userRef = doc(db, 'users', currentUser.id);
      updateDoc(userRef, { country, countryCode: code }).catch(() => {});
    } catch {}
  };


  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const depositFunds = (amount: number, method: string) => {
    if (!currentUser || amount <= 0 || hasPendingDeposit) return;
    const newBal = Number((currentUser.balance + amount).toFixed(2));
    setCurrentUser({ ...currentUser, balance: newBal });

    const newTx: Transaction = {
      id: 'tx_dep_' + Date.now(),
      type: 'deposit',
      amount,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Deposit via ${method}`,
      reference: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
      method
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const withdrawFunds = (
    amount: number, 
    method: string, 
    address: string, 
    details?: Transaction['destinationDetails']
  ) => {
    if (!currentUser) return { success: false, message: 'Please log in to withdraw.' };
    if (amount <= 0) return { success: false, message: 'Withdrawal amount must be greater than zero.' };
    if (amount < 100) {
      return {
        success: false,
        message: 'Minimum withdrawal is $100.00. Please trade or accumulate your balance to at least $100.00 to request a payout.'
      };
    }
    if (currentUser.balance < amount) {
      return {
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). You cannot withdraw more than your balance.`
      };
    }

    const newBal = Number((currentUser.balance - amount).toFixed(2));
    setCurrentUser({ ...currentUser, balance: newBal });

    let txTitle = `Withdrawal to ${address.slice(0, 10)}... (${method})`;
    if (details?.type === 'nigerian_bank' && details.bankName) {
      const ngnStr = details.ngnAmount ? ` - ₦${details.ngnAmount.toLocaleString()} NGN` : '';
      txTitle = `${details.bankName} (${details.accountNumber || address})${ngnStr}`;
    } else if (details?.type === 'crypto') {
      txTitle = `${details.cryptoNetwork || method} to ${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    const newTx: Transaction = {
      id: 'tx_wdr_' + Date.now(),
      type: 'withdrawal',
      amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
      title: txTitle,
      reference: 'WDR-' + Math.floor(100000 + Math.random() * 900000),
      method,
      destinationDetails: details
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: details?.type === 'nigerian_bank'
        ? `Withdrawal of $${amount.toFixed(2)} (₦${(details.ngnAmount || 0).toLocaleString()} NGN) to ${details.bankName} account ${details.accountNumber} placed. Status: Pending Level 2 Verification.`
        : `Withdrawal request for $${amount.toFixed(2)} to ${address.slice(0, 8)}... placed. Status: Pending Level 2 Verification.`
    };
  };


  const openTrade = (
    symbol: string,
    assetName: string,
    type: 'buy' | 'sell',
    margin: number,
    leverage: number,
    currentPrice: number,
    takeProfit?: number,
    stopLoss?: number
  ) => {
    if (!currentUser) return { success: false, message: 'Please log in to execute trades.' };
    if (margin <= 0) return { success: false, message: 'Margin must be greater than $0.' };
    if (currentUser.balance < margin) {
      return {
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). Please deposit funds to open a position with $${margin.toFixed(2)} margin.`
      };
    }

    // Deduct margin from active balance
    const updatedBalance = Number((currentUser.balance - margin).toFixed(2));
    setCurrentUser({ ...currentUser, balance: updatedBalance });

    const positionSize = Number(((margin * leverage) / currentPrice).toFixed(6));
    const newPosition: Position = {
      id: 'pos_' + Date.now(),
      symbol,
      assetName,
      type,
      entryPrice: currentPrice,
      currentPrice,
      margin,
      leverage,
      size: positionSize,
      pnl: 0,
      pnlPercent: 0,
      timestamp: new Date().toISOString(),
      takeProfit,
      stopLoss
    };

    setPositions(prev => [newPosition, ...prev]);

    return {
      success: true,
      message: `Successfully opened ${type.toUpperCase()} position for ${symbol} with ${leverage}x leverage.`
    };
  };

  const closeTrade = (positionId: string, currentMarketPrice: number) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos || !currentUser) return { success: false, message: 'Position not found.' };

    const priceDiff = pos.type === 'buy' ? currentMarketPrice - pos.entryPrice : pos.entryPrice - currentMarketPrice;
    const finalPnl = Number((priceDiff * pos.size).toFixed(2));
    const returnAmount = Math.max(0, Number((pos.margin + finalPnl).toFixed(2)));
    const updatedBalance = Number((currentUser.balance + returnAmount).toFixed(2));

    setCurrentUser({ ...currentUser, balance: updatedBalance });

    const updatedPos: Position = {
      ...pos,
      currentPrice: currentMarketPrice,
      pnl: finalPnl,
      pnlPercent: Number(((finalPnl / pos.margin) * 100).toFixed(2))
    };

    setPositions(prev => prev.filter(p => p.id !== positionId));
    setClosedPositions(prev => [updatedPos, ...prev]);

    const tradeTx: Transaction = {
      id: 'tx_trade_' + Date.now(),
      type: finalPnl >= 0 ? 'trade_profit' : 'trade_loss',
      amount: Math.abs(finalPnl),
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Close ${pos.type.toUpperCase()} ${pos.symbol} (${finalPnl >= 0 ? '+' : ''}$${finalPnl.toFixed(2)})`,
      reference: 'TRD-' + Math.floor(100000 + Math.random() * 900000)
    };
    setTransactions(prev => [tradeTx, ...prev]);

    return {
      success: true,
      message: `Closed ${pos.symbol} position with ${finalPnl >= 0 ? 'Profit' : 'Loss'} of $${Math.abs(finalPnl).toFixed(2)}.`
    };
  };

  const toggleHideBalance = () => setHideBalance(prev => !prev);

  // Compute today's P&L
  const todayPnl = {
    amount: positions.reduce((acc, p) => acc + p.pnl, 0),
    percent: currentUser?.balance && currentUser.balance > 0 
      ? Number(((positions.reduce((acc, p) => acc + p.pnl, 0) / currentUser.balance) * 100).toFixed(2)) 
      : 0.00
  };

  const resolveQuickTrade = (tradeId: string) => {
    setQuickTrades(prevTrades => {
      const tradeIndex = prevTrades.findIndex(t => t.id === tradeId);
      if (tradeIndex === -1) return prevTrades;

      const trade = prevTrades[tradeIndex];
      if (trade.status !== 'active') return prevTrades;

      // Determine trade outcome using Admin set Win Rate Probability % (0% to 100%)
      const roll = Math.random() * 100;
      const isWon = roll < adminWinRatePercent;

      const isForex = trade.assetSymbol.includes('/') || trade.entryPrice < 2;
      const deltaPct = (0.05 + Math.random() * 0.15) / 100;
      const deltaVal = isForex 
        ? Number((0.0003 + Math.random() * 0.0007).toFixed(5))
        : Number((trade.entryPrice * deltaPct).toFixed(2));

      let closePrice: number;
      if (isWon) {
        closePrice = trade.type === 'buy'
          ? Number((trade.entryPrice + deltaVal).toFixed(isForex ? 5 : 2))
          : Number((trade.entryPrice - deltaVal).toFixed(isForex ? 5 : 2));
      } else {
        closePrice = trade.type === 'buy'
          ? Number((trade.entryPrice - deltaVal).toFixed(isForex ? 5 : 2))
          : Number((trade.entryPrice + deltaVal).toFixed(isForex ? 5 : 2));
      }

      const profit = isWon ? Number((trade.investment * (trade.payoutPercent / 100)).toFixed(2)) : -trade.investment;
      const payout = isWon ? Number((trade.investment + profit).toFixed(2)) : 0;

      if (isWon && currentUser) {
        setCurrentUser(curr => curr ? { ...curr, balance: Number((curr.balance + payout).toFixed(2)) } : null);
      }

      // Record exact expiry candle to persistent chart history
      recordTradeResultOnCandles(trade.assetSymbol, closePrice);

      // Log transaction
      const tx: Transaction = {
        id: 'tx_qt_' + Date.now(),
        type: isWon ? 'trade_profit' : 'trade_loss',
        amount: isWon ? profit : trade.investment,
        status: 'completed',
        timestamp: new Date().toISOString(),
        title: `${trade.assetSymbol} ${trade.durationSeconds}s ${trade.type.toUpperCase()} (${isWon ? 'Won +$' + profit : 'Lost -$' + trade.investment})`,
        reference: 'BIN-' + Math.floor(100000 + Math.random() * 900000)
      };
      setTransactions(prev => [tx, ...prev]);

      const updatedTrade: QuickTrade = {
        ...trade,
        closePrice,
        profit,
        status: isWon ? 'won' : 'lost'
      };

      // Set for trade result popup modal
      setExpiredTradeResult(updatedTrade);

      const next = [...prevTrades];
      next[tradeIndex] = updatedTrade;
      return next;
    });
  };

  const placeQuickTrade = (
    symbol: string,
    assetName: string,
    type: 'buy' | 'sell',
    investment: number,
    durationSeconds: number,
    entryPrice: number,
    payoutPercent: number = 85
  ) => {
    if (!currentUser) return { success: false, message: 'Please log in to trade.' };
    if (investment <= 0) return { success: false, message: 'Please enter a valid investment amount.' };
    if (currentUser.balance < investment) {
      return {
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). Please deposit funds to place this $${investment.toFixed(2)} trade.`
      };
    }

    // Deduct investment from balance immediately
    const updatedBalance = Number((currentUser.balance - investment).toFixed(2));
    setCurrentUser({ ...currentUser, balance: updatedBalance });

    const now = Date.now();
    const tradeId = 'qtrade_' + now + '_' + Math.floor(Math.random() * 1000);
    const newTrade: QuickTrade = {
      id: tradeId,
      assetSymbol: symbol,
      assetName,
      type,
      entryPrice,
      investment,
      payoutPercent,
      durationSeconds,
      startTime: now,
      expiresAt: now + durationSeconds * 1000,
      status: 'active'
    };

    setQuickTrades(prev => [newTrade, ...prev]);

    // Schedule resolution
    setTimeout(() => {
      resolveQuickTrade(tradeId);
    }, durationSeconds * 1000);

    return {
      success: true,
      message: `${type.toUpperCase()} order placed! Resolves in ${durationSeconds}s.`,
      tradeId
    };
  };

  // User Crypto Investments & Yield Management
  const [investments, setInvestments] = useState<UserInvestment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVESTMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INVESTMENTS, JSON.stringify(investments));
  }, [investments]);

  // Periodic yield accrual engine (runs every 6 seconds)
  useEffect(() => {
    if (!investments.some(inv => inv.status === 'active')) return;

    const interval = setInterval(() => {
      setInvestments(prev => {
        let changed = false;
        const now = Date.now();
        const updated = prev.map(inv => {
          if (inv.status !== 'active') return inv;

          // Check if maturity reached
          const endMs = new Date(inv.endDate).getTime();
          if (now >= endMs) {
            changed = true;
            const totalPayout = Number((inv.investedAmount + inv.accruedEarnings).toFixed(2));
            if (currentUser && totalPayout > 0) {
              const newBal = Number((currentUser.balance + totalPayout).toFixed(2));
              setCurrentUser(curr => curr ? { ...curr, balance: newBal } : null);

              const maturityTx: Transaction = {
                id: 'tx_mat_' + Date.now(),
                type: 'investment_yield',
                amount: totalPayout,
                status: 'completed',
                timestamp: new Date().toISOString(),
                title: `Investment Matured: ${inv.planName} (Principal + Yield Return)`,
                reference: 'MAT-' + Math.floor(100000 + Math.random() * 900000),
                method: 'Crypto Vault Maturity'
              };
              setTransactions(t => [maturityTx, ...t]);
            }
            return {
              ...inv,
              status: 'completed' as const,
              accruedEarnings: 0,
              claimedEarnings: Number((inv.claimedEarnings + inv.accruedEarnings).toFixed(2))
            };
          }

          // Otherwise accrue proportional interest since last accrual
          const elapsedSeconds = Math.max(1, (now - inv.lastAccrualTimestamp) / 1000);
          const profitPerSecond = inv.dailyProfitAmount / 86400;
          const incrementalProfit = Number((profitPerSecond * elapsedSeconds).toFixed(6));

          if (incrementalProfit > 0) {
            changed = true;
            return {
              ...inv,
              accruedEarnings: Number((inv.accruedEarnings + incrementalProfit).toFixed(4)),
              lastAccrualTimestamp: now
            };
          }
          return inv;
        });

        return changed ? updated : prev;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [investments, currentUser]);

  const createInvestment = (planId: string, amount: number) => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to start an investment.' };
    }
    const plan = INVESTMENT_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { success: false, message: 'Invalid investment plan selected.' };
    }
    if (amount <= 0) {
      return { success: false, message: 'Investment amount must be greater than zero.' };
    }
    if (amount < plan.minInvestment) {
      return { success: false, message: `Minimum investment for this plan is $${plan.minInvestment}.` };
    }
    if (amount > plan.maxInvestment) {
      return { success: false, message: `Maximum investment for this plan is $${plan.maxInvestment.toLocaleString()}.` };
    }
    if (currentUser.balance < amount) {
      return {
        success: false,
        message: `Insufficient dashboard balance ($${currentUser.balance.toFixed(2)}). Please deposit funds to invest.`
      };
    }

    // Deduct from dashboard balance
    const updatedBalance = Number((currentUser.balance - amount).toFixed(2));
    setCurrentUser({ ...currentUser, balance: updatedBalance });

    // Daily profit calculation based on APY
    const dailyProfit = Number(((amount * (plan.apyPercent / 100)) / 365).toFixed(4));
    const now = Date.now();
    const newInv: UserInvestment = {
      id: 'inv_' + now + '_' + Math.floor(Math.random() * 1000),
      planId: plan.id,
      planName: plan.name,
      cryptoSymbol: plan.cryptoSymbol,
      investedAmount: amount,
      startDate: new Date(now).toISOString(),
      endDate: new Date(now + plan.durationDays * 24 * 60 * 60 * 1000).toISOString(),
      durationDays: plan.durationDays,
      apyPercent: plan.apyPercent,
      dailyProfitAmount: dailyProfit,
      accruedEarnings: 0,
      claimedEarnings: 0,
      status: 'active',
      lastAccrualTimestamp: now
    };

    setInvestments(prev => [newInv, ...prev]);

    // Record Transaction
    const newTx: Transaction = {
      id: 'tx_inv_' + now,
      type: 'investment',
      amount,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Crypto Staking: ${plan.cryptoName} (${plan.cryptoSymbol})`,
      reference: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      method: 'Dashboard Balance'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Successfully invested $${amount.toFixed(2)} into ${plan.name} at ${plan.apyPercent}% APY!`
    };
  };

  const claimInvestmentEarnings = (investmentId?: string) => {
    if (!currentUser) return { success: false, message: 'Please log in to claim earnings.' };

    const targetInvs = investmentId 
      ? investments.filter(i => i.id === investmentId && i.status === 'active')
      : investments.filter(i => i.status === 'active');

    const totalClaim = Number(targetInvs.reduce((acc, i) => acc + i.accruedEarnings, 0).toFixed(2));
    if (totalClaim <= 0) {
      return { success: false, message: 'No uncollected earnings available to claim yet.' };
    }

    // Deliver earnings to dashboard balance
    const newBal = Number((currentUser.balance + totalClaim).toFixed(2));
    setCurrentUser({ ...currentUser, balance: newBal });

    // Update investments
    setInvestments(prev => prev.map(inv => {
      const match = targetInvs.some(t => t.id === inv.id);
      if (match) {
        return {
          ...inv,
          accruedEarnings: 0,
          claimedEarnings: Number((inv.claimedEarnings + inv.accruedEarnings).toFixed(2))
        };
      }
      return inv;
    }));

    // Record Transaction
    const newTx: Transaction = {
      id: 'tx_claim_' + Date.now(),
      type: 'investment_yield',
      amount: totalClaim,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Yield Earnings Delivered to Balance (+${totalClaim.toFixed(2)})`,
      reference: 'CLM-' + Math.floor(100000 + Math.random() * 900000),
      method: 'Crypto Vault Staking Yield'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Successfully credited +$${totalClaim.toFixed(2)} earnings directly to your dashboard balance!`,
      amountClaimed: totalClaim
    };
  };

  const settleDailyYield = (investmentId: string) => {
    if (!currentUser) return { success: false, message: 'Please log in.' };
    const inv = investments.find(i => i.id === investmentId);
    if (!inv || inv.status !== 'active') {
      return { success: false, message: 'Active investment not found.' };
    }

    // Settle 1 daily cycle earnings straight to dashboard balance
    const dailyEarn = Number(inv.dailyProfitAmount.toFixed(2)) > 0 ? Number(inv.dailyProfitAmount.toFixed(2)) : Number((inv.dailyProfitAmount * 1).toFixed(3));
    const finalAmount = Math.max(0.05, dailyEarn);

    const newBal = Number((currentUser.balance + finalAmount).toFixed(2));
    setCurrentUser({ ...currentUser, balance: newBal });

    setInvestments(prev => prev.map(i => {
      if (i.id === investmentId) {
        return {
          ...i,
          claimedEarnings: Number((i.claimedEarnings + finalAmount).toFixed(2)),
          lastAccrualTimestamp: Date.now()
        };
      }
      return i;
    }));

    const newTx: Transaction = {
      id: 'tx_settle_' + Date.now(),
      type: 'investment_yield',
      amount: finalAmount,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Daily Staking Payout - ${inv.cryptoSymbol} (+${finalAmount.toFixed(2)})`,
      reference: 'YLD-' + Math.floor(100000 + Math.random() * 900000),
      method: 'Daily Yield Cycle'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Delivered +$${finalAmount.toFixed(2)} daily yield to your dashboard balance!`,
      amountAdded: finalAmount
    };
  };

  const cancelOrRedeemInvestment = (investmentId: string) => {
    if (!currentUser) return { success: false, message: 'Please log in.' };
    const inv = investments.find(i => i.id === investmentId);
    if (!inv || inv.status !== 'active') {
      return { success: false, message: 'Active investment not found.' };
    }

    // Return principal + any unclaimed earnings
    const totalRefund = Number((inv.investedAmount + inv.accruedEarnings).toFixed(2));
    const newBal = Number((currentUser.balance + totalRefund).toFixed(2));
    setCurrentUser({ ...currentUser, balance: newBal });

    setInvestments(prev => prev.map(i => {
      if (i.id === investmentId) {
        return {
          ...i,
          status: 'completed' as const,
          accruedEarnings: 0,
          claimedEarnings: Number((i.claimedEarnings + i.accruedEarnings).toFixed(2))
        };
      }
      return i;
    }));

    const newTx: Transaction = {
      id: 'tx_red_' + Date.now(),
      type: 'investment_yield',
      amount: totalRefund,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Staking Principal Released: ${inv.planName} (+${totalRefund.toFixed(2)})`,
      reference: 'RED-' + Math.floor(100000 + Math.random() * 900000),
      method: 'Early Redemption / Release'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Redeemed investment. $${totalRefund.toFixed(2)} returned to your dashboard balance.`
    };
  };

  const currentAccountLevel = currentUser?.accountLevel || 1;
  const dailyRewardAmount = getDailyRewardForLevel(currentAccountLevel);
  const todayDateKey = new Date().toISOString().split('T')[0];
  const canClaimDailyGift = Boolean(currentUser && currentUser.lastDailyGiftClaimDate !== todayDateKey);

  const claimDailyGift = () => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to claim your daily reward.' };
    }

    const level = currentUser.accountLevel || 1;
    const giftAmount = getDailyRewardForLevel(level);
    const today = new Date().toISOString().split('T')[0];

    if (currentUser.lastDailyGiftClaimDate === today) {
      return {
        success: false,
        message: `You have already claimed today's $${giftAmount.toFixed(2)} reward! Upgrade your account level to increase your daily reward.`
      };
    }

    const newBal = Number((currentUser.balance + giftAmount).toFixed(2));
    const newTotal = (currentUser.totalClaimedGifts || 0) + 1;
    const updatedUser: User = {
      ...currentUser,
      balance: newBal,
      lastDailyGiftClaimDate: today,
      totalClaimedGifts: newTotal
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));

    // Update in local users database
    try {
      const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
      const idx = usersDb.findIndex((u: User) => u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (idx >= 0) {
        usersDb[idx] = { ...usersDb[idx], ...updatedUser };
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
      }
    } catch {}

    // Update in Firestore
    try {
      const uRef = doc(db, 'users', currentUser.id);
      updateDoc(uRef, {
        balance: newBal,
        lastDailyGiftClaimDate: today,
        totalClaimedGifts: newTotal
      }).catch(() => {});
    } catch {}

    // Add transaction log
    const giftTx: Transaction = {
      id: 'tx_daily_gift_' + Date.now(),
      type: 'deposit',
      amount: giftAmount,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Daily Reward (Level ${level}): $${giftAmount.toFixed(2)} Credited`,
      reference: 'DAY-' + Math.floor(100000 + Math.random() * 900000),
      method: `Level ${level} Daily Reward`
    };
    setTransactions(prev => [giftTx, ...prev]);

    return {
      success: true,
      message: `Congratulations! $${giftAmount.toFixed(2)} daily reward (Level ${level}) has been added to your balance.`,
      amountAdded: giftAmount
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        register,
        login,
        quickDemoLogin,
        logout,
        updateUserCountry,
        depositFunds,
        withdrawFunds,

        positions,
        closedPositions,
        transactions,
        openTrade,
        closeTrade,
        quickTrades,
        placeQuickTrade,
        hideBalance,
        toggleHideBalance,
        todayPnl,
        trc20WalletAddress,
        updateTrc20WalletAddress,
        cryptoAddresses,
        updateCryptoAddress,
        updateAllCryptoAddresses,
        depositRequests,
        hasPendingDeposit,
        userPendingDeposit,
        submitDepositRequest,
        approveDepositRequest,
        rejectDepositRequest,
        isFirebaseConnected,
        expiredTradeResult,
        clearExpiredTradeResult,
        adminWinRatePercent,
        updateAdminWinRatePercent,
        investments,
        createInvestment,
        claimInvestmentEarnings,
        settleDailyYield,
        cancelOrRedeemInvestment,
        staffAccount,
        updateStaffAccount,
        submitBankTransferDeposit,
        claimDailyGift,
        canClaimDailyGift,
        dailyRewardAmount,
        currentAccountLevel,
        upgradeTierPrices,
        updateUpgradeTierPrices
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
