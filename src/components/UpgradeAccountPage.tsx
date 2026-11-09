import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Building2,
  Upload,
  ArrowRight,
  Sparkles,
  Zap,
  Image as ImageIcon,
  X,
  FileCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UpgradeAccountPageProps {
  onBack: () => void;
  onSuccessReturn: () => void;
}

export interface UpgradeTier {
  level: number;
  title: string;
  priceNgn: number;
  priceFormatted: string;
  badge: string;
  perks: string[];
  popular?: boolean;
}

export const UPGRADE_TIERS: UpgradeTier[] = [
  {
    level: 2,
    title: 'Level 2 Tier',
    priceNgn: 17350,
    priceFormatted: '₦17,350',
    badge: 'Required for Payouts',
    popular: true,
    perks: [
      'Unlocks instant withdrawal clearance & NIP queue release',
      'Daily payout limit increased to ₦2,500,000 NGN',
      'Dedicated compliance verification badge'
    ]
  },
  {
    level: 3,
    title: 'Level 3 Tier',
    priceNgn: 28000,
    priceFormatted: '₦28,000',
    badge: 'Pro Trader',
    perks: [
      'Zero-wait high priority settlement processing',
      'Daily payout limit increased to ₦7,500,000 NGN',
      'Direct order routing & VIP technical support'
    ]
  },
  {
    level: 4,
    title: 'Level 4 Tier',
    priceNgn: 42500,
    priceFormatted: '₦42,500',
    badge: 'Institutional Desk',
    perks: [
      'Unlimited daily withdrawal volume',
      'Lowest execution spread & zero transaction fees',
      'Direct account manager liaison'
    ]
  },
  {
    level: 5,
    title: 'Level 5 Tier',
    priceNgn: 89000,
    priceFormatted: '₦89,000',
    badge: 'Elite Partner',
    perks: [
      'Uncapped multi-channel instant liquidation',
      'Institutional treasury custody & personal broker desk',
      'Exclusive high-yield staking pools access'
    ]
  }
];

