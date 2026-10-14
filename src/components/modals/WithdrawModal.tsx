import React, { useState } from 'react';
import { X, ArrowUpToLine, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../data/marketData';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onOpenDeposit }) => {
  const { currentUser, withdrawFunds } = useAuth();
  const [method, setMethod] = useState<'crypto' | 'bank'>('crypto');
  const [amount, setAmount] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentBalance = currentUser?.balance || 0;

  const handleMax = () => {
    setAmount(currentBalance.toFixed(2));
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid withdrawal amount.' });
      return;
    }

    if (num > currentBalance) {
      setStatusMessage({ 
        type: 'error', 
        text: `Withdrawal exceeds available balance (${formatCurrency(currentBalance)}).` 
      });
      return;
    }

    if (!destination.trim()) {
      setStatusMessage({ 
        type: 'error', 
        text: method === 'crypto' ? 'Please enter your crypto wallet address.' : 'Please enter your IBAN / Bank Account.' 
      });
      return;
    }

    const res = withdrawFunds(num, method === 'crypto' ? 'USDT (TRC-20)' : 'Bank Wire', destination);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
        setAmount('');
        setDestination('');
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121824] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-[#F5BA31]">
              <ArrowUpToLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Withdraw Capital</h3>
              <p className="text-xs text-slate-400">Request payout to your external account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Available Balance */}
        <div className="mt-4 p-3 bg-[#0B0F17] rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Available For Withdrawal</span>
            <span className="text-lg font-bold font-mono text-white">
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
            0% Fee
          </span>
        </div>

        {/* If balance is 0.00 */}
        {currentBalance <= 0 ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Balance is $0.00</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Your registered account currently has a balance of $0.00. You can fund your wallet to begin trading and generate withdrawable returns.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="w-full py-3 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Deposit Funds to Wallet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4 mt-4">
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

            {/* Method switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Withdrawal Route</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('crypto')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    method === 'crypto'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-[#161F2E] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Crypto (USDT / TRC-20)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    method === 'bank'
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                      : 'bg-[#161F2E] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Bank Wire / SEPA
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-400">Amount (USD)</label>
                <button
                  type="button"
                  onClick={handleMax}
                  className="text-xs text-amber-400 hover:underline font-semibold"
                >
                  Use Max ({formatCurrency(currentBalance)})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>

            {/* Destination Address / Account */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {method === 'crypto' ? 'USDT TRC-20 Wallet Address' : 'Bank IBAN / Account Number'}
              </label>
              <input
                type="text"
                required
                placeholder={method === 'crypto' ? 'T...' : 'GB82 WEST 1234...'}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
              />
            </div>

            {/* Processing speed note */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated settlement: processed within 5–15 minutes.</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Withdrawal Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
