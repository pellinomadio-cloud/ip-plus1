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
  Lock,
  Wallet,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';

interface FundsWalletPageProps {
  onBack: () => void;
  onGoToTrade: () => void;
}

export interface CryptoOption {
  id: string;
  name: string;
  symbol: string;
  networkName: string;
  networkCode: string;
  iconSymbol: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  minDeposit: number;
  maxConfirmBlocks: number;
  defaultAddress: string;
  rateUsd: number;
}

export const CRYPTO_OPTIONS: CryptoOption[] = [
  {
    id: 'usdt-trc20',
    name: 'Tether USDT',
    symbol: 'USDT',
    networkName: 'TRON Network (TRC-20)',
    networkCode: 'TRC20',
    iconSymbol: '₮',
    color: '#26A17B',
    bgColor: 'bg-[#26A17B]/15',
    borderColor: 'border-[#26A17B]/40',
    badgeBg: 'bg-[#26A17B]/20',
    badgeText: 'text-[#26A17B]',
    minDeposit: 10,
    maxConfirmBlocks: 12,
    defaultAddress: 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc',
    rateUsd: 1.00
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    networkName: 'Bitcoin Network',
    networkCode: 'BTC',
    iconSymbol: '₿',
    color: '#F7931A',
    bgColor: 'bg-[#F7931A]/15',
    borderColor: 'border-[#F7931A]/40',
    badgeBg: 'bg-[#F7931A]/20',
    badgeText: 'text-[#F7931A]',
    minDeposit: 20,
    maxConfirmBlocks: 3,
    defaultAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    rateUsd: 68500.00
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    networkName: 'Ethereum Mainnet (ERC-20)',
    networkCode: 'ERC20',
    iconSymbol: 'Ξ',
    color: '#627EEA',
    bgColor: 'bg-[#627EEA]/15',
    borderColor: 'border-[#627EEA]/40',
    badgeBg: 'bg-[#627EEA]/20',
    badgeText: 'text-[#627EEA]',
    minDeposit: 20,
    maxConfirmBlocks: 12,
    defaultAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    rateUsd: 3520.00
  },
  {
    id: 'usdt-erc20',
    name: 'Tether USDT',
    symbol: 'USDT',
    networkName: 'Ethereum Network (ERC-20)',
    networkCode: 'ERC20',
    iconSymbol: '₮',
    color: '#627EEA',
    bgColor: 'bg-[#627EEA]/15',
    borderColor: 'border-[#627EEA]/40',
    badgeBg: 'bg-[#627EEA]/20',
    badgeText: 'text-[#627EEA]',
    minDeposit: 20,
    maxConfirmBlocks: 12,
    defaultAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    rateUsd: 1.00
  },
  {
    id: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    networkName: 'BNB Smart Chain (BEP-20)',
    networkCode: 'BEP20',
    iconSymbol: '◈',
    color: '#F3BA2F',
    bgColor: 'bg-[#F3BA2F]/15',
    borderColor: 'border-[#F3BA2F]/40',
    badgeBg: 'bg-[#F3BA2F]/20',
    badgeText: 'text-[#F3BA2F]',
    minDeposit: 10,
    maxConfirmBlocks: 15,
    defaultAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    rateUsd: 590.00
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    networkName: 'Solana Network',
    networkCode: 'SOL',
    iconSymbol: '◎',
    color: '#14F195',
    bgColor: 'bg-[#14F195]/15',
    borderColor: 'border-[#14F195]/40',
    badgeBg: 'bg-[#14F195]/20',
    badgeText: 'text-[#14F195]',
    minDeposit: 10,
    maxConfirmBlocks: 32,
    defaultAddress: '7xKXtg2CW87d97TXJSDp15X27sJvB3P8s9XyZ1w2Q3E4',
    rateUsd: 155.00
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    networkName: 'USD Coin Network',
    networkCode: 'USDC',
    iconSymbol: '$',
    color: '#2775CA',
    bgColor: 'bg-[#2775CA]/15',
    borderColor: 'border-[#2775CA]/40',
    badgeBg: 'bg-[#2775CA]/20',
    badgeText: 'text-[#2775CA]',
    minDeposit: 10,
    maxConfirmBlocks: 12,
    defaultAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    rateUsd: 1.00
  },
  {
    id: 'trx',
    name: 'TRON',
    symbol: 'TRX',
    networkName: 'TRON Network',
    networkCode: 'TRC20',
    iconSymbol: 'TRX',
    color: '#FF0013',
    bgColor: 'bg-[#FF0013]/15',
    borderColor: 'border-[#FF0013]/40',
    badgeBg: 'bg-[#FF0013]/20',
    badgeText: 'text-[#FF0013]',
    minDeposit: 10,
    maxConfirmBlocks: 12,
    defaultAddress: 'TX9b8K2mN1x4Vp7L6rE3d9QzF8s2Jw1yAc',
    rateUsd: 0.165
  }
];

