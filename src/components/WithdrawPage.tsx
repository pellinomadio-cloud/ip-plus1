import React, { useState, useEffect } from 'react';
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

interface WithdrawPageProps {
  onBack: () => void;
  onOpenDeposit: () => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ onBack, onOpenDeposit }) => {
  const { currentUser, withdrawFunds, transactions, staffAccount } = useAuth();

  // Amount & submission states
  const [amount, setAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nigerian Bank states
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(NIGERIAN_BANKS[0]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(currentUser?.name || '');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [isAccountVerified, setIsAccountVerified] = useState(false);

  const exchangeRate = staffAccount?.exchangeRateNgn || USD_TO_NGN_EXCHANGE_RATE;
  const currentBalance = currentUser?.balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const estimatedNgn = Math.round(numAmount * exchangeRate);

  // Verify 10-digit NUBAN account number
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length === 10) {
      setIsVerifyingAccount(true);
      const timer = setTimeout(() => {
        setIsVerifyingAccount(false);
        setIsAccountVerified(true);
        if (!accountName.trim() && currentUser?.name) {
          setAccountName(currentUser.name.toUpperCase());
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsVerifyingAccount(false);
      setIsAccountVerified(false);
    }
  }, [accountNumber, selectedBank.id]);

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
                  Your Naira payout has been queued via NIBSS Instant Payment (NIP).
                </span>
              )}
            </div>
          </div>
        )}

        {/* Zero Balance State */}
        {currentBalance <= 0 && !statusMessage ? (
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
                <span className="text-[11px] text-slate-400 font-mono">NIBSS / NIP</span>
              </div>

              {/* Popular Banks & Fintechs Quick Select */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-2">
                  Quick Select Bank or Fintech
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[
                    { id: 'opay', name: 'OPay', color: '#00B875' },
                    { id: 'palmpay', name: 'PalmPay', color: '#6B38FB' },
                    { id: 'moniepoint', name: 'Moniepoint', color: '#003399' },
                    { id: 'kuda', name: 'Kuda', color: '#40196D' },
                    { id: 'gtb', name: 'GTBank', color: '#E04403' }
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  10-Digit Account Number (NUBAN)
                </label>
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
              </div>

              {/* Beneficiary Account Name */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Account Beneficiary Name</label>
                  {isVerifyingAccount ? (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying NUBAN...
                    </span>
                  ) : isAccountVerified ? (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Account holder full name"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 uppercase"
                />
              </div>
            </div>

            {/* Withdrawal Amount Card */}
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white">Withdrawal Amount (USD)</label>
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
                  min="1"
                  max={currentBalance || undefined}
                  step="0.01"
                  required
                  placeholder="0.00"
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
                    <span className="text-[11px] text-slate-400 font-mono">
                      {tx.destinationDetails?.accountNumber
                        ? `${tx.destinationDetails.bankName} · ${tx.destinationDetails.accountNumber}`
                        : new Date(tx.timestamp).toLocaleDateString()}
                    </span>
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
