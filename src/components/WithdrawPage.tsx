import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowUpToLine,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  Search,
  ChevronDown,
  Clock,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';
import {
  NIGERIAN_BANKS,
  NigerianBank,
  USD_TO_NGN_EXCHANGE_RATE
} from '../data/countries';
import { verifyBankAccount } from '../services/bankVerificationService';

interface WithdrawPageProps {
  onBack: () => void;
  onOpenDeposit: () => void;
  onOpenUpgrade?: () => void;
  onOpenVerifier?: () => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ onBack, onOpenDeposit, onOpenUpgrade, onOpenVerifier }) => {
  const { currentUser, withdrawFunds, transactions, staffAccount } = useAuth();

  // Amount & submission states
  const [amount, setAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestPlacedWithdrawal, setLatestPlacedWithdrawal] = useState<{
    amount: number;
    bankName: string;
    ngnAmount: number;
  } | null>(null);

  // Nigerian Bank states
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(NIGERIAN_BANKS[0]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(currentUser?.name || '');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // In-flight request lock & last verified key reference
  const requestInProgressRef = useRef<boolean>(false);
  const lastVerifiedKeyRef = useRef<string>('');

  const exchangeRate = staffAccount?.exchangeRateNgn || USD_TO_NGN_EXCHANGE_RATE;
  const currentBalance = currentUser?.balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const estimatedNgn = Math.round(numAmount * exchangeRate);

  // Real-time automatic account verification via API once bank is selected & account number is 10 digits
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length !== 10) {
      setIsVerifyingAccount(false);
      setIsAccountVerified(false);
      setVerificationError(null);
      lastVerifiedKeyRef.current = '';
      return;
    }

    const key = `${selectedBank.code}:${cleanAcc}`;
    if (lastVerifiedKeyRef.current === key && isAccountVerified && !verificationError) {
      return;
    }

    // Prevent duplicate request while one is running
    if (requestInProgressRef.current) {
      return;
    }

    setIsVerifyingAccount(true);
    setVerificationError(null);
    requestInProgressRef.current = true;

    const timer = setTimeout(async () => {
      try {
        const res = await verifyBankAccount(selectedBank.code, cleanAcc);
        if (res.success && res.accountName) {
          setIsAccountVerified(true);
          setAccountName(res.accountName.toUpperCase());
          setVerificationError(null);
          lastVerifiedKeyRef.current = key;
        } else {
          setIsAccountVerified(false);
          setVerificationError(res.errorMessage || 'Error: Invalid Account');
          lastVerifiedKeyRef.current = key;
        }
      } catch (err: any) {
        setIsAccountVerified(false);
        setVerificationError(err.message || 'Error: Verification request failed');
      } finally {
        setIsVerifyingAccount(false);
        requestInProgressRef.current = false;
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      requestInProgressRef.current = false;
    };
  }, [accountNumber, selectedBank]);

  const handlePercentage = (percent: number) => {
    if (currentBalance <= 0) return;
    const val = (currentBalance * percent).toFixed(2);
    setAmount(val);
    setStatusMessage(null);
  };

  const filteredBanks = NIGERIAN_BANKS.filter(
    b =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.includes(bankSearch)
  );

  const recentWithdrawals = transactions.filter(t => t.type === 'withdrawal').slice(0, 5);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid withdrawal amount in USD.' });
      return;
    }

    if (numAmount < 100) {
      setStatusMessage({
        type: 'error',
        text: 'Minimum withdrawal is $100.00. You must accumulate at least $100.00 before requesting a withdrawal.'
      });
      return;
    }

    if (numAmount > currentBalance) {
      setStatusMessage({
        type: 'error',
        text: `Withdrawal amount exceeds your available balance (${formatCurrency(currentBalance)}).`
      });
      return;
    }

    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length !== 10) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid 10-digit Nigerian NUBAN account number.'
      });
      return;
    }

    if (verificationError || !isAccountVerified) {
      setStatusMessage({
        type: 'error',
        text: verificationError || 'Please provide a valid, verified 10-digit Nigerian bank account.'
      });
      return;
    }

    if (!accountName.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter the recipient account holder name.'
      });
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
          accountName: accountName.trim().toUpperCase(),
          ngnAmount: estimatedNgn,
          exchangeRate
        }
      );

      setIsSubmitting(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setLatestPlacedWithdrawal({
          amount: numAmount,
          bankName: selectedBank.name,
          ngnAmount: estimatedNgn
        });
        setAmount('');
        setAccountNumber('');
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Sticky Top Page Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Withdraw Funds</h1>
            <p className="text-[11px] text-slate-400">Direct Nigerian Bank Settlement (NIP)</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Withdrawable</span>
          <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
            {formatCurrency(currentBalance)}
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Available Balance Summary Card */}
        <div className="p-4 bg-[#111722] rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Available Cash Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                ≈ ₦{Math.round(currentBalance * exchangeRate).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Exchange Rate</span>
            <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
              $1 = ₦{exchangeRate.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Feedback Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <div className="space-y-1">
              <span className="block">{statusMessage.text}</span>
              {statusMessage.type === 'success' && (
                <span className="text-[11px] text-emerald-400/90 block">
                  Your withdrawal has been registered and placed on pending status.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pending Withdrawal Upgrade Action Card */}
        {(latestPlacedWithdrawal || transactions.some(t => t.type === 'withdrawal' && t.status === 'pending')) && (
          <div className="p-4 bg-gradient-to-r from-amber-500/20 via-[#182030] to-[#121824] border-2 border-amber-400 rounded-2xl shadow-xl shadow-amber-400/10 space-y-3.5 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white">Withdrawal Status: Pending Verification</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-400 text-slate-950">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestPlacedWithdrawal
                    ? `Your withdrawal of $${latestPlacedWithdrawal.amount.toFixed(2)} (₦${latestPlacedWithdrawal.ngnAmount.toLocaleString()} NGN) to ${latestPlacedWithdrawal.bankName} is pending.`
                    : 'You have a withdrawal request on pending hold.'}
                  {' '}To complete this withdrawal and release your funds, upgrade your account to <strong className="text-amber-400">Level 2</strong>.
                </p>
              </div>
            </div>

            {onOpenUpgrade && (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="w-full py-3 px-4 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.99] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4 fill-slate-950" />
                <span>Upgrade Account to Level 2 to Complete This Withdrawal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Zero Balance State */}
        {currentBalance <= 0 && !statusMessage && !latestPlacedWithdrawal && !transactions.some(t => t.type === 'withdrawal' && t.status === 'pending') ? (
          <div className="p-5 rounded-2xl bg-[#111722] border border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">No Withdrawable Balance Available</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Your available balance is currently $0.00. Fund your trading wallet or close active positions to withdraw directly to your Nigerian bank account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDeposit}
              className="w-full py-3 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Funds Wallet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Nigerian Bank Payout Form */
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Bank & Account Details Card */}
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white">Recipient Nigerian Bank Account</h2>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenVerifier && (
                    <button
                      type="button"
                      onClick={onOpenVerifier}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                    >
                      <span>API Verifier Tool</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">NIBSS / NIP</span>
                </div>
              </div>

              {/* Popular Banks & Fintechs Quick Select */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-2">
                  Quick Select Bank or Fintech
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[
                    { id: 'access', name: 'Access', code: '044', color: '#FF6200' },
                    { id: 'gtbank', name: 'GTBank', code: '058', color: '#DD4F05' },
                    { id: 'zenith', name: 'Zenith', code: '057', color: '#B22222' },
                    { id: 'opay', name: 'OPay', code: '100004', color: '#00B875' },
                    { id: 'palmpay', name: 'PalmPay', code: '100033', color: '#6B38FB' }
                  ].map(fin => {
                    const isSelected = selectedBank.id === fin.id;
                    return (
                      <button
                        key={fin.id}
                        type="button"
                        onClick={() => {
                          const found = NIGERIAN_BANKS.find(b => b.id === fin.id);
                          if (found) setSelectedBank(found);
                        }}
                        className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-400 text-white'
                            : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: fin.color }}
                        />
                        <span className="truncate w-full">{fin.name}</span>
                        <span className="text-[9px] font-mono text-slate-500">{fin.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Nigerian Banks Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Nigerian Bank
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white flex items-center justify-between hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedBank.badgeColor }}
                      />
                      <span className="font-bold text-slate-100 truncate">{selectedBank.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({selectedBank.code})</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {isBankDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setIsBankDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0D131F] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-800">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search Nigerian commercial bank or fintech..."
                              value={bankSearch}
                              onChange={e => setBankSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-[#141B27] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/40 no-scrollbar">
                          {filteredBanks.map(bank => (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => {
                                setSelectedBank(bank);
                                setIsBankDropdownOpen(false);
                                setBankSearch('');
                              }}
                              className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left cursor-pointer ${
                                selectedBank.id === bank.id
                                  ? 'bg-emerald-500/10 text-emerald-300 font-bold'
                                  : 'text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: bank.badgeColor }}
                                />
                                <span className="truncate">{bank.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {bank.type === 'fintech' ? 'Fintech' : 'Commercial'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 10-Digit NUBAN Account Number */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    10-Digit Account Number (NUBAN)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {accountNumber.length}/10 digits
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="Enter 10-digit account number"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 tracking-wider"
                />

                {/* Automatically show resolved bank name prominently once account number is input */}
                {accountNumber.length > 0 && (
                  <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Bank Name</span>
                        <span className="font-bold text-white">{selectedBank.name}</span>
                      </div>
                    </div>
                    {accountNumber.length === 10 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Validated
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        Enter 10 digits
                      </span>
                    )}
                  </div>
                )}

                {/* 1-Click Demo Accounts for rapid testing */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-400 text-[10px]">Test API:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const b = NIGERIAN_BANKS.find(x => x.code === '044');
                      if (b) setSelectedBank(b);
                      setAccountNumber('0000000000');
                    }}
                    className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 hover:bg-amber-400/20 cursor-pointer"
                  >
                    Access 0000000000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = NIGERIAN_BANKS.find(x => x.code === '058');
                      if (b) setSelectedBank(b);
                      setAccountNumber('0000000001');
                    }}
                    className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 hover:bg-amber-400/20 cursor-pointer"
                  >
                    GTBank 0000000001
                  </button>
                </div>
              </div>

              {/* Verification States Feedback */}
              {/* 1. Loading Indicator */}
              {isVerifyingAccount && (
                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300 animate-in fade-in">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Verifying Bank Account with {selectedBank.name}...</span>
                    <span className="text-[11px] text-amber-400/80 font-mono block">
                      Querying verification API with bank code {selectedBank.code}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Success State: Displays Returned Account Name */}
              {!isVerifyingAccount && isAccountVerified && accountName && (
                <div className="p-3 bg-gradient-to-r from-emerald-500/15 via-[#101F1B] to-[#0D1815] border border-emerald-500/35 rounded-xl space-y-1 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Verified Account Name
                    </span>
                    <span>{selectedBank.code} · NUBAN OK</span>
                  </div>
                  <div className="text-sm font-extrabold text-white uppercase flex items-center gap-1.5">
                    <span>{accountName}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-emerald-500/20 font-mono">
                    <span>Bank: {selectedBank.name}</span>
                    <span>NUBAN: {accountNumber}</span>
                  </div>
                </div>
              )}

              {/* 3. Failure State: Displays Returned Error Message */}
              {!isVerifyingAccount && verificationError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/35 rounded-xl text-xs text-rose-300 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">Account Verification Failed</span>
                      <span className="font-mono text-rose-300 text-[11px] block">{verificationError}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-rose-500/20 text-[11px]">
                    <span className="text-slate-400">Double check the 10-digit number or try another bank.</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanAcc = accountNumber.replace(/\D/g, '');
                        if (cleanAcc.length === 10) {
                          setIsVerifyingAccount(true);
                          setVerificationError(null);
                          verifyBankAccount(selectedBank.code, cleanAcc).then(res => {
                            setIsVerifyingAccount(false);
                            if (res.success && res.accountName) {
                              setIsAccountVerified(true);
                              setAccountName(res.accountName.toUpperCase());
                            } else {
                              setIsAccountVerified(false);
                              setVerificationError(res.errorMessage || 'Error: Invalid Account');
                            }
                          });
                        }
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Beneficiary Account Name Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Account Beneficiary Name</label>
                  {isVerifyingAccount ? (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  ) : isAccountVerified ? (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> API Verified
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  required
                  placeholder={isVerifyingAccount ? 'Resolving account holder name...' : 'Account holder full name'}
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 uppercase tracking-wide"
                />
              </div>
            </div>

            {/* Withdrawal Amount Card */}
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-white">Withdrawal Amount (USD)</label>
                  <span className="text-[10px] bg-amber-400/15 border border-amber-400/30 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Min $100.00
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePercentage(1)}
                  className="text-xs text-amber-400 hover:underline font-bold font-mono cursor-pointer tabular-nums"
                >
                  Max: {formatCurrency(currentBalance)}
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                  $
                </span>
                <input
                  type="number"
                  min="100"
                  max={currentBalance || undefined}
                  step="0.01"
                  required
                  placeholder="Min 100.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-14 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-400 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  USD
                </span>
              </div>

              {/* Percentage Quick Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.25, 0.5, 0.75, 1.0].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="py-1.5 bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-800 rounded-lg text-xs font-mono font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>

              {/* Naira Payout Calculation Box */}
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Conversion Rate</span>
                  <span className="font-mono text-slate-200 tabular-nums">$1.00 = ₦{exchangeRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>NIP Settlement Fee</span>
                  <span className="font-mono text-emerald-400 font-semibold">₦0.00 (Free)</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-baseline">
                  <span className="text-slate-300 font-semibold">Net Payout to Bank</span>
                  <span className="text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                    ₦{estimatedNgn.toLocaleString()} NGN
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || currentBalance <= 0}
              className="w-full py-3.5 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpToLine className="w-4 h-4" />
                  <span>
                    {numAmount > 0
                      ? `Withdraw ₦${estimatedNgn.toLocaleString()} to ${selectedBank.name}`
                      : `Withdraw to ${selectedBank.name}`}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Recent Nigerian Bank Withdrawals */}
        {recentWithdrawals.length > 0 && (
          <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Bank Withdrawals</span>
            </h3>
            <div className="divide-y divide-slate-800/70">
              {recentWithdrawals.map(tx => (
                <div key={tx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{tx.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tx.destinationDetails?.accountNumber
                          ? `${tx.destinationDetails.bankName} · ${tx.destinationDetails.accountNumber}`
                          : new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                      {tx.status === 'pending' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                          Pending Level 2
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                          Completed
                        </span>
                      )}
                    </div>
                    {tx.status === 'pending' && onOpenUpgrade && (
                      <button
                        type="button"
                        onClick={onOpenUpgrade}
                        className="mt-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Upgrade Account to Level 2 to Complete</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span className="font-bold text-white block">-{formatCurrency(tx.amount)}</span>
                    {tx.destinationDetails?.ngnAmount && (
                      <span className="text-[11px] text-emerald-400 block">
                        ₦{tx.destinationDetails.ngnAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3.5 rounded-xl bg-[#111722] border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Direct NIBSS Instant Payment (NIP) settlement to Nigerian commercial banks and mobile money operators.
          </span>
        </div>
      </div>
    </div>
  );
};
