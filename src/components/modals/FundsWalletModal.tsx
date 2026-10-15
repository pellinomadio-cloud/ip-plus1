import React, { useState } from 'react';
import { X, Wallet, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, DollarSign, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../data/marketData';

interface FundsWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundsWalletModal: React.FC<FundsWalletModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, depositFunds, hasPendingDeposit } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'crypto' | 'wire'>('card');
  const [customAmount, setCustomAmount] = useState<string>('250');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const presets = [50, 100, 250, 500, 1000, 5000];

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPendingDeposit) return;
    const num = parseFloat(customAmount);
    if (isNaN(num) || num <= 0) return;

    const methodName = selectedMethod === 'card' 
      ? 'Credit/Debit Card' 
      : selectedMethod === 'crypto' 
      ? 'USDT (TRC-20)' 
      : 'Wire Transfer';

    depositFunds(num, methodName);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121824] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Funds Wallet</h3>
              <p className="text-xs text-slate-400">Add capital to your trading account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Deposit Successful!</h4>
            <p className="text-xs text-slate-400 mt-1">
              {formatCurrency(parseFloat(customAmount) || 0)} has been credited to your balance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDeposit} className="space-y-4 pt-4">
            {/* Current Balance Banner */}
            <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Current Balance:</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {formatCurrency(currentUser?.balance || 0)}
              </span>
            </div>

            {/* Deposit Method selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Deposit Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'card'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-[#161F2E] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('crypto')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'crypto'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-[#161F2E] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">₮</span>
                  <span className="text-[11px] font-semibold">USDT/Crypto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('wire')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'wire'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-[#161F2E] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Bank Wire</span>
                </button>
              </div>
            </div>

            {/* Quick Amounts */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Amount (USD)</label>
              <div className="grid grid-cols-3 gap-2">
                {presets.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmount(amt.toString())}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-colors ${
                      customAmount === amt.toString()
                        ? 'bg-[#F5BA31] text-slate-950 border-[#F5BA31]'
                        : 'bg-[#161F2E] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Custom Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                <input
                  type="number"
                  min="10"
                  step="1"
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400/60"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Pending deposit lock notice */}
            {hasPendingDeposit ? (
              <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl space-y-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cannot Make Another Deposit</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  You already have a pending deposit awaiting admin approval. Please wait for it to be confirmed.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant deposit, zero transaction fee, credited immediately.</span>
              </div>
            )}

            {/* Action */}
            <button
              type="submit"
              disabled={hasPendingDeposit}
              className={`w-full py-3 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                hasPendingDeposit
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.99] text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
              }`}
            >
              <span>{hasPendingDeposit ? 'Deposit Locked (Pending Review)' : `Confirm Deposit of $${customAmount || '0'}`}</span>
              {!hasPendingDeposit && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
