import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpToLine, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Wallet, 
  Globe, 
  Search, 
  Check, 
  ChevronDown,
  Sparkles,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../data/marketData';
import { 
  NIGERIAN_BANKS, 
  NigerianBank, 
  USD_TO_NGN_EXCHANGE_RATE, 
  CRYPTO_WITHDRAWAL_OPTIONS 
} from '../../data/countries';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onOpenDeposit }) => {
  const { currentUser, withdrawFunds } = useAuth();
  
  // Withdrawal Route: 'nigeria_bank' | 'crypto' | 'intl_bank'
  const isNigerianUser = currentUser?.countryCode === 'NG' || currentUser?.country === 'Nigeria';
  const [route, setRoute] = useState<'nigeria_bank' | 'crypto' | 'intl_bank'>(
    isNigerianUser ? 'nigeria_bank' : 'crypto'
  );

  // Sync route if user country is Nigeria
  useEffect(() => {
    if (isNigerianUser) {
      setRoute('nigeria_bank');
    }
  }, [isNigerianUser, isOpen]);

  // Common amount state
  const [amount, setAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nigerian Bank states
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(NIGERIAN_BANKS[0]); // Default to OPay
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(currentUser?.name || '');
  const [isAccountVerified, setIsAccountVerified] = useState(false);

  // Crypto states
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_WITHDRAWAL_OPTIONS[0]); // USDT TRC-20
  const [cryptoAddress, setCryptoAddress] = useState('');

  // International Bank states
  const [intlIban, setIntlIban] = useState('');
  const [intlBankName, setIntlBankName] = useState('');
  const [intlSwift, setIntlSwift] = useState('');

  // Auto-verify account name when 10 digits are entered
  useEffect(() => {
    if (accountNumber.replace(/\D/g, '').length === 10) {
      setIsAccountVerified(true);
      if (!accountName && currentUser?.name) {
        setAccountName(currentUser.name);
      }
    } else {
      setIsAccountVerified(false);
    }
  }, [accountNumber, accountName, currentUser]);

  if (!isOpen) return null;

  const currentBalance = currentUser?.balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const estimatedNgn = Math.round(numAmount * USD_TO_NGN_EXCHANGE_RATE);

  const handlePercentage = (percent: number) => {
    const val = (currentBalance * percent).toFixed(2);
    setAmount(val);
  };

  const filteredBanks = NIGERIAN_BANKS.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.code.includes(bankSearch)
  );

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid withdrawal amount.' });
      return;
    }

    if (numAmount > currentBalance) {
      setStatusMessage({ 
        type: 'error', 
        text: `Withdrawal exceeds available balance (${formatCurrency(currentBalance)}).` 
      });
      return;
    }

    // Validate based on route
    if (route === 'nigeria_bank') {
      const cleanAcc = accountNumber.replace(/\D/g, '');
      if (cleanAcc.length !== 10) {
        setStatusMessage({ type: 'error', text: 'Please enter a valid 10-digit Nigerian NUBAN account number.' });
        return;
      }
      if (!accountName.trim()) {
        setStatusMessage({ type: 'error', text: 'Please verify the recipient account name.' });
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const res = withdrawFunds(
          numAmount,
          `${selectedBank.name} (NGN)`,
          cleanAcc,
          {
            type: 'nigerian_bank',
            bankName: selectedBank.name,
            accountNumber: cleanAcc,
            accountName: accountName.trim(),
            ngnAmount: estimatedNgn,
            exchangeRate: USD_TO_NGN_EXCHANGE_RATE
          }
        );

        setIsSubmitting(false);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setTimeout(() => {
            onClose();
            setStatusMessage(null);
            setAmount('');
            setAccountNumber('');
          }, 2000);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }, 500);

    } else if (route === 'crypto') {
      if (!cryptoAddress.trim() || cryptoAddress.trim().length < 16) {
        setStatusMessage({ type: 'error', text: `Please enter a valid ${selectedCrypto.name} wallet address.` });
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const res = withdrawFunds(
          numAmount,
          selectedCrypto.name,
          cryptoAddress.trim(),
          {
            type: 'crypto',
            cryptoNetwork: selectedCrypto.network,
            walletAddress: cryptoAddress.trim()
          }
        );

        setIsSubmitting(false);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setTimeout(() => {
            onClose();
            setStatusMessage(null);
            setAmount('');
            setCryptoAddress('');
          }, 2000);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }, 500);

    } else {
      // International Bank
      if (!intlIban.trim() || !intlBankName.trim()) {
        setStatusMessage({ type: 'error', text: 'Please enter your bank name and IBAN / account number.' });
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const res = withdrawFunds(
          numAmount,
          `Bank Wire (${intlBankName.trim()})`,
          intlIban.trim(),
          {
            type: 'international_bank',
            bankName: intlBankName.trim(),
            accountNumber: intlIban.trim()
          }
        );

        setIsSubmitting(false);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setTimeout(() => {
            onClose();
            setStatusMessage(null);
            setAmount('');
            setIntlIban('');
          }, 2000);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#121824] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31]">
              <ArrowUpToLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Withdraw Capital
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Instant Settlement
                </span>
              </h3>
              <p className="text-xs text-slate-400">Withdraw to Nigeria Bank/Fintech or Crypto Wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Available Balance Banner */}
        <div className="mt-3.5 p-3 bg-[#0B0F17] rounded-2xl border border-slate-800/80 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-slate-400 block">Available Withdrawable Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-mono text-white">
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (≈ ₦{(currentBalance * USD_TO_NGN_EXCHANGE_RATE).toLocaleString()} NGN)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              0% Fee
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto flex-1 pr-0.5 mt-3 space-y-4 no-scrollbar">
          {/* Zero Balance Notice */}
          {currentBalance <= 0 ? (
            <div className="py-2 space-y-3">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Balance is $0.00</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Your account balance is currently $0.00. Fund your wallet or close profitable trades to make withdrawals to your Nigerian bank or crypto wallet.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="w-full py-3 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Deposit Funds to Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              {statusMessage && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* ROUTE TABS */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose Withdrawal Destination</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0F17] rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRoute('nigeria_bank')}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      route === 'nigeria_bank'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">🇳🇬</span>
                    <span className="truncate w-full text-[11px]">Nigeria Bank / OPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoute('crypto')}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      route === 'crypto'
                        ? 'bg-[#F5BA31] text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">₮</span>
                    <span className="truncate w-full text-[11px]">Crypto Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoute('intl_bank')}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      route === 'intl_bank'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">🌐</span>
                    <span className="truncate w-full text-[11px]">Intl Bank Wire</span>
                  </button>
                </div>
              </div>

              {/* ROUTE 1: NIGERIA LOCAL BANK & FINTECHS */}
              {route === 'nigeria_bank' && (
                <div className="space-y-3.5 p-3.5 bg-[#0D1422] border border-emerald-500/20 rounded-2xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Nigeria Local Banking (NIP Instant)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Rate: $1 = ₦{USD_TO_NGN_EXCHANGE_RATE.toLocaleString()} NGN
                    </span>
                  </div>

                  {/* Quick Select Buttons for Requested Fintechs: OPay, PalmPay, Kuda, Moniepoint, Paga */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Popular Mobile Banks & Fintechs:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { id: 'opay', name: 'OPay', color: '#00B875' },
                        { id: 'palmpay', name: 'PalmPay', color: '#6B38FB' },
                        { id: 'kuda', name: 'Kuda', color: '#40196D' },
                        { id: 'moniepoint', name: 'Moniepoint', color: '#003399' },
                        { id: 'paga', name: 'Paga', color: '#FF6B00' },
                      ].map((fin) => {
                        const isSelected = selectedBank.id === fin.id;
                        return (
                          <button
                            key={fin.id}
                            type="button"
                            onClick={() => {
                              const found = NIGERIAN_BANKS.find(b => b.id === fin.id);
                              if (found) setSelectedBank(found);
                            }}
                            className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400'
                                : 'bg-[#141B27] border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: fin.color }}
                            />
                            <span className="truncate w-full">{fin.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bank Dropdown Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Select Bank / Fintech Provider</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                        className="w-full px-3 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white flex items-center justify-between hover:border-emerald-400/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: selectedBank.badgeColor }}
                          />
                          <span className="font-bold text-slate-100 truncate">{selectedBank.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({selectedBank.code})</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>

                      {isBankDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 bg-black/40" 
                            onClick={() => setIsBankDropdownOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-[#0F1626] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-slate-800">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder="Search 24+ Nigerian banks & fintechs..."
                                  value={bankSearch}
                                  onChange={(e) => setBankSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 bg-[#141B27] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/40 no-scrollbar">
                              {filteredBanks.map((bank) => (
                                <button
                                  key={bank.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedBank(bank);
                                    setIsBankDropdownOpen(false);
                                    setBankSearch('');
                                  }}
                                  className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left ${
                                    selectedBank.id === bank.id ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span 
                                      className="w-2 h-2 rounded-full shrink-0" 
                                      style={{ backgroundColor: bank.badgeColor }}
                                    />
                                    <span className="truncate">{bank.name}</span>
                                  </div>
                                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                                    {bank.type}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 10-Digit Account Number */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      10-Digit NUBAN Account Number
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="e.g. 8012345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Account Name & Verification status */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-slate-300">Recipient Account Name</label>
                      {isAccountVerified && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> NIBSS Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* ROUTE 2: CRYPTO WALLET */}
              {route === 'crypto' && (
                <div className="space-y-3.5 p-3.5 bg-[#0D1422] border border-amber-500/20 rounded-2xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" />
                      Crypto Wallet Payout
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">Zero Gas Fee</span>
                  </div>

                  {/* Crypto Selector Pills */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Asset & Network</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CRYPTO_WITHDRAWAL_OPTIONS.map((c) => {
                        const isSelected = selectedCrypto.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCrypto(c)}
                            className={`p-2 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                                : 'bg-[#141B27] border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <span>{c.icon}</span>
                              <span className="truncate">{c.symbol}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">{c.network.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {selectedCrypto.name} Destination Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedCrypto.id.includes('trc') ? 'T...' : selectedCrypto.id.includes('btc') ? 'bc1...' : '0x...'}
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Network: <strong className="text-amber-400">{selectedCrypto.network}</strong>. Double check address.
                    </p>
                  </div>
                </div>
              )}

              {/* ROUTE 3: INTERNATIONAL BANK WIRE */}
              {route === 'intl_bank' && (
                <div className="space-y-3.5 p-3.5 bg-[#0D1422] border border-blue-500/20 rounded-2xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      SWIFT / SEPA International Transfer
                    </span>
                    <span className="text-[11px] text-slate-400">1–2 Business Days</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JPMorgan Chase, Barclays"
                      value={intlBankName}
                      onChange={(e) => setIntlBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">IBAN / Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GB82 WEST 1234 5678..."
                      value={intlIban}
                      onChange={(e) => setIntlIban(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">SWIFT / BIC Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. CHASUS33"
                      value={intlSwift}
                      onChange={(e) => setIntlSwift(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* AMOUNT SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Amount to Withdraw (USD)</label>
                  <button
                    type="button"
                    onClick={() => handlePercentage(1)}
                    className="text-xs text-amber-400 hover:underline font-bold"
                  >
                    Max ({formatCurrency(currentBalance)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    max={currentBalance}
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-400/80"
                  />
                </div>

                {/* Percentage Quick Picks */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[0.25, 0.50, 0.75, 1.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentage(pct)}
                      className="py-1 bg-[#141B27] hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                </div>

                {/* Real-Time Conversion Display for Nigeria Bank */}
                {route === 'nigeria_bank' && numAmount > 0 && (
                  <div className="p-3 bg-gradient-to-r from-emerald-950/50 to-[#0B0F17] border border-emerald-500/30 rounded-xl flex items-center justify-between animate-fadeIn">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">
                        You Will Receive in Naira:
                      </span>
                      <span className="text-lg font-extrabold font-mono text-white">
                        ₦{estimatedNgn.toLocaleString()} NGN
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <span>Rate: ₦{USD_TO_NGN_EXCHANGE_RATE}/$</span>
                      <span className="block text-emerald-400 font-bold">Transfer Fee: ₦0</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Settlement Time Guarantee */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {route === 'nigeria_bank'
                    ? 'Automated NIP settlement: Payout arrives in your account in 2–5 minutes.'
                    : route === 'crypto'
                    ? `Instant crypto release: ${selectedCrypto.speed} blockchain broadcast.`
                    : 'SWIFT wire processed within 24 business hours.'}
                </span>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || numAmount <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-[#F5BA31] hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {route === 'nigeria_bank'
                        ? `Withdraw ₦${estimatedNgn > 0 ? estimatedNgn.toLocaleString() : '0'} to ${selectedBank.name}`
                        : route === 'crypto'
                        ? `Withdraw $${numAmount.toFixed(2)} to ${selectedCrypto.symbol}`
                        : `Process $${numAmount.toFixed(2)} Bank Wire`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
