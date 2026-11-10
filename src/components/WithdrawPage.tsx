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
  RefreshCw
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
  onOpenUpgrade: () => void;
  onOpenVerifier?: () => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({
  onBack,
  onOpenUpgrade
}) => {
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

  // Bank & Account states — no bank or beneficiary name pre-filled initially
  const [selectedBank, setSelectedBank] = useState<NigerianBank | null>(null);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
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

  // Automatically verify account ONLY after bank is selected and account number reaches 10 digits
  // Keep accountName empty until verified
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '');

    if (!selectedBank || cleanAcc.length !== 10) {
      setIsVerifyingAccount(false);
      setIsAccountVerified(false);
      setAccountName('');
      setVerificationError(null);
      lastVerifiedKeyRef.current = '';
      return;
    }

    const key = `${selectedBank.code}:${cleanAcc}`;
    if (lastVerifiedKeyRef.current === key && isAccountVerified && !verificationError) {
      return;
    }

    if (requestInProgressRef.current) {
      return;
    }

    setIsVerifyingAccount(true);
    setIsAccountVerified(false);
    setAccountName('');
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
          setAccountName('');
          setVerificationError(res.errorMessage || 'Error: Invalid Account');
          lastVerifiedKeyRef.current = key;
        }
      } catch (err: any) {
        setIsAccountVerified(false);
        setAccountName('');
        setVerificationError(err.message || 'Error: Verification failed');
      } finally {
        setIsVerifyingAccount(false);
        requestInProgressRef.current = false;
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      requestInProgressRef.current = false;
    };
  }, [accountNumber, selectedBank]);

  const filteredBanks = NIGERIAN_BANKS.filter(
    b =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.includes(bankSearch)
  );

  const recentWithdrawals = transactions.filter(t => t.type === 'withdrawal').slice(0, 5);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedBank) {
      setStatusMessage({ type: 'error', text: 'Please select your bank first.' });
      return;
    }

    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length !== 10) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid 10-digit account number.'
      });
      return;
    }

    if (verificationError || !isAccountVerified || !accountName.trim()) {
      setStatusMessage({
        type: 'error',
        text: verificationError || 'Please wait for your bank account name to be verified.'
      });
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid withdrawal amount.' });
      return;
    }

    if (numAmount < 100) {
      setStatusMessage({
        type: 'error',
        text: 'Minimum withdrawal is $100.00.'
      });
      return;
    }

    if (numAmount > currentBalance) {
      setStatusMessage({
        type: 'error',
        text: `Insufficient balance. Your available balance is ${formatCurrency(currentBalance)}.`
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
        setAccountName('');
        setIsAccountVerified(false);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Simple Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Withdraw to Bank</h1>
            <p className="text-xs text-slate-400">Nigerian Bank Transfer</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Simple Balance Summary */}
        <div className="p-4 bg-[#111722] rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Available Balance</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">In Naira</span>
            <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
              ≈ ₦{Math.round(currentBalance * exchangeRate).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
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
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Pending Withdrawal Upgrade Notice */}
        {(latestPlacedWithdrawal || transactions.some(t => t.type === 'withdrawal' && t.status === 'pending')) && (
          <div className="p-4 bg-[#141B27] border-2 border-amber-400 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Withdrawal Pending</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestPlacedWithdrawal
                    ? `Your withdrawal of $${latestPlacedWithdrawal.amount.toFixed(2)} (₦${latestPlacedWithdrawal.ngnAmount.toLocaleString()}) to ${latestPlacedWithdrawal.bankName} is on pending.`
                    : 'Your withdrawal is currently on pending.'}{' '}
                  Please upgrade your account to <strong className="text-amber-400">Level 2</strong> to complete this withdrawal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenUpgrade}
              className="w-full py-3 px-4 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Upgrade to Level 2 to Complete Withdrawal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Basic Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="p-4 bg-[#111722] border border-slate-800 rounded-xl space-y-4">
          {/* 1. Select Bank */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Bank
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                className="w-full px-3.5 py-3 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white flex items-center justify-between hover:border-slate-700 transition-colors cursor-pointer"
              >
                {selectedBank ? (
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-white truncate">{selectedBank.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Tap to choose your bank...</span>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {isBankDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsBankDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0D131F] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-800">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search bank name..."
                          value={bankSearch}
                          onChange={e => setBankSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-[#141B27] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                      {filteredBanks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No matching bank found
                        </div>
                      ) : (
                        filteredBanks.map(bank => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => {
                              setSelectedBank(bank);
                              setIsBankDropdownOpen(false);
                              setBankSearch('');
                            }}
                            className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left cursor-pointer ${
                              selectedBank?.id === bank.id
                                ? 'bg-amber-400/15 text-amber-300 font-bold'
                                : 'text-slate-200'
                            }`}
                          >
                            <span className="truncate">{bank.name}</span>
                            {selectedBank?.id === bank.id && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. Account Number */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Account Number
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {accountNumber.length}/10
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
              className="w-full px-3.5 py-3 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* 3. Account Beneficiary Name (Empty until bank & 10-digit account number are verified) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Account Beneficiary Name
              </label>
              {isVerifyingAccount && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
                </span>
              )}
              {!isVerifyingAccount && isAccountVerified && accountName && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <input
              type="text"
              readOnly
              value={accountName}
              placeholder={
                isVerifyingAccount
                  ? 'Verifying account name...'
                  : 'Select bank and enter account number'
              }
              className={`w-full px-3.5 py-3 bg-[#0B0F17] border rounded-xl text-xs font-bold uppercase tracking-wide focus:outline-none ${
                isAccountVerified && accountName
                  ? 'border-emerald-500/50 text-emerald-400'
                  : 'border-slate-800 text-white placeholder-slate-500'
              }`}
            />

            {!isVerifyingAccount && verificationError && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{verificationError}</span>
              </p>
            )}
          </div>

          {/* 4. Amount to Withdraw */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Amount to Withdraw (USD)
              </label>
              <span className="text-[11px] text-slate-400">
                Minimum: $100
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                $
              </span>
              <input
                type="number"
                min="100"
                step="0.01"
                required
                placeholder="Enter amount (e.g. 100)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {numAmount > 0 && (
              <div className="mt-2 p-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-400">You will receive:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₦{estimatedNgn.toLocaleString()} NGN
                </span>
              </div>
            )}
          </div>

          {/* 5. Withdraw Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isAccountVerified || !accountName}
            className="w-full py-3.5 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowUpToLine className="w-4 h-4" />
                <span>Withdraw Now</span>
              </>
            )}
          </button>
        </form>

        {/* Recent Withdrawals List */}
        {recentWithdrawals.length > 0 && (
          <div className="p-4 bg-[#111722] border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300">Recent Withdrawals</h3>
            <div className="divide-y divide-slate-800/70">
              {recentWithdrawals.map(tx => (
                <div key={tx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{tx.title}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {tx.destinationDetails?.accountNumber
                        ? `${tx.destinationDetails.bankName} - ${tx.destinationDetails.accountNumber}`
                        : new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                    {tx.status === 'pending' && (
                      <button
                        type="button"
                        onClick={onOpenUpgrade}
                        className="mt-1 text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Upgrade to Level 2 to Complete</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-white block">-{formatCurrency(tx.amount)}</span>
                    <span className="text-[10px] text-amber-400 uppercase font-bold">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
