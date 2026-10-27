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
  Building2,
  Upload,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  X,
  Coins
} from 'lucide-react';
import { useAuth, isNigeriaPhoneUser } from '../context/AuthContext';
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
  const { 
    currentUser, 
    trc20WalletAddress, 
    cryptoAddresses, 
    submitDepositRequest, 
    staffAccount,
    submitBankTransferDeposit,
    hasPendingDeposit,
    userPendingDeposit
  } = useAuth();

  const isNigeriaUser = isNigeriaPhoneUser(currentUser);

  // Flow State: 
  // For Nigerian users: starts at 'select_channel'
  // For non-Nigerian users: starts directly at 'crypto'
  const [activeChannel, setActiveChannel] = useState<'select_channel' | 'loading_bank' | 'bank_transfer' | 'crypto' | 'bank_submitted'>(
    isNigeriaUser ? 'select_channel' : 'crypto'
  );

  // Crypto State
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>('btc');
  const [cryptoAmount, setCryptoAmount] = useState<string>('100');
  const [copiedCrypto, setCopiedCrypto] = useState<boolean>(false);
  const [txIdInput, setTxIdInput] = useState<string>('');
  const [isVerifyingCrypto, setIsVerifyingCrypto] = useState<boolean>(false);
  const [cryptoConfirmStep, setCryptoConfirmStep] = useState<number>(0);
  const [cryptoSuccessNotice, setCryptoSuccessNotice] = useState<{ amount: number; txId: string; cryptoName: string; symbol: string } | null>(null);

  // Bank Transfer State
  const [bankAmountUsd, setBankAmountUsd] = useState<string>('100');
  const [copiedBankAcc, setCopiedBankAcc] = useState<boolean>(false);
  const [copiedNarration, setCopiedNarration] = useState<boolean>(false);
  const [copiedNgnAmount, setCopiedNgnAmount] = useState<boolean>(false);
  const [senderBank, setSenderBank] = useState<string>('OPay');
  const [senderName, setSenderName] = useState<string>(currentUser?.name || '');
  const [bankTxRef, setBankTxRef] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [bankUploadError, setBankUploadError] = useState<string | null>(null);
  const [isSubmittingBank, setIsSubmittingBank] = useState<boolean>(false);
  const [submittedDepositDetails, setSubmittedDepositDetails] = useState<{
    usd: number;
    ngn: number;
    ref: string;
    bankName: string;
    accountNumber: string;
    proofUrl?: string;
  } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  const balance = currentUser?.balance || 0;
  const selectedCrypto = CRYPTO_OPTIONS.find(c => c.id === selectedCryptoId) || CRYPTO_OPTIONS[0];

  const activeCryptoAddress = (cryptoAddresses && cryptoAddresses[selectedCrypto.id])
    ? cryptoAddresses[selectedCrypto.id]
    : (selectedCrypto.id === 'trx' && trc20WalletAddress
        ? trc20WalletAddress 
        : selectedCrypto.defaultAddress);

  const exchangeRate = staffAccount?.exchangeRateNgn || 1550;
  const parsedUsd = Math.max(1, parseFloat(bankAmountUsd) || 0);
  const calculatedNgn = Math.round(parsedUsd * exchangeRate);
  const userNarrationRef = `IQ-${currentUser?.accountNumber ? currentUser.accountNumber.replace('IQ-', '') : 'DEP' + Math.floor(1000 + Math.random() * 9000)}`;

  // Strict check: Naira settlement account must be genuinely configured by admin
  const isNairaConfigured = Boolean(
    staffAccount &&
    staffAccount.isConfigured &&
    staffAccount.bankName?.trim() &&
    staffAccount.accountNumber?.trim() &&
    staffAccount.accountNumber !== '8102345678'
  );

  // Transition from method selection to bank transfer with an animated loading page
  const handleSelectBankTransfer = () => {
    if (!isNairaConfigured) return;
    setActiveChannel('loading_bank');
    setTimeout(() => {
      setActiveChannel('bank_transfer');
    }, 600);
  };

  const handleCopyBank = () => {
    navigator.clipboard?.writeText(staffAccount.accountNumber);
    setCopiedBankAcc(true);
    setTimeout(() => setCopiedBankAcc(false), 2000);
  };

  const handleCopyNarration = () => {
    navigator.clipboard?.writeText(userNarrationRef);
    setCopiedNarration(true);
    setTimeout(() => setCopiedNarration(false), 2000);
  };

  const handleCopyNgn = () => {
    navigator.clipboard?.writeText(calculatedNgn.toString());
    setCopiedNgnAmount(true);
    setTimeout(() => setCopiedNgnAmount(false), 2000);
  };

  const handleCopyCrypto = () => {
    navigator.clipboard?.writeText(activeCryptoAddress);
    setCopiedCrypto(true);
    setTimeout(() => setCopiedCrypto(false), 2000);
  };

  // Handle Receipt Upload via file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBankUploadError(null);
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Bank Transfer Submission
  const handleSubmitBankTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedUsd <= 0) return;

    if (!isNairaConfigured) {
      setBankUploadError('Naira bank deposit is currently not configured by the administrator.');
      return;
    }

    if (hasPendingDeposit) {
      setBankUploadError('You already have a pending deposit awaiting admin approval. You cannot make another deposit until it is resolved.');
      return;
    }

    if (!proofImage) {
      setBankUploadError('Please choose and upload your payment transfer screenshot or receipt before submitting.');
      return;
    }

    setBankUploadError(null);
    setIsSubmittingBank(true);
    const finalRef = bankTxRef.trim() || 'TRF-' + Math.floor(10000000 + Math.random() * 90000000);
    const finalProof = proofImage;
    const finalFileName = proofFileName || 'payment_receipt.jpg';

    setTimeout(() => {
      submitBankTransferDeposit({
        amountUsd: parsedUsd,
        amountNgn: calculatedNgn,
        senderName: senderName.trim() || currentUser?.name || 'Local Depositor',
        senderBank: senderBank.trim() || 'Local Bank',
        referenceOrSessionId: finalRef,
        proofImageUrl: finalProof,
        proofFileName: finalFileName
      });

      setSubmittedDepositDetails({
        usd: parsedUsd,
        ngn: calculatedNgn,
        ref: finalRef,
        bankName: staffAccount.bankName,
        accountNumber: staffAccount.accountNumber,
        proofUrl: finalProof
      });

      setIsSubmittingBank(false);
      setActiveChannel('bank_submitted');
    }, 750);
  };

  // Crypto Deposit Confirmation
  const handleConfirmCryptoDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPendingDeposit) return;
    const num = parseFloat(cryptoAmount);
    if (isNaN(num) || num <= 0) return;

    setIsVerifyingCrypto(true);
    setCryptoConfirmStep(1);

    const maxSteps = selectedCrypto.maxConfirmBlocks;
    const interval = setInterval(() => {
      setCryptoConfirmStep(prev => {
        if (prev >= maxSteps) {
          clearInterval(interval);
          return maxSteps;
        }
        return prev + Math.ceil(maxSteps / 3);
      });
    }, 450);

    setTimeout(() => {
      clearInterval(interval);
      setIsVerifyingCrypto(false);
      setCryptoConfirmStep(0);
      const generatedTxId = txIdInput.trim() || '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const fullNetworkLabel = `${selectedCrypto.symbol} (${selectedCrypto.networkCode})`;
      submitDepositRequest(num, fullNetworkLabel, generatedTxId);
      
      setCryptoSuccessNotice({ 
        amount: num, 
        txId: generatedTxId,
        cryptoName: selectedCrypto.name,
        symbol: selectedCrypto.symbol
      });
      setTxIdInput('');
    }, 1800);
  };

  const presetsUsd = [25, 50, 100, 250, 500, 1000];

  // -------------------------------------------------------------
  // RENDER VIEW 1: LOADING PAGE WHEN CLICKING BANK TRANSFER
  // -------------------------------------------------------------
  if (activeChannel === 'loading_bank') {
    return (
      <div className="min-h-screen bg-[#070A0F] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 relative mb-4 animate-pulse">
          <Building2 className="w-10 h-10" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#070A0F] flex items-center justify-center">
            <Lock className="w-3 h-3 text-slate-950 stroke-[3]" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-white">Loading Settlement Account...</h2>
        <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          Retrieving authorized <strong className="text-amber-400">Company Staff Management Account</strong> for secure local bank deposit.
        </p>
        <div className="flex items-center gap-2 mt-5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Securing Dedicated Banking Session...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER VIEW: PENDING DEPOSIT IN PROGRESS
  // If user has a pending deposit, they CANNOT make another deposit!
  // Displays active transaction details, proof image, SLA, and lock notification.
  // -------------------------------------------------------------
  const activePending = userPendingDeposit || (submittedDepositDetails ? {
    id: 'dep_active',
    userId: currentUser?.id || '',
    userName: currentUser?.name || '',
    userEmail: currentUser?.email || '',
    userPhone: currentUser?.phoneNumber,
    amount: submittedDepositDetails.usd,
    ngnAmount: submittedDepositDetails.ngn,
    depositType: 'bank_transfer' as const,
    network: `Bank Transfer (${submittedDepositDetails.bankName})`,
    txHash: submittedDepositDetails.ref,
    proofImageUrl: submittedDepositDetails.proofUrl,
    proofFileName: 'payment_receipt.jpg',
    staffAccountDetails: {
      bankName: submittedDepositDetails.bankName,
      accountNumber: submittedDepositDetails.accountNumber,
      accountName: staffAccount.accountName
    },
    status: 'pending_review' as const,
    timestamp: new Date().toISOString()
  } : null);

  if ((hasPendingDeposit || activeChannel === 'bank_submitted') && activePending) {
    const isBank = activePending.depositType === 'bank_transfer' || !!activePending.ngnAmount;
    const ngnDisplay = activePending.ngnAmount || Math.round(activePending.amount * exchangeRate);

    return (
      <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
        <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Deposit Status</h1>
              <p className="text-[11px] text-amber-400">Pending Admin Approval</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Balance</span>
            <span className="font-mono font-bold text-sm text-amber-400">
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Active Pending Deposit Lock Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-[#121824] border border-amber-400/40 space-y-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-amber-300">Active Deposit Pending — New Deposits Locked</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You already have a pending deposit awaiting admin review and approval. You cannot make another deposit until your current deposit is approved or resolved.
            </p>
          </div>

          {/* Status Hero Card */}
          <div className="p-5 rounded-3xl bg-[#121824] border border-amber-400/50 text-center space-y-3.5 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-amber-400/15 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto relative">
              <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#121824] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                PAYMENT SUBMITTED • AWAITING APPROVAL
              </span>
              <h2 className="text-lg font-black text-white">Deposit Waiting for Approval</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                {isBank 
                  ? 'Your payment proof has been uploaded. Management is verifying your payment against the company staff management account. Your trading balance will be credited automatically once approved.'
                  : 'Your deposit has been broadcast on the blockchain. Management is confirming block verification. Your trading balance will be credited automatically once approved.'}
              </p>
            </div>

            {/* Amount Box */}
            <div className={`p-3 bg-[#0B0F17] rounded-2xl border border-slate-800 ${isBank ? 'grid grid-cols-2 divide-x divide-slate-800/80 text-center' : 'text-center'}`}>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Credited to Balance</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  ${activePending.amount.toFixed(2)} USD
                </span>
              </div>
              {isBank && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Transferred in Naira</span>
                  <span className="text-base font-black font-mono text-amber-400">
                    ₦{ngnDisplay.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Details Breakdown */}
            <div className="p-3 bg-[#0B0F17] rounded-2xl border border-slate-800/80 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Method</span>
                <span className="text-white font-bold">
                  {isBank ? '🇳🇬 Local Bank Transfer' : `🪙 Crypto (${activePending.network})`}
                </span>
              </div>
              {isBank && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target Staff Bank</span>
                    <span className="text-white font-bold">{activePending.staffAccountDetails?.bankName || staffAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account Number</span>
                    <span className="font-mono text-amber-400 font-bold">{activePending.staffAccountDetails?.accountNumber || staffAccount.accountNumber}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{isBank ? 'Deposit Reference' : 'Transaction Hash'}</span>
                <span className="font-mono text-slate-300 truncate max-w-[180px]">{activePending.txHash}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Review SLA</span>
                <span className="text-emerald-400 font-bold">5 - 15 minutes</span>
              </div>
            </div>

            {/* Receipt Preview Thumbnail if uploaded */}
            {activePending.proofImageUrl && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 px-1">
                  <span>Uploaded Payment Receipt:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                </div>
                <div 
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-full h-24 bg-black/40 border border-slate-800 rounded-xl overflow-hidden cursor-pointer relative group flex items-center justify-center"
                >
                  <img 
                    src={activePending.proofImageUrl} 
                    alt="Uploaded receipt" 
                    className="w-full h-full object-contain p-1 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-white font-bold transition-opacity">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Click to Enlarge</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lock Notice */}
            <div className="p-3 bg-[#0B0F17] border border-amber-400/25 rounded-2xl text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Cannot Make Another Deposit</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                You cannot make another deposit while this deposit is awaiting approval. Once approved by management, your balance will be credited and you can make new deposits.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={onGoToTrade}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <span>Go to Trading Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Full Receipt Preview */}
        {previewModalOpen && activePending.proofImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="relative max-w-sm w-full bg-[#121824] border border-amber-400/40 rounded-2xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Uploaded Payment Proof
                </span>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded-xl bg-black/60 flex items-center justify-center p-2">
                <img 
                  src={activePending.proofImageUrl} 
                  alt="Receipt Preview" 
                  className="max-w-full max-h-[55vh] object-contain rounded-lg"
                />
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER VIEW 2: METHOD SELECTION (For Nigerian Users)
  // -------------------------------------------------------------
  if (activeChannel === 'select_channel') {
    return (
      <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
        {/* Header Bar */}
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
              <h1 className="text-base font-bold text-white leading-tight">Funds Wallet</h1>
              <p className="text-[11px] text-slate-400">Choose Deposit Method</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Balance</span>
            <span className="font-mono font-bold text-sm text-amber-400">
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Welcome User Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#121926] via-[#101724] to-[#141d2e] border border-amber-400/30 space-y-1 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-base">🇳🇬</span>
              <span className="text-xs font-bold text-white">Registered Nigeria Account</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Welcome, <strong className="text-amber-400">{currentUser?.name}</strong>. Select whether you want to deposit via direct local Bank Transfer or multi-chain Cryptocurrency.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Available Deposit Channels
            </span>

            {/* CHANNEL 1: BANK TRANSFER */}
            {isNairaConfigured ? (
              <button
                type="button"
                onClick={handleSelectBankTransfer}
                className="w-full text-left p-4 rounded-2xl bg-[#121824] border-2 border-emerald-500/40 hover:border-emerald-400 active:scale-[0.99] transition-all cursor-pointer shadow-lg group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          Bank Transfer
                        </h3>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          INSTANT NGN
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">
                        Pay into company staff management account from OPay, PalmPay, Kuda, Moniepoint, or any Nigerian bank.
                      </p>
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] font-mono text-slate-400">
                        <span>Rate: <strong className="text-amber-400">₦{exchangeRate.toLocaleString()}/$</strong></span>
                        <span>•</span>
                        <span>Zero Fee</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">Fast Approval</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-800/80 group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all shrink-0 mt-2">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ) : (
              <div
                className="w-full text-left p-4 rounded-2xl bg-[#0F141D] border border-slate-800/80 relative overflow-hidden opacity-85"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-300">
                          Bank Transfer (NGN)
                        </h3>
                        <span className="text-[10px] bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          PENDING ADMIN SETUP
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">
                        Settlement account details have not been set by administrator yet. Please use Crypto Deposit below.
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-amber-400/80">
                        <span>• Payment details will appear once admin sets account</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHANNEL 2: CRYPTO */}
            <button
              type="button"
              onClick={() => setActiveChannel('crypto')}
              className="w-full text-left p-4 rounded-2xl bg-[#121824] border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer shadow-md group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        Crypto Deposit
                      </h3>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
                        MULTI-CHAIN
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Deposit directly using USDT (TRC-20, ERC-20), Bitcoin (BTC), Ethereum (ETH), Solana (SOL), BNB, or TRON.
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      {['BTC', 'ETH', 'USDT', 'SOL', 'BNB'].map(sym => (
                        <span key={sym} className="text-[9px] font-mono px-1.5 py-0.5 bg-[#0B0F17] rounded text-slate-300 border border-slate-800">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-800/80 group-hover:bg-amber-400 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all shrink-0 mt-2">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>

          {/* Institutional Security Notice */}
          <div className="p-3 bg-[#121824] border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>All deposits are protected by 256-bit bank encryption and verified on the institutional ledger.</span>
          </div>
        </div>
      </div>
    );
  }



  // -------------------------------------------------------------
  // RENDER VIEW 4: BANK TRANSFER SETTLEMENT PAGE (Company Staff Account)
  // -------------------------------------------------------------
  if (activeChannel === 'bank_transfer') {
    if (!isNairaConfigured) {
      return (
        <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
          <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveChannel('select_channel')}
                className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                aria-label="Back to Channels"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Bank Transfer</h1>
                <p className="text-[11px] text-amber-400">Account Not Configured</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Balance</span>
              <span className="font-mono font-bold text-sm text-amber-400">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto p-4 space-y-4">
            <div className="p-6 bg-[#121824] border border-amber-400/30 rounded-2xl text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full inline-block mb-2">
                  PENDING ADMIN SETUP
                </span>
                <h3 className="text-base font-bold text-white">Naira Payment Account Not Set</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The company staff management account details have not yet been configured by the platform administrator. Direct bank transfer is temporarily unavailable until the administrator updates the account in the Admin Dashboard.
                </p>
              </div>

              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>How to deposit right now:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                  You can deposit immediately using our multi-chain <strong>Crypto Deposit</strong> (USDT, BTC, ETH, SOL, BNB, TRX), or wait until management sets the local settlement account.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveChannel('crypto')}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <Coins className="w-4 h-4" />
                  <span>Deposit via Crypto Instead</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveChannel('select_channel')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Back to Deposit Channels
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveChannel('select_channel')}
              className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              aria-label="Back to Channels"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Company Staff Account</h1>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Direct Bank Transfer
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Balance</span>
            <span className="font-mono font-bold text-sm text-amber-400">
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* STEP 1: Enter USD and view Converted NGN */}
          <div className="p-4 bg-[#121824] border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center">1</span>
                Enter Deposit Amount
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                1 USD = <strong className="text-amber-400 font-bold">₦{exchangeRate.toLocaleString()}</strong>
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2">
              {presetsUsd.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBankAmountUsd(amt.toString())}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    bankAmountUsd === amt.toString()
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                      : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ${amt} USD
                </button>
              ))}
            </div>

            {/* Input in USD */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                min="5"
                step="1"
                required
                value={bankAmountUsd}
                onChange={(e) => setBankAmountUsd(e.target.value)}
                className="w-full pl-8 pr-16 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                placeholder="100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                USD
              </span>
            </div>

            {/* Exact Naira to Transfer Card */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-300/80 uppercase font-semibold block tracking-wider">
                  Exact Amount to Transfer
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ₦{calculatedNgn.toLocaleString()} NGN
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyNgn}
                className="py-1 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedNgnAmount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNgnAmount ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* STEP 2: Company Staff Management Account Box */}
          <div className="p-4 bg-gradient-to-b from-[#141E2C] to-[#121824] border-2 border-amber-400/50 rounded-2xl space-y-3.5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center">2</span>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Company Staff Management Account
                  </h3>
                  <p className="text-[10px] text-slate-400">Pay directly into this official account</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                VERIFIED
              </span>
            </div>

            {/* Bank Name */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Bank Name</span>
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                {staffAccount.bankName}
              </span>
            </div>

            {/* Account Number with prominent Copy Button */}
            <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Account Number (NUBAN)
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-wider">
                  {staffAccount.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyBank}
                  className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  {copiedBankAcc ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{copiedBankAcc ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Account Beneficiary Name */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-400">Beneficiary Name</span>
              <span className="font-mono font-bold text-slate-100 text-right truncate max-w-[200px]">
                {staffAccount.accountName}
              </span>
            </div>

            {/* Payment Narration / Reference */}
            <div className="p-2.5 bg-[#0B0F17]/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Payment Narration / Reference</span>
                <span className="font-mono font-bold text-amber-300">{userNarrationRef}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyNarration}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedNarration ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNarration ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Admin instructions note */}
            {staffAccount.paymentInstructions && (
              <p className="text-[11px] text-amber-200/90 bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/20 leading-relaxed">
                ℹ️ {staffAccount.paymentInstructions}
              </p>
            )}
          </div>

          {/* STEP 3: Upload Payment Receipt Form */}
          <form onSubmit={handleSubmitBankTransfer} className="p-4 bg-[#121824] border border-slate-800 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center">3</span>
                Upload Payment & Submit
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Receipt Verification</span>
            </div>

            {/* Sender Bank selection */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Your Bank / App</label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="OPay">OPay</option>
                  <option value="PalmPay">PalmPay</option>
                  <option value="Kuda Bank">Kuda Bank</option>
                  <option value="Moniepoint">Moniepoint</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="GTBank">Guaranty Trust Bank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="United Bank for Africa">UBA</option>
                  <option value="First Bank">First Bank</option>
                  <option value="Paga">Paga</option>
                  <option value="Other Bank">Other Local Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sender Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Your account name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Transaction Reference / Session ID */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Transaction Reference / Session ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 0902672409... or leave blank"
                value={bankTxRef}
                onChange={(e) => setBankTxRef(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Receipt Upload Dropzone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">Upload Payment Proof (Receipt / Screenshot)</span>
                <span className="text-[10px] text-amber-400 font-medium">Required for Approval</span>
              </div>

              {proofImage ? (
                <div className="p-3 bg-[#0B0F17] border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-slate-800">
                      <img src={proofImage} alt="Receipt" className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">{proofFileName || 'receipt.jpg'}</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Ready to Submit
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProofImage(null);
                      setProofFileName('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Remove and select another file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-700/80 hover:border-amber-400/60 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#0B0F17]">
                  <Upload className="w-6 h-6 text-amber-400" />
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-200 block">Click to Select Payment Screenshot / Receipt</span>
                    <span className="text-[10px] text-slate-500 block">Supports JPG, PNG, WEBP or PDF</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {bankUploadError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{bankUploadError}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingBank}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmittingBank ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting Payment Proof...
                </span>
              ) : (
                <>
                  <span>Upload Payment & Wait for Approval</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Switch Channel Quick Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setActiveChannel('crypto')}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Prefer to pay with crypto?</span>
              <strong className="text-amber-400">Switch to Crypto Deposit →</strong>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER VIEW 5: CRYPTO DEPOSIT GATEWAY
  // -------------------------------------------------------------
  const cryptoQty = (parseFloat(cryptoAmount) || 0) / selectedCrypto.rateUsd;

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isNigeriaUser) {
                setActiveChannel('select_channel');
              } else {
                onBack();
              }
            }}
            className="p-1.5 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Back"
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
        {/* If Nigerian user and Naira account is configured by admin, show button to switch to Bank Transfer */}
        {isNigeriaUser && isNairaConfigured && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🇳🇬</span>
              <span className="text-xs text-emerald-300 font-bold">Nigeria Local Bank Transfer Available</span>
            </div>
            <button
              onClick={handleSelectBankTransfer}
              className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Pay via Bank
            </button>
          </div>
        )}

        {/* Success Modal / Review Notice */}
        {cryptoSuccessNotice && (
          <div className="p-4 rounded-2xl bg-[#121824] border border-amber-400/40 text-white space-y-2.5 animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-400">Deposit Submitted - Under Review</h4>
                <p className="text-xs text-slate-300 leading-snug">
                  Your transfer of <strong className="text-white font-mono">${cryptoSuccessNotice.amount.toFixed(2)} USD ({cryptoSuccessNotice.cryptoName})</strong> has been broadcast on the blockchain. Node confirmations are being reviewed. Your balance will credit automatically upon approval.
                </p>
              </div>
            </div>
            <div className="p-2 bg-black/50 rounded-xl font-mono text-[10px] text-slate-400 truncate">
              TxHash: {cryptoSuccessNotice.txId}
            </div>
            {/* Locked Deposit Notice */}
            <div className="p-2.5 bg-black/40 border border-amber-400/20 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Additional deposits are disabled while this deposit is awaiting approval.</span>
            </div>

            <div className="pt-1">
              <button
                onClick={onGoToTrade}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <span>Go to Markets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Cryptocurrency Selector - Horizontal Scrolling List */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Select Deposit Cryptocurrency</span>
            <span className="text-[10px] text-slate-400">{CRYPTO_OPTIONS.length} Supported Chains</span>
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
            {CRYPTO_OPTIONS.map(crypto => {
              const isSelected = crypto.id === selectedCryptoId;
              return (
                <button
                  key={crypto.id}
                  onClick={() => {
                    setSelectedCryptoId(crypto.id);
                    setCryptoAmount(crypto.minDeposit > parseFloat(cryptoAmount) ? crypto.minDeposit.toString() : cryptoAmount);
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

          {/* QR Code Display */}
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
                {activeCryptoAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyCrypto}
                className="py-1 px-2.5 hover:opacity-90 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                style={{ backgroundColor: selectedCrypto.color }}
              >
                {copiedCrypto ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCrypto ? 'Copied' : 'Copy'}</span>
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
        <form onSubmit={handleConfirmCryptoDeposit} className="p-4 bg-[#121824] border border-slate-800 rounded-2xl space-y-3.5">
          <span className="text-xs font-bold text-slate-300 block">
            Deposit Amount & Payment Confirmation
          </span>

          <div className="grid grid-cols-3 gap-2">
            {presetsUsd.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setCryptoAmount(amt.toString())}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  cryptoAmount === amt.toString()
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-[#0B0F17] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                ${amt} USD
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                min={selectedCrypto.minDeposit}
                step="1"
                required
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                className="w-full pl-8 pr-28 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                placeholder="100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                USD
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 font-mono">
              <span>Crypto Amount:</span>
              <span className="text-white font-bold">
                ≈ {cryptoQty < 0.01 ? cryptoQty.toFixed(6) : cryptoQty.toFixed(4)} {selectedCrypto.symbol}
              </span>
            </div>
          </div>

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

          {isVerifyingCrypto && (
            <div className="p-3 bg-black/50 border border-amber-400/40 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Broadcasting {selectedCrypto.symbol} Transfer...
                </span>
                <span className="font-mono text-white font-bold">{cryptoConfirmStep}/{selectedCrypto.maxConfirmBlocks} Confirmations</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (cryptoConfirmStep / selectedCrypto.maxConfirmBlocks) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifyingCrypto}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isVerifyingCrypto ? (
              <span>Verifying {selectedCrypto.symbol} Transfer...</span>
            ) : (
              <>
                <span>I Have Transferred ${cryptoAmount} USD ({selectedCrypto.symbol})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-[#121824] border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Cold storage protected gateway. Ensure you transfer strictly on the <strong>{selectedCrypto.networkName}</strong> network.</span>
        </div>
      </div>
    </div>
  );
};