export const FundsWalletPage: React.FC<FundsWalletPageProps> = ({ onBack, onGoToTrade }) => {
  const { currentUser, trc20WalletAddress, cryptoAddresses, submitDepositRequest } = useAuth();
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>('usdt-trc20');
  const [amount, setAmount] = useState<string>('100');
  const [copied, setCopied] = useState<boolean>(false);
  const [txIdInput, setTxIdInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [confirmStep, setConfirmStep] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<{ amount: number; txId: string; cryptoName: string; symbol: string } | null>(null);

  const selectedCrypto = CRYPTO_OPTIONS.find(c => c.id === selectedCryptoId) || CRYPTO_OPTIONS[0];

  const balance = currentUser?.balance || 0;

  // Active deposit address (Uses admin configured address for the selected crypto or fallback)
  const activeAddress = (cryptoAddresses && cryptoAddresses[selectedCrypto.id])
    ? cryptoAddresses[selectedCrypto.id]
    : ((selectedCrypto.id === 'usdt-trc20' || selectedCrypto.id === 'trx') && trc20WalletAddress
        ? trc20WalletAddress 
        : selectedCrypto.defaultAddress);

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

    const maxSteps = selectedCrypto.maxConfirmBlocks;
    const interval = setInterval(() => {
      setConfirmStep(prev => {
        if (prev >= maxSteps) {
          clearInterval(interval);
          return maxSteps;
        }
        return prev + Math.ceil(maxSteps / 3);
      });
    }, 450);

    setTimeout(() => {
      clearInterval(interval);
      setIsVerifying(false);
      setConfirmStep(0);
      const generatedTxId = txIdInput.trim() || '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      const fullNetworkLabel = `${selectedCrypto.symbol} (${selectedCrypto.networkCode})`;
      submitDepositRequest(num, fullNetworkLabel, generatedTxId);
      
      setSuccessNotice({ 
        amount: num, 
        txId: generatedTxId,
        cryptoName: selectedCrypto.name,
        symbol: selectedCrypto.symbol
      });
      setTxIdInput('');
    }, 1800);
  };

  const presets = [25, 50, 100, 250, 500, 1000];

  // Calculated crypto quantity
  const cryptoQty = (parseFloat(amount) || 0) / selectedCrypto.rateUsd;

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Deposit Crypto Funds</h1>
            <p className="text-[11px] text-slate-400">Multi-Chain Deposit Gateway</p>
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
        {/* Success Modal / Review Notice */}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-[#121824] border border-amber-400/40 text-white space-y-2.5 animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-400">Deposit Submitted - Under Review</h4>
                <p className="text-xs text-slate-300 leading-snug">
                  Your transfer of <strong className="text-white font-mono">${successNotice.amount.toFixed(2)} USD ({successNotice.cryptoName})</strong> has been broadcast on the blockchain. Node confirmations are being reviewed. Your balance will credit automatically upon approval.
                </p>
              </div>
            </div>
            <div className="p-2 bg-black/50 rounded-xl font-mono text-[10px] text-slate-400 truncate">
              TxHash: {successNotice.txId}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSuccessNotice(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Deposit More Funds
              </button>
              <button
                onClick={onGoToTrade}
                className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Go to Markets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Cryptocurrency Selector - Horizontal Scrolling List / Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Select Deposit Cryptocurrency</span>
            <span className="text-[10px] text-slate-400">8 Supported Chains</span>
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
            {CRYPTO_OPTIONS.map(crypto => {
              const isSelected = crypto.id === selectedCryptoId;
              return (
                <button
                  key={crypto.id}
                  onClick={() => {
                    setSelectedCryptoId(crypto.id);
                    setAmount(crypto.minDeposit > parseFloat(amount) ? crypto.minDeposit.toString() : amount);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                    isSelected 
                      ? `${crypto.bgColor} ${crypto.borderColor} text-white shadow-lg` 
                      : 'bg-[#121824] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shrink-0"
                    style={{ backgroundColor: crypto.color }}
                  >
                    {crypto.iconSymbol}
                  </div>
                  <div className="text-left leading-tight">
                    <span className="text-xs font-bold block">{crypto.symbol}</span>
                    <span className="text-[9px] opacity-75 font-mono">{crypto.networkCode}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Cryptocurrency Details Card */}
        <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold font-mono text-xl shadow-md shrink-0"
              style={{ backgroundColor: selectedCrypto.color }}
            >
              {selectedCrypto.iconSymbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{selectedCrypto.name}</h3>
                <span className={`text-[10px] ${selectedCrypto.badgeBg} ${selectedCrypto.badgeText} px-1.5 py-0.5 rounded font-mono font-bold`}>
                  {selectedCrypto.networkCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedCrypto.networkName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Current Rate</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              1 {selectedCrypto.symbol} ≈ ${selectedCrypto.rateUsd < 1 ? selectedCrypto.rateUsd.toFixed(3) : selectedCrypto.rateUsd.toLocaleString()}
            </span>
          </div>
        </div>

        {/* QR Code & Deposit Wallet Address Card */}
        <div className="p-5 bg-[#121824] border border-slate-800 rounded-2xl space-y-4 text-center">
          <span className="text-xs font-bold text-slate-300 block">
            Scan QR or Copy {selectedCrypto.symbol} Deposit Address
          </span>

          {/* Dynamic QR Code Box */}
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

            {/* Center Crypto Badge */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-mono font-bold text-base shadow"
                style={{ backgroundColor: selectedCrypto.color }}
              >
                {selectedCrypto.iconSymbol}
              </div>
            </div>
          </div>

          {/* Copy Address Widget */}
          <div className="space-y-1.5 text-left">
            <span className="text-[11px] text-slate-400 block">
              {selectedCrypto.name} ({selectedCrypto.networkCode}) Deposit Address
            </span>
            <div className="flex items-center gap-2 p-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl">
              <span className="font-mono text-xs text-slate-200 truncate flex-1 select-all">
                {activeAddress}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="py-1 px-2.5 hover:opacity-90 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                style={{ backgroundColor: selectedCrypto.color }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span>Min deposit: <strong className="text-white">${selectedCrypto.minDeposit} USD</strong></span>
            <span>•</span>
            <span>Network: <strong className="text-emerald-400">{selectedCrypto.networkCode}</strong></span>
          </div>
        </div>

        {/* Deposit Amount & Verification Form */}
        <form onSubmit={handleConfirmDeposit} className="p-4 bg-[#121824] border border-slate-800 rounded-2xl space-y-3.5">
          <span className="text-xs font-bold text-slate-300 block">
            Deposit Amount & Payment Confirmation
          </span>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {presets.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  amount === amt.toString()
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                ${amt} USD
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                min={selectedCrypto.minDeposit}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-28 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                placeholder="100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                USD
              </span>
            </div>

            {/* Crypto Quantity Equivalent */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 font-mono">
              <span>Crypto Amount:</span>
              <span className="text-white font-bold">
                ≈ {cryptoQty < 0.01 ? cryptoQty.toFixed(6) : cryptoQty.toFixed(4)} {selectedCrypto.symbol}
              </span>
            </div>
          </div>

          {/* Optional TxID */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Transaction Hash / TxID (Optional)
            </label>
            <input
              type="text"
              placeholder={`Paste ${selectedCrypto.symbol} TxHash or leave blank for review`}
              value={txIdInput}
              onChange={(e) => setTxIdInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* On-chain confirmation progress */}
          {isVerifying && (
            <div className="p-3 bg-black/50 border border-amber-400/40 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Broadcasting {selectedCrypto.symbol} Transfer...
                </span>
                <span className="font-mono text-white font-bold">{confirmStep}/{selectedCrypto.maxConfirmBlocks} Confirmations</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (confirmStep / selectedCrypto.maxConfirmBlocks) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isVerifying ? (
              <span>Verifying {selectedCrypto.symbol} Transfer...</span>
            ) : (
              <>
                <span>I Have Transferred ${amount} USD ({selectedCrypto.symbol})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="p-3 bg-[#121824] border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Cold storage protected gateway. Ensure you transfer strictly on the <strong>{selectedCrypto.networkName}</strong> network.</span>
        </div>
      </div>
    </div>
  );
};
