import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  DollarSign, 
  Edit3, 
  Search, 
  X, 
  Check, 
  ShieldCheck, 
  Save,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Clock,
  XCircle,
  Copy,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  CreditCard,
  Building2,
  Eye,
  FileText,
  Bell,
  Send,
  Trash2,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { User, DepositRequest } from '../types';
import { formatCurrency } from '../data/marketData';
import { useAuth, LEGACY_DUMMY_CRYPTO_ADDRESSES, DEFAULT_UPGRADE_PRICES } from '../context/AuthContext';
import { usePriceAlerts } from '../context/PriceAlertContext';
import { useMarket } from '../context/MarketContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { CRYPTO_OPTIONS, CryptoOption } from './FundsWalletPage';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { 
    trc20WalletAddress, 
    updateTrc20WalletAddress, 
    cryptoAddresses,
    updateCryptoAddress,
    updateAllCryptoAddresses,
    depositRequests, 
    approveDepositRequest, 
    rejectDepositRequest,
    isFirebaseConnected,
    adminWinRatePercent,
    updateAdminWinRatePercent,
    staffAccount,
    updateStaffAccount,
    upgradeTierPrices,
    updateUpgradeTierPrices
  } = useAuth();

  const { assets } = useMarket();
  const {
    messages,
    adminPriceAlerts,
    adminAddPriceAlert,
    adminRemovePriceAlert,
    adminTriggerPriceAlertNow,
    adminSendBroadcastMessage,
    adminDeleteBroadcastMessage,
    adminClearAllMessages,
  } = usePriceAlerts();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Global Price Alert & Broadcast Form State
  const [notifMode, setNotifMode] = useState<'price_alert' | 'broadcast'>('price_alert');
  const [alertSymbol, setAlertSymbol] = useState<string>(assets[0]?.symbol || 'BTC/USD');
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>(assets[0]?.price?.toString() || '68500');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertNote, setAlertNote] = useState<string>('');
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastBody, setBroadcastBody] = useState<string>('');
  const [pushSuccessNotice, setPushSuccessNotice] = useState<string>('');

  const selectedAlertAsset = assets.find(a => a.symbol === alertSymbol) || assets[0];

  const handleSelectAlertAsset = (sym: string) => {
    setAlertSymbol(sym);
    const found = assets.find(a => a.symbol === sym);
    if (found) {
      setAlertTargetPrice(found.price.toString());
    }
  };

  const handleCreateAdminPriceAlert = (e: React.FormEvent, pushImmediately = false) => {
    e.preventDefault();
    const numPrice = parseFloat(alertTargetPrice);
    if (!numPrice || isNaN(numPrice) || numPrice <= 0 || !selectedAlertAsset) return;

    if (pushImmediately) {
      const dirText = alertCondition === 'above' ? 'broke above' : 'dropped below';
      adminSendBroadcastMessage({
        title: `Price Alert: ${selectedAlertAsset.symbol} Hit $${numPrice.toLocaleString()}`,
        message:
          alertNote.trim() ||
          `${selectedAlertAsset.name} (${selectedAlertAsset.symbol}) ${dirText} target price $${numPrice.toLocaleString()}.`,
        type: 'price_alert',
        symbol: selectedAlertAsset.symbol,
        assetName: selectedAlertAsset.name,
        targetPrice: numPrice,
        condition: alertCondition,
      });
      setPushSuccessNotice(`Instant price alert for ${selectedAlertAsset.symbol} ($${numPrice.toLocaleString()}) pushed to all users' devices!`);
    } else {
      adminAddPriceAlert({
        symbol: selectedAlertAsset.symbol,
        assetName: selectedAlertAsset.name,
        targetPrice: numPrice,
        condition: alertCondition,
        note: alertNote.trim(),
      });
      setPushSuccessNotice(`Global price alert set for ${selectedAlertAsset.symbol} at $${numPrice.toLocaleString()}. All users will be notified automatically when hit!`);
    }

    setAlertNote('');
    setTimeout(() => setPushSuccessNotice(''), 4000);
  };

  const handleSendAdminBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

    adminSendBroadcastMessage({
      title: broadcastTitle.trim(),
      message: broadcastBody.trim(),
      type: 'message',
    });

    setPushSuccessNotice('Broadcast message sent! All users have been notified on their devices.');
    setBroadcastTitle('');
    setBroadcastBody('');
    setTimeout(() => setPushSuccessNotice(''), 4000);
  };

  // Staff Management Account Form State
  const [staffBankName, setStaffBankName] = useState<string>(staffAccount?.isConfigured ? staffAccount.bankName : '');
  const [staffAccountNumber, setStaffAccountNumber] = useState<string>(staffAccount?.isConfigured ? staffAccount.accountNumber : '');
  const [staffAccountName, setStaffAccountName] = useState<string>(staffAccount?.isConfigured ? staffAccount.accountName : '');
  const [staffExchangeRate, setStaffExchangeRate] = useState<number>(staffAccount?.exchangeRateNgn || 1550);
  const [staffInstructions, setStaffInstructions] = useState<string>(staffAccount?.paymentInstructions || '');
  const [staffSavedNotice, setStaffSavedNotice] = useState<boolean>(false);
  const [selectedReceiptReq, setSelectedReceiptReq] = useState<DepositRequest | null>(null);

  useEffect(() => {
    if (staffAccount && staffAccount.isConfigured) {
      setStaffBankName(staffAccount.bankName || '');
      setStaffAccountNumber(staffAccount.accountNumber || '');
      setStaffAccountName(staffAccount.accountName || '');
      setStaffExchangeRate(staffAccount.exchangeRateNgn || 1550);
      setStaffInstructions(staffAccount.paymentInstructions || '');
    }
  }, [staffAccount]);

  const handleSaveStaffAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffBankName.trim() || !staffAccountNumber.trim() || !staffAccountName.trim()) {
      return;
    }
    updateStaffAccount({
      bankName: staffBankName.trim(),
      accountNumber: staffAccountNumber.trim(),
      accountName: staffAccountName.trim(),
      exchangeRateNgn: Number(staffExchangeRate) || 1550,
      paymentInstructions: staffInstructions.trim(),
      isConfigured: true
    });
    setStaffSavedNotice(true);
    setTimeout(() => setStaffSavedNotice(false), 3500);
  };

  const handleClearStaffAccount = () => {
    setStaffBankName('');
    setStaffAccountNumber('');
    setStaffAccountName('');
    setStaffInstructions('');
    updateStaffAccount({
      bankName: '',
      accountNumber: '',
      accountName: '',
      exchangeRateNgn: Number(staffExchangeRate) || 1550,
      paymentInstructions: '',
      isConfigured: false
    });
    setStaffSavedNotice(true);
    setTimeout(() => setStaffSavedNotice(false), 3500);
  };

  // Account Upgrade Plan Prices State (Admin Editable)
  const [priceLevel2, setPriceLevel2] = useState<number>(upgradeTierPrices[2] || DEFAULT_UPGRADE_PRICES[2]);
  const [priceLevel3, setPriceLevel3] = useState<number>(upgradeTierPrices[3] || DEFAULT_UPGRADE_PRICES[3]);
  const [priceLevel4, setPriceLevel4] = useState<number>(upgradeTierPrices[4] || DEFAULT_UPGRADE_PRICES[4]);
  const [priceLevel5, setPriceLevel5] = useState<number>(upgradeTierPrices[5] || DEFAULT_UPGRADE_PRICES[5]);
  const [upgradePricesSavedNotice, setUpgradePricesSavedNotice] = useState<string>('');

  useEffect(() => {
    if (upgradeTierPrices) {
      setPriceLevel2(upgradeTierPrices[2] || DEFAULT_UPGRADE_PRICES[2]);
      setPriceLevel3(upgradeTierPrices[3] || DEFAULT_UPGRADE_PRICES[3]);
      setPriceLevel4(upgradeTierPrices[4] || DEFAULT_UPGRADE_PRICES[4]);
      setPriceLevel5(upgradeTierPrices[5] || DEFAULT_UPGRADE_PRICES[5]);
    }
  }, [upgradeTierPrices]);

  const handleSaveUpgradePrices = (e: React.FormEvent) => {
    e.preventDefault();
    updateUpgradeTierPrices({
      2: Number(priceLevel2) || DEFAULT_UPGRADE_PRICES[2],
      3: Number(priceLevel3) || DEFAULT_UPGRADE_PRICES[3],
      4: Number(priceLevel4) || DEFAULT_UPGRADE_PRICES[4],
      5: Number(priceLevel5) || DEFAULT_UPGRADE_PRICES[5]
    });
    setUpgradePricesSavedNotice('Account upgrade prices updated! All users now see the new Naira upgrade plan prices.');
    setTimeout(() => setUpgradePricesSavedNotice(''), 4000);
  };

  const handleResetUpgradePrices = () => {
    setPriceLevel2(DEFAULT_UPGRADE_PRICES[2]);
    setPriceLevel3(DEFAULT_UPGRADE_PRICES[3]);
    setPriceLevel4(DEFAULT_UPGRADE_PRICES[4]);
    setPriceLevel5(DEFAULT_UPGRADE_PRICES[5]);
    updateUpgradeTierPrices(DEFAULT_UPGRADE_PRICES);
    setUpgradePricesSavedNotice('Upgrade prices reset to default values (₦17,350 / ₦28,000 / ₦42,500 / ₦89,000).');
    setTimeout(() => setUpgradePricesSavedNotice(''), 4000);
  };
  
  // Win Rate Slider Local State
  const [winRateSlider, setWinRateSlider] = useState<number>(adminWinRatePercent ?? 50);
  const [winRateSavedNotice, setWinRateSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    setWinRateSlider(adminWinRatePercent ?? 50);
  }, [adminWinRatePercent]);
  
  // Wallet Address State per Cryptocurrency
  const [addressInputs, setAddressInputs] = useState<Record<string, string>>({});
  const [walletSavedNotice, setWalletSavedNotice] = useState<boolean>(false);
  const [walletSavedMessage, setWalletSavedMessage] = useState<string>('');

  // Load baseline users
  const loadUsersFromLocal = () => {
    try {
      const savedDb = localStorage.getItem('iq_plus_registered_users');
      const parsed: User[] = savedDb ? JSON.parse(savedDb) : [];
      setUsers(parsed);
    } catch {
      setUsers([]);
    }
  };

  // Sync inputs with AuthContext addresses (never fall back to dummy default addresses)
  useEffect(() => {
    const merged: Record<string, string> = {};
    CRYPTO_OPTIONS.forEach(c => {
      const raw = (cryptoAddresses && cryptoAddresses[c.id])
        ? cryptoAddresses[c.id].trim()
        : ((c.id === 'usdt-trc20' || c.id === 'trx') && trc20WalletAddress ? trc20WalletAddress.trim() : '');
      merged[c.id] = raw && !LEGACY_DUMMY_CRYPTO_ADDRESSES.has(raw) ? raw : '';
    });
    setAddressInputs(merged);
  }, [cryptoAddresses, trc20WalletAddress]);

  // Real-time Firestore Users Listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const usersRef = collection(db, 'users');
      unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const fsUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as User;
          if (data && data.email) {
            fsUsers.push(data);
          }
        });

        if (fsUsers.length > 0) {
          const savedDbStr = localStorage.getItem('iq_plus_registered_users');
          const localUsers: User[] = savedDbStr ? JSON.parse(savedDbStr) : [];
          const combinedMap = new Map<string, User>();
          localUsers.forEach(u => combinedMap.set(u.email.toLowerCase(), u));
          fsUsers.forEach(u => combinedMap.set(u.email.toLowerCase(), u));
          const merged = Array.from(combinedMap.values());
          setUsers(merged);
          localStorage.setItem('iq_plus_registered_users', JSON.stringify(merged));
        } else {
          loadUsersFromLocal();
        }
      }, (err) => {
        console.warn("Firestore users sync info:", err.message);
        loadUsersFromLocal();
      });
    } catch (e) {
      loadUsersFromLocal();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSaveWinRate = (newRate: number) => {
    updateAdminWinRatePercent(newRate);
    setWinRateSlider(newRate);
    setWinRateSavedNotice(true);
    setTimeout(() => setWinRateSavedNotice(false), 3000);
  };

  const handleEditBalanceClick = (user: User) => {
    setSelectedUser(user);
    setNewBalanceInput(user.balance.toString());
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const parsedNum = parseFloat(newBalanceInput);
    if (isNaN(parsedNum) || parsedNum < 0) {
      setNotice({ type: 'error', text: 'Please enter a valid balance amount.' });
      return;
    }

    try {
      const newBal = Number(parsedNum.toFixed(2));

      // Local storage update
      const savedDbStr = localStorage.getItem('iq_plus_registered_users');
      const dbUsers: User[] = savedDbStr ? JSON.parse(savedDbStr) : [];
      const userIndex = dbUsers.findIndex(u => u.email.toLowerCase() === selectedUser.email.toLowerCase());

      if (userIndex >= 0) {
        dbUsers[userIndex].balance = newBal;
        localStorage.setItem('iq_plus_registered_users', JSON.stringify(dbUsers));
      }

      // If active session matches
      const activeUserStr = localStorage.getItem('iq_plus_active_user');
      if (activeUserStr) {
        const activeUser: User = JSON.parse(activeUserStr);
        if (activeUser.email.toLowerCase() === selectedUser.email.toLowerCase()) {
          activeUser.balance = newBal;
          localStorage.setItem('iq_plus_active_user', JSON.stringify(activeUser));
        }
      }

      // Firestore update
      try {
        const targetDocId = selectedUser.id || selectedUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const userRef = doc(db, 'users', targetDocId);
        await setDoc(userRef, { balance: newBal }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore balance update note:", fsErr);
      }

      setUsers(prev => prev.map(u => u.email.toLowerCase() === selectedUser.email.toLowerCase() ? { ...u, balance: newBal } : u));

      setNotice({ 
        type: 'success', 
        text: `Balance for ${selectedUser.name} updated to $${newBal.toFixed(2)}!` 
      });
      setSelectedUser(null);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      console.error(e);
      setNotice({ type: 'error', text: 'Failed to update balance.' });
    }
  };

  const handleToggleKyc = async (user: User) => {
    try {
      const newKyc = !user.isKycVerified;

      const savedDbStr = localStorage.getItem('iq_plus_registered_users');
      const dbUsers: User[] = savedDbStr ? JSON.parse(savedDbStr) : [];
      const idx = dbUsers.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());

      if (idx >= 0) {
        dbUsers[idx].isKycVerified = newKyc;
        localStorage.setItem('iq_plus_registered_users', JSON.stringify(dbUsers));
      }

      try {
        const targetDocId = user.id || user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const userRef = doc(db, 'users', targetDocId);
        await setDoc(userRef, { isKycVerified: newKyc }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore KYC update note:", fsErr);
      }

      setUsers(prev => prev.map(u => u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, isKycVerified: newKyc } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSingleAddress = (cryptoId: string) => {
    const val = (addressInputs[cryptoId] || '').trim();
    const crypto = CRYPTO_OPTIONS.find(c => c.id === cryptoId);
    updateCryptoAddress(cryptoId, val);
    setWalletSavedMessage(
      val
        ? `${crypto?.name || cryptoId} deposit address saved! Users will now see this address.`
        : `${crypto?.name || cryptoId} deposit address cleared. Nothing will be shown until you set a new address.`
    );
    setWalletSavedNotice(true);
    setTimeout(() => setWalletSavedNotice(false), 3500);
  };

  const handleSaveAllAddresses = () => {
    updateAllCryptoAddresses(addressInputs);
    setWalletSavedMessage('All payment method deposit addresses updated successfully!');
    setWalletSavedNotice(true);
    setTimeout(() => setWalletSavedNotice(false), 3500);
  };

  const handleApproveDeposit = (reqId: string) => {
    const res = approveDepositRequest(reqId);
    if (res.success) {
      setNotice({ type: 'success', text: res.message });
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleRejectDeposit = (reqId: string) => {
    const res = rejectDepositRequest(reqId);
    if (res.success) {
      setNotice({ type: 'error', text: res.message });
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const isSearching = search.trim().length > 0;
  const filteredUsers = isSearching 
    ? users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.accountNumber && u.accountNumber.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const pendingRequests = depositRequests.filter(r => r.status === 'pending_review');
  const totalPlatformCapital = users.reduce((acc, u) => acc + (u.balance || 0), 0);

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-tight">Admin Dashboard</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                AUTHENTICATED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Platform Management & Payment Addresses</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
        >
          Exit Admin
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-5">
        {/* Notice alert */}
        {notice && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#121824] border border-slate-800 rounded-2xl">
            <span className="text-slate-400 text-xs block">Global Users</span>
            <span className="font-mono font-bold text-xl text-white mt-1 block">{users.length}</span>
          </div>
          <div className="p-3.5 bg-[#121824] border border-slate-800 rounded-2xl">
            <span className="text-slate-400 text-xs block">Platform Capital</span>
            <span className="font-mono font-bold text-xl text-amber-400 mt-1 block">
              {formatCurrency(totalPlatformCapital)}
            </span>
          </div>
          <div className="p-3.5 bg-[#121824] border border-slate-800 rounded-2xl">
            <span className="text-slate-400 text-xs block">Pending Review</span>
            <span className={`font-mono font-bold text-xl mt-1 block ${pendingRequests.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {pendingRequests.length}
            </span>
          </div>
        </div>

        {/* Admin Section: Global Win / Loss Probability Control */}
        <div className="p-4 bg-gradient-to-r from-[#141C2A] via-[#121824] to-[#141C2A] border border-amber-400/40 rounded-2xl space-y-3 shadow-lg shadow-black/40 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Trading Win / Loss Outcome Control
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  EXECUTION ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Set the percentage chance for user trades to win or lose across all markets. When set to <strong className="text-emerald-400">100%</strong>, all trades win. When set to <strong className="text-rose-400">0%</strong>, all trades lose.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block font-medium">Target Win Rate</span>
              <span className="text-2xl font-black font-mono text-amber-400">
                {winRateSlider}%
              </span>
            </div>
          </div>

          {winRateSavedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Win rate percentage updated to {winRateSlider}%! All future expiring trades will use this setting.</span>
            </div>
          )}

          {/* Interactive Range Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-400 font-mono">0% (100% Loss)</span>
              <span className="text-amber-300 font-mono">50% (Balanced)</span>
              <span className="text-emerald-400 font-mono">100% (100% Win)</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={winRateSlider}
              onChange={(e) => setWinRateSlider(Number(e.target.value))}
              onMouseUp={() => handleSaveWinRate(winRateSlider)}
              onTouchEnd={() => handleSaveWinRate(winRateSlider)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Quick Win Rate Presets */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {[
              { label: '0% Loss', rate: 0, color: 'hover:bg-rose-500/20 text-rose-400 border-rose-500/30' },
              { label: '25% Low', rate: 25, color: 'hover:bg-orange-500/20 text-orange-400 border-orange-500/30' },
              { label: '50% Even', rate: 50, color: 'hover:bg-amber-500/20 text-amber-300 border-amber-500/30' },
              { label: '75% High', rate: 75, color: 'hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              { label: '100% Win', rate: 100, color: 'hover:bg-emerald-400 text-slate-950 font-black border-emerald-400' }
            ].map(preset => (
              <button
                key={preset.rate}
                type="button"
                onClick={() => handleSaveWinRate(preset.rate)}
                className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold font-mono transition-all cursor-pointer ${
                  winRateSlider === preset.rate 
                    ? 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-400/20 scale-102' 
                    : `bg-slate-900/80 ${preset.color}`
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Admin Section: Global Push Notifications & Price Point Alerts */}
        <div className="p-4 bg-[#121824] border border-amber-400/40 rounded-2xl space-y-4 shadow-lg shadow-black/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Global Push Notifications & Price Point Alerts
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  ADMIN ONLY · INSTANT DEVICE PUSH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Only Admin can set price point alerts or send messages. All users are notified instantly on their devices even when outside the app.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0B0F17] p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setNotifMode('price_alert')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  notifMode === 'price_alert'
                    ? 'bg-[#F5BA31] text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Price Point Alert
              </button>
              <button
                type="button"
                onClick={() => setNotifMode('broadcast')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  notifMode === 'broadcast'
                    ? 'bg-[#F5BA31] text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Send Message ({messages.length})
              </button>
            </div>
          </div>

          {pushSuccessNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pushSuccessNotice}</span>
            </div>
          )}

          {notifMode === 'price_alert' ? (
            <div className="space-y-4">
              <form onSubmit={(e) => handleCreateAdminPriceAlert(e, false)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Asset Selection */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Market Asset</label>
                    <select
                      value={alertSymbol}
                      onChange={(e) => handleSelectAlertAsset(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {assets.map(a => (
                        <option key={a.symbol} value={a.symbol}>
                          {a.symbol} — {a.name} (${a.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Price */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Price (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={alertTargetPrice}
                        onChange={(e) => setAlertTargetPrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                        placeholder="Enter target price"
                      />
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Condition</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAlertCondition('above')}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          alertCondition === 'above'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-[#0B0F17] border-slate-800 text-slate-400'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Above</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlertCondition('below')}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          alertCondition === 'below'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-[#0B0F17] border-slate-800 text-slate-400'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Below</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Alert Message Note */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alert Message Shown to Users (Optional)
                  </label>
                  <input
                    type="text"
                    value={alertNote}
                    onChange={(e) => setAlertNote(e.target.value)}
                    placeholder="e.g. Strong breakout above key resistance — High probability BUY setup active now!"
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="py-2 px-4 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Automatic Price Alert</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCreateAdminPriceAlert(e, true)}
                    className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Push Price Alert to All Devices Now</span>
                  </button>
                </div>
              </form>

              {/* Active Admin Price Point Alerts List */}
              {adminPriceAlerts.filter(a => !a.triggered).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Global Price Triggers ({adminPriceAlerts.filter(a => !a.triggered).length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {adminPriceAlerts.filter(a => !a.triggered).map(alert => (
                      <div
                        key={alert.id}
                        className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{alert.symbol}</span>
                            <span className="font-mono font-bold text-amber-400">
                              ${alert.targetPrice.toLocaleString()}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              alert.condition === 'above' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {alert.condition.toUpperCase()}
                            </span>
                          </div>
                          {alert.note && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{alert.note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              adminTriggerPriceAlertNow(alert.id);
                              setPushSuccessNotice(`Triggered ${alert.symbol} alert to all users' devices!`);
                              setTimeout(() => setPushSuccessNotice(''), 3500);
                            }}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Push Now</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => adminRemovePriceAlert(alert.id)}
                            className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg cursor-pointer"
                            title="Remove alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSendAdminBroadcast} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Notification Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Official Trading Signal: BTC/USD Breakout"
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Message Content <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Enter the message that will pop up on all users' devices and appear in their notification inbox..."
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Message to All Devices Now</span>
                </button>
              </form>

              {/* Sent Broadcast Messages History */}
              {messages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Sent Messages in User Inbox ({messages.length})
                    </span>
                    <button
                      type="button"
                      onClick={adminClearAllMessages}
                      className="text-[11px] text-rose-400 hover:underline font-semibold cursor-pointer"
                    >
                      Clear All Messages
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className="p-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{msg.title}</span>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.message}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => adminDeleteBroadcastMessage(msg.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Section: Company Staff Management Account (Nigeria Deposits) */}
        <div className="p-4 bg-[#121824] border border-emerald-500/30 rounded-2xl space-y-4 shadow-lg shadow-black/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Company Staff Management Account (Nigeria Deposits)
                </h3>
                {staffAccount?.isConfigured && staffAccount.bankName ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    🟢 ACTIVE ({staffAccount.bankName})
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    🟡 NOT SET (HIDDEN FROM USERS)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {staffAccount?.isConfigured && staffAccount.bankName 
                  ? `Currently active: ${staffAccount.bankName} - ${staffAccount.accountNumber} (${staffAccount.accountName}).`
                  : 'No account details are set. Nothing will be shown on the Naira deposit method until you configure and save below.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {staffAccount?.isConfigured && (
                <button
                  type="button"
                  onClick={handleClearStaffAccount}
                  className="py-1.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  title="Remove payment details so nothing is shown to users"
                >
                  Clear Account
                </button>
              )}
              <button
                type="submit"
                form="staff-account-form"
                className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Staff Account</span>
              </button>
            </div>
          </div>

          {staffSavedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{staffAccount?.isConfigured ? 'Company Staff Management Account updated! Nigerian users will now see these exact payment details.' : 'Naira bank account details cleared. Nothing will be shown to users until new details are set.'}</span>
            </div>
          )}

          <form id="staff-account-form" onSubmit={handleSaveStaffAccount} className="space-y-3">
            {/* Quick Bank Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">Quick Select Bank Provider</label>
              <div className="flex flex-wrap gap-1.5">
                {['Moniepoint Microfinance Bank', 'OPay', 'PalmPay', 'Kuda Microfinance Bank', 'Guaranty Trust Bank (GTBank)', 'Zenith Bank', 'Access Bank', 'First Bank of Nigeria'].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setStaffBankName(b)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors border cursor-pointer ${
                      staffBankName === b
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0B0F17] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {b.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bank Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffBankName}
                  onChange={(e) => setStaffBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                  placeholder="e.g. OPay, Moniepoint, PalmPay, GTBank"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Number (NUBAN) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffAccountNumber}
                  onChange={(e) => setStaffAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                  placeholder="e.g. 7012345678"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Beneficiary Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffAccountName}
                  onChange={(e) => setStaffAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                  placeholder="e.g. COMPANY TREASURY / STAFF NAME"
                />
              </div>

              {/* Exchange Rate NGN per USD */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Exchange Rate (₦ NGN per 1 USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₦</span>
                  <input
                    type="number"
                    min="100"
                    step="1"
                    required
                    value={staffExchangeRate}
                    onChange={(e) => setStaffExchangeRate(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                    placeholder="1550"
                  />
                </div>
              </div>
            </div>

            {/* Payment Instructions / Narration note */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Deposit Instructions & Narration Note (Shown to Users)
              </label>
              <textarea
                rows={2}
                value={staffInstructions}
                onChange={(e) => setStaffInstructions(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 resize-none"
                placeholder="Instructions displayed to users on the bank transfer screen..."
              />
            </div>
          </form>
        </div>

        {/* Admin Section: Account Upgrade Plan Prices (NGN) */}
        <div className="p-4 bg-[#121824] border border-amber-400/35 rounded-2xl space-y-4 shadow-lg shadow-black/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Account Upgrade Plan Prices (NGN)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Change the Naira upgrading price for Level 2, Level 3, Level 4, and Level 5 plans shown to users on the Upgrade page.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleResetUpgradePrices}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                form="upgrade-prices-form"
                className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-400/20"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Upgrade Prices</span>
              </button>
            </div>
          </div>

          {upgradePricesSavedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{upgradePricesSavedNotice}</span>
            </div>
          )}

          <form id="upgrade-prices-form" onSubmit={handleSaveUpgradePrices} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Level 2 Plan</label>
                <span className="text-[10px] font-mono text-amber-400">$5/day reward</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₦</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={priceLevel2}
                  onChange={(e) => setPriceLevel2(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-[#121824] border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Level 3 Plan</label>
                <span className="text-[10px] font-mono text-amber-400">$10/day reward</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₦</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={priceLevel3}
                  onChange={(e) => setPriceLevel3(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-[#121824] border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Level 4 Plan</label>
                <span className="text-[10px] font-mono text-amber-400">$20/day reward</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₦</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={priceLevel4}
                  onChange={(e) => setPriceLevel4(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-[#121824] border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Level 5 Plan</label>
                <span className="text-[10px] font-mono text-amber-400">$50/day reward</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₦</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={priceLevel5}
                  onChange={(e) => setPriceLevel5(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-[#121824] border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Admin Section 1: Payment Method Wallet Addresses Management */}
        <div className="p-4 bg-[#121824] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                Payment Method Deposit Addresses ({CRYPTO_OPTIONS.length})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Change the deposit wallet address presented to users for each supported cryptocurrency.
              </p>
            </div>

            <button
              onClick={handleSaveAllAddresses}
              className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-md shadow-amber-400/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All Addresses</span>
            </button>
          </div>

          {walletSavedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{walletSavedMessage || 'Wallet addresses updated! User deposit pages will now display these addresses.'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CRYPTO_OPTIONS.map(crypto => {
              const currentVal = addressInputs[crypto.id] || '';
              const savedVal = (cryptoAddresses && cryptoAddresses[crypto.id]) ? cryptoAddresses[crypto.id].trim() : '';
              const isConfigured = Boolean(savedVal && !LEGACY_DUMMY_CRYPTO_ADDRESSES.has(savedVal));
              return (
                <div key={crypto.id} className="p-3 bg-[#0B0F17] border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0"
                        style={{ backgroundColor: crypto.color }}
                      >
                        {crypto.iconSymbol}
                      </div>
                      <span className="text-xs font-bold text-white">{crypto.name}</span>
                      <span className={`text-[9px] ${crypto.badgeBg} ${crypto.badgeText} px-1.5 py-0.2 rounded font-mono font-bold`}>
                        {crypto.networkCode}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${isConfigured ? 'text-emerald-400' : 'text-amber-400/80'}`}>
                      {isConfigured ? 'ACTIVE' : 'NOT SET'}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => setAddressInputs(prev => ({ ...prev, [crypto.id]: e.target.value }))}
                      className="flex-1 px-2.5 py-1.5 bg-[#121824] border border-slate-800 rounded-lg text-[11px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/70"
                      placeholder={`Not set — enter ${crypto.symbol} (${crypto.networkCode}) address...`}
                    />
                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressInputs(prev => ({ ...prev, [crypto.id]: '' }));
                          updateCryptoAddress(crypto.id, '');
                          setWalletSavedMessage(`${crypto.name} deposit address cleared.`);
                          setWalletSavedNotice(true);
                          setTimeout(() => setWalletSavedNotice(false), 3500);
                        }}
                        className="py-1.5 px-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 border border-rose-500/30"
                        title="Clear address"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveSingleAddress(crypto.id)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0 border border-slate-700"
                    >
                      <Save className="w-3 h-3 text-amber-400" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Section 2: Pending User Deposit Reviews */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Deposits Review Queue ({pendingRequests.length})
            </h3>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-4 text-center bg-[#121824] border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No pending deposit requests awaiting review.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {pendingRequests.map(req => {
                const isBank = req.depositType === 'bank_transfer';
                return (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-2xl bg-[#121824] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isBank ? 'border-emerald-500/40 bg-gradient-to-r from-[#121c27] to-[#121824]' : 'border-amber-400/30'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.userName}</span>
                        {isBank ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                            <span>🇳🇬 Bank Transfer</span>
                            <span>•</span>
                            <span className="text-white">${req.amount.toFixed(2)} USD</span>
                            {req.ngnAmount && (
                              <span className="text-amber-300">(₦{req.ngnAmount.toLocaleString()} NGN)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            ${req.amount.toFixed(2)} USD ({req.network})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        <span>{req.userEmail}</span>
                        {req.userPhone && (
                          <span className="font-mono text-slate-300">📞 {req.userPhone}</span>
                        )}
                        <span className="text-[10px] text-slate-500">{new Date(req.timestamp).toLocaleTimeString()}</span>
                      </div>

                      {isBank && (
                        <div className="text-[11px] text-slate-300 space-y-0.5 pt-0.5">
                          <p>
                            <span className="text-slate-400">Staff Account:</span>{' '}
                            <strong className="text-amber-400">{req.staffAccountDetails?.bankName || 'Staff Bank'}</strong>{' '}
                            <span className="font-mono text-slate-400">({req.staffAccountDetails?.accountNumber || ''})</span>
                          </p>
                          <p className="font-mono text-slate-400 text-[10px]">
                            Sender: <span className="text-slate-200">{req.senderName || req.userName}</span> ({req.senderBank || 'Local Bank'}) • Ref: <span className="text-amber-300">{req.txHash}</span>
                          </p>
                        </div>
                      )}

                      {!isBank && (
                        <p className="text-[10px] font-mono text-slate-500 truncate">TxHash: {req.txHash}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* View Receipt Proof button if available */}
                      {req.proofImageUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptReq(req)}
                          className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Payment Proof Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRejectDeposit(req.id)}
                        className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApproveDeposit(req.id)}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve & Credit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Section 3: Registered Accounts Management - Search On Demand */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Find & Manage User Account
              </h3>
              <p className="text-[11px] text-slate-400">Total {users.length} registered users globally</p>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email or account ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#121824] border border-slate-800 focus:border-amber-400/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {isSearching && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800/50 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!isSearching ? (
            <div className="p-6 text-center bg-[#121824] border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">User Search Ready</h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                There are <span className="font-bold text-amber-400 font-mono">{users.length}</span> registered users globally. Type a name, email address, or account ID into the search bar above to view and manage an individual user.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center bg-[#121824] border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No registered user found matching "<span className="text-white font-semibold">{search}</span>".
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="p-3.5 rounded-2xl bg-[#121824] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{user.name}</span>
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        {user.accountNumber || 'IQ-881230'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Balance</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {formatCurrency(user.balance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBalanceClick(user)}
                        className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Balance</span>
                      </button>

                      <button
                        onClick={() => handleToggleKyc(user)}
                        className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          user.isKycVerified
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                        title="Toggle KYC"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit User Balance Modal Popup */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#121824] border border-amber-400/50 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-amber-400">Edit User Balance</h4>
                  <p className="text-xs text-slate-300 font-semibold">{selectedUser.name}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBalance} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    New Balance Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={newBalanceInput}
                      onChange={(e) => setNewBalanceInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[0, 100, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewBalanceInput(amt.toString())}
                      className="py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Balance</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Proof Receipt Review Modal */}
        {selectedReceiptReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#121824] border border-amber-400/50 w-full max-w-md rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Payment Receipt Inspection</h4>
                    <p className="text-[11px] text-slate-400">{selectedReceiptReq.userName} • {selectedReceiptReq.userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceiptReq(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Deposit Meta Box */}
              <div className="p-3 bg-[#0B0F17] rounded-2xl border border-slate-800 space-y-1.5 text-xs shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Credited Amount</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${selectedReceiptReq.amount.toFixed(2)} USD
                    {selectedReceiptReq.ngnAmount && (
                      <span className="text-amber-300 ml-1.5 font-normal">(₦{selectedReceiptReq.ngnAmount.toLocaleString()} NGN)</span>
                    )}
                  </span>
                </div>
                {selectedReceiptReq.userPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">User Phone</span>
                    <span className="font-mono text-slate-200">{selectedReceiptReq.userPhone}</span>
                  </div>
                )}
                {selectedReceiptReq.staffAccountDetails && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target Staff Account</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[220px]">
                      {selectedReceiptReq.staffAccountDetails.bankName} ({selectedReceiptReq.staffAccountDetails.accountNumber})
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reference / Session</span>
                  <span className="font-mono text-amber-400">{selectedReceiptReq.txHash}</span>
                </div>
              </div>

              {/* Uploaded Receipt Image Preview */}
              <div className="flex-1 overflow-auto rounded-2xl bg-black/60 border border-slate-800/80 p-2 min-h-[220px] flex items-center justify-center">
                {selectedReceiptReq.proofImageUrl ? (
                  <img
                    src={selectedReceiptReq.proofImageUrl}
                    alt="Payment Receipt Proof"
                    className="max-w-full max-h-[45vh] object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-500 text-xs">
                    No receipt image attached.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleRejectDeposit(selectedReceiptReq.id);
                    setSelectedReceiptReq(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reject Deposit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApproveDeposit(selectedReceiptReq.id);
                    setSelectedReceiptReq(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Approve & Credit ${selectedReceiptReq.amount.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
