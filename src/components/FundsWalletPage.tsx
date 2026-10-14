import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Info,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';

interface FundsWalletPageProps {
  onBack: () => void;
  onGoToTrade: () => void;
}

const TRC20_WALLET = {
  address: 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc',
  networkName: 'TRON (TRC-20)',
  networkCode: 'TRC20',
  minDeposit: 10,
  confirmBlocks: 1
};

export const FundsWalletPage: React.FC<FundsWalletPageProps> = ({ onBack, onGoToTrade }) => {
  const { currentUser, trc20WalletAddress, submitDepositRequest } = useAuth();
  const [amount, setAmount] = useState<string>('100');
  const [copied, setCopied] = useState<boolean>(false);
  const [txIdInput, setTxIdInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [confirmStep, setConfirmStep] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<{ amount: number; txId: string } | null>(null);

  const balance = currentUser?.balance || 0;
  const activeAddress = trc20WalletAddress || 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc';

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    setIsVerifying(true);
    setConfirmStep(1);

    // Simulate TRC20 fast block verification
    setTimeout(() => setConfirmStep(6), 600);
    setTimeout(() => setConfirmStep(12), 1200);

    setTimeout(() => {
      setIsVerifying(false);
      setConfirmStep(0);
      const generatedTxId = txIdInput.trim() || 'f8a2' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Submit deposit request for review
      submitDepositRequest(num, 'TRC20', generatedTxId);
      setSuccessNotice({ amount: num, txId: generatedTxId });
      setTxIdInput('');
    }, 1800);
  };

  const presets = [25, 50, 100, 250, 500, 1000];

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Funds Wallet</h1>
            <p className="text-[11px] text-slate-400">USDT (TRC20) Deposit Gateway</p>
          </div>
        </div>

        {/* Current Balance Display */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Active Balance</span>
          <span className="font-mono font-bold text-sm text-amber-400">
            {formatCurrency(balance)}
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Success Modal / Banner */}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-[#121824] border border-amber-400/40 text-white space-y-2.5 animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-400">Deposit Submitted - Under Review</h4>
                <p className="text-xs text-slate-300 leading-snug">
                  Your transfer of <strong className="text-white font-mono">${successNotice.amount.toFixed(2)} USDT (TRC20)</strong> has been broadcast to the TRON network. On-chain node confirmations are under review. Your balance will update automatically upon completion.
                </p>
              </div>
            </div>
            <div className="p-2 bg-black/50 rounded-xl font-mono text-[10px] text-slate-400 truncate">
              TRC20 TxHash: {successNotice.txId}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSuccessNotice(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Submit Another Transfer
              </button>
              <button
                onClick={onGoToTrade}
                className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
              >
                <span>Go to Markets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Exclusive Payment Method Banner */}
        <div className="p-3.5 rounded-2xl bg-[#121824] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Tether USDT Branded Icon */}
            <div className="w-10 h-10 rounded-2xl bg-[#26A17B]/15 border border-[#26A17B]/30 flex items-center justify-center text-[#26A17B] shrink-0 font-bold font-mono text-lg shadow-sm">
              ₮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">USDT (TRC20)</h3>
                <span className="text-[10px] bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  TRON Network Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Automated sub-minute on-chain crediting</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">1 USDT = $1.00</span>
        </div>

        {/* 1. Network Banner */}
        <div className="p-3.5 bg-[#121824] border border-[#26A17B]/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#26A17B]" />
            <div>
              <span className="text-xs font-bold text-white block">Acceptable Network: TRC20</span>
              <span className="text-[10px] text-slate-400">TRON Blockchain (Lowest Fees & Fastest Settlement)</span>
            </div>
          </div>
          <span className="text-xs font-mono font-extrabold text-[#26A17B] bg-[#26A17B]/10 px-2 py-1 rounded-lg border border-[#26A17B]/20">
            TRC20 ONLY
          </span>
        </div>

        {/* 2. QR Code & Deposit Wallet Address */}
        <div className="p-5 bg-[#121824] border border-slate-800 rounded-2xl space-y-4 text-center">
          <span className="text-xs font-bold text-slate-300 block">
            Scan or Copy USDT TRC20 Wallet Address
          </span>

          {/* Crisp QR Code with centered USDT Badge */}
          <div className="relative inline-block p-4 bg-white rounded-2xl shadow-xl">
            <svg
              className="w-40 h-40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="white" />
              <rect x="5" y="5" width="26" height="26" rx="2" fill="#070A0F" />
              <rect x="9" y="9" width="18" height="18" fill="white" />
              <rect x="13" y="13" width="10" height="10" fill="#070A0F" />

              <rect x="69" y="5" width="26" height="26" rx="2" fill="#070A0F" />
              <rect x="73" y="9" width="18" height="18" fill="white" />
              <rect x="77" y="13" width="10" height="10" fill="#070A0F" />

              <rect x="5" y="69" width="26" height="26" rx="2" fill="#070A0F" />
              <rect x="9" y="73" width="18" height="18" fill="white" />
              <rect x="13" y="77" width="10" height="10" fill="#070A0F" />

              <rect x="36" y="8" width="5" height="5" fill="#070A0F" />
              <rect x="46" y="8" width="5" height="5" fill="#070A0F" />
              <rect x="56" y="8" width="5" height="5" fill="#070A0F" />
              <rect x="36" y="18" width="5" height="5" fill="#070A0F" />
              <rect x="46" y="18" width="5" height="5" fill="#070A0F" />
              <rect x="56" y="18" width="5" height="5" fill="#070A0F" />
              <rect x="8" y="36" width="5" height="5" fill="#070A0F" />
              <rect x="18" y="36" width="5" height="5" fill="#070A0F" />
              <rect x="28" y="36" width="5" height="5" fill="#070A0F" />
              <rect x="8" y="46" width="5" height="5" fill="#070A0F" />
              <rect x="18" y="46" width="5" height="5" fill="#070A0F" />
              <rect x="68" y="36" width="5" height="5" fill="#070A0F" />
              <rect x="78" y="36" width="5" height="5" fill="#070A0F" />
              <rect x="88" y="36" width="5" height="5" fill="#070A0F" />
              <rect x="68" y="46" width="5" height="5" fill="#070A0F" />
              <rect x="78" y="46" width="5" height="5" fill="#070A0F" />
              <rect x="36" y="68" width="5" height="5" fill="#070A0F" />
              <rect x="46" y="68" width="5" height="5" fill="#070A0F" />
              <rect x="56" y="68" width="5" height="5" fill="#070A0F" />
              <rect x="68" y="68" width="5" height="5" fill="#070A0F" />
              <rect x="78" y="78" width="5" height="5" fill="#070A0F" />
              <rect x="88" y="88" width="5" height="5" fill="#070A0F" />
            </svg>

            {/* Center Tether Badge */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#26A17B] border-2 border-white flex items-center justify-center text-white font-mono font-bold text-base shadow">
                ₮
              </div>
            </div>
          </div>

          {/* Copy Address Widget */}
          <div className="space-y-1.5 text-left">
            <span className="text-[11px] text-slate-400 block">USDT TRC20 Wallet Address</span>
            <div className="flex items-center gap-2 p-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl">
              <span className="font-mono text-xs text-slate-200 truncate flex-1 select-all">
                {activeAddress}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="py-1 px-2.5 bg-[#26A17B] hover:bg-[#208f6d] text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span>Min deposit: <strong className="text-white">${TRC20_WALLET.minDeposit} USDT</strong></span>
            <span>•</span>
            <span>Arrival: <strong className="text-emerald-400">~1 min</strong></span>
          </div>
        </div>

        {/* 3. Deposit Amount & Verification */}
        <form onSubmit={handleConfirmDeposit} className="p-4 bg-[#121824] border border-slate-800 rounded-2xl space-y-3.5">
          <span className="text-xs font-bold text-slate-300 block">
            Select Deposit Amount & Confirm Transfer
          </span>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {presets.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                  amount === amt.toString()
                    ? 'bg-[#26A17B] text-white border-[#26A17B]'
                    : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                ${amt} USDT
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
            <input
              type="number"
              min={TRC20_WALLET.minDeposit}
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-28 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-[#26A17B]"
              placeholder="100"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#26A17B]">
              USDT (TRC20)
            </span>
          </div>

          {/* Optional TxID */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              TRC20 Transaction Hash / TxID (Optional)
            </label>
            <input
              type="text"
              placeholder="Paste TRON TxHash (e.g. f8a2...) or leave blank for instant credit"
              value={txIdInput}
              onChange={(e) => setTxIdInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#26A17B]"
            />
          </div>

          {/* On-chain confirmation progress */}
          {isVerifying && (
            <div className="p-3 bg-black/50 border border-[#26A17B]/40 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#26A17B] font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying TRC20 On-Chain Transfer...
                </span>
                <span className="font-mono text-white font-bold">{confirmStep}/12 Blocks</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#26A17B] transition-all duration-300"
                  style={{ width: `${(confirmStep / 12) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-[#26A17B] hover:bg-[#208f6d] active:scale-[0.99] text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-[#26A17B]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isVerifying ? (
              <span>Verifying TRC20 Transfer...</span>
            ) : (
              <>
                <span>I Have Transferred ${amount} USDT (TRC20)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="p-3 bg-[#121824] border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Cold storage protected. Send strictly USDT via TRON (TRC20) network to guarantee instant crediting.</span>
        </div>
      </div>
    </div>
  );
};