export const UpgradeAccountPage: React.FC<UpgradeAccountPageProps> = ({
  onBack,
  onSuccessReturn
}) => {
  const { currentUser, staffAccount, submitBankTransferDeposit } = useAuth();

  const [selectedLevel, setSelectedLevel] = useState<number>(2);
  const [proofFileName, setProofFileName] = useState('');
  const [proofFileSize, setProofFileSize] = useState<string>('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeTier = UPGRADE_TIERS.find(t => t.level === selectedLevel) || UPGRADE_TIERS[0];
  const exchangeRate = staffAccount?.exchangeRateNgn || 1630;
  const approxUsd = Math.round((activeTier.priceNgn / exchangeRate) * 100) / 100;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      // Format file size
      const sizeKb = Math.round(file.size / 1024);
      setProofFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreviewUrl(reader.result as string);
        setStatusMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setProofFileName('');
    setProofFileSize('');
    setProofPreviewUrl('');
  };

  const handleSubmitUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!proofPreviewUrl && !proofFileName) {
      setStatusMessage({
        type: 'error',
        text: 'Please click and upload your bank transfer payment receipt before submitting.'
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedRef = 'UPG-' + Math.floor(10000000 + Math.random() * 90000000);
      const res = submitBankTransferDeposit({
        amountUsd: approxUsd,
        amountNgn: activeTier.priceNgn,
        senderName: currentUser?.name || 'Verified Trader',
        senderBank: `Upgrade ${activeTier.title}`,
        referenceOrSessionId: generatedRef,
        proofImageUrl: proofPreviewUrl,
        proofFileName: proofFileName || 'payment_receipt.jpg'
      });

      setIsSubmitting(false);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Sticky Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Account Upgrade</h1>
            <p className="text-[11px] text-slate-400">Upgrade level to clear pending withdrawals</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-mono">Current Status</span>
          <span className="text-xs font-bold text-amber-400 font-mono">Level 1 (Basic)</span>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Important Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-[#141B27] to-[#111722] border border-amber-400/40 rounded-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Upgrade to Complete Withdrawal
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Your withdrawal is on pending verification. Make a transfer to the company account below, then click and upload your receipt to finalize your payout.
            </p>
          </div>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-6 bg-[#111722] border border-emerald-500/40 rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Payment Uploaded Successfully!</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                Your payment receipt for <strong className="text-emerald-400">{activeTier.title} ({activeTier.priceFormatted})</strong> has been received and queued for review.
              </p>
            </div>

            <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Level:</span>
                <span className="text-white font-bold">{activeTier.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-emerald-400 font-bold">{activeTier.priceFormatted} NGN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Proof Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Receipt Uploaded
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approval Time:</span>
                <span className="text-amber-400 font-bold">Est. 5-10 mins</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Once approved by admin, your account will be upgraded to {activeTier.title} and your pending bank withdrawal will be released.
            </p>

            <button
              onClick={onSuccessReturn}
              className="w-full py-3.5 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>Back to Withdrawal Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Select Upgrade Level Tier */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Select Upgrade Tier</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">4 tiers available</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {UPGRADE_TIERS.map(tier => {
                  const isSelected = selectedLevel === tier.level;
                  return (
                    <div
                      key={tier.level}
                      onClick={() => setSelectedLevel(tier.level)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 via-[#182030] to-[#121824] border-amber-400 shadow-md shadow-amber-400/10'
                          : 'bg-[#111722] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs sm:text-sm font-bold text-white">{tier.title}</h3>
                              {tier.badge && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  {tier.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {tier.perks[0]}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                            {tier.priceFormatted}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block">NGN</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Company Payment Account Information */}
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">2. Pay into Company Account</h3>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/25">
                  Exact Amount: {activeTier.priceFormatted}
                </span>
              </div>

              {staffAccount && staffAccount.isConfigured && staffAccount.bankName ? (
                <div className="space-y-2.5">
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Bank Name</span>
                      <span className="font-bold text-white">{staffAccount.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-amber-400 text-sm tracking-wider">
                          {staffAccount.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(staffAccount.accountNumber, 'acc')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                          title="Copy Account Number"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">Account Name</span>
                      <span className="font-semibold text-slate-200">{staffAccount.accountName}</span>
                    </div>
                  </div>

                  {copiedField && (
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold text-center animate-in fade-in">
                      Account number copied to clipboard!
                    </div>
                  )}

                  {staffAccount.paymentInstructions && (
                    <p className="text-[11px] text-slate-400 italic bg-[#0B0F17] p-2 rounded-lg border border-slate-800/80">
                      Note: {staffAccount.paymentInstructions}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-amber-300">Company Account Details Loading</p>
                  <p className="text-[11px] text-slate-400">
                    Payment accounts are synchronizing. Please refresh or check back shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Simple & Beautiful Click-and-Upload Payment Receipt */}
            <form onSubmit={handleSubmitUpgrade} className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Click and Upload Payment Receipt</span>
                </h3>
                <span className="text-[10px] text-slate-400">Quick upload</span>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    statusMessage.type === 'error'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Upload Zone */}
              <div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="upgrade-receipt-upload"
                />

                {!proofPreviewUrl ? (
                  /* Beautiful Clickable Upload Dropzone */
                  <label
                    htmlFor="upgrade-receipt-upload"
                    className="group w-full py-8 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/80 bg-[#0B0F17] hover:bg-slate-900/60 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-inner"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/10 group-hover:bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-lg shadow-amber-400/10">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      Click to upload payment receipt
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Supports JPG, PNG, or transfer screenshot from your bank app
                    </span>
                    <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                      Browse File / Gallery
                    </span>
                  </label>
                ) : (
                  /* Uploaded Receipt Preview Card */
                  <div className="p-3.5 bg-[#0B0F17] border border-emerald-500/35 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[180px]">
                              {proofFileName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                              Ready
                            </span>
                          </div>
                          {proofFileSize && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Size: {proofFileSize}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image Preview Thumbnail */}
                    {proofPreviewUrl.startsWith('data:image') && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-black/40 flex items-center justify-center">
                        <img
                          src={proofPreviewUrl}
                          alt="Transfer Receipt Proof"
                          className="max-h-44 w-auto object-contain rounded-lg"
                        />
                      </div>
                    )}

                    <label
                      htmlFor="upgrade-receipt-upload"
                      className="block text-center text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      Click to choose a different receipt
                    </label>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !proofFileName}
                className="w-full py-3.5 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>
                      {proofFileName
                        ? `Submit Payment & Upgrade (${activeTier.priceFormatted})`
                        : `Upload Receipt to Upgrade (${activeTier.priceFormatted})`}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
