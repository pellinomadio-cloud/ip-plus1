import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Building2,
  Upload,
  ArrowRight,
  Crown,
  X,
  FileCheck,
  Check,
  Gift
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
  dailyRewardUsd: number;
  badge: string;
  perks: string[];
  popular?: boolean;
}

export const UPGRADE_TIERS: UpgradeTier[] = [
  {
    level: 2,
    title: 'Level 2 Plan',
    priceNgn: 17350,
    priceFormatted: '₦17,350',
    dailyRewardUsd: 5.00,
    badge: 'Required for Withdrawal',
    popular: true,
    perks: [
      'Increases Daily Reward Claim to $5.00 / day',
      'Unlocks instant bank withdrawal approval',
      'Daily withdrawal limit up to ₦2,500,000'
    ]
  },
  {
    level: 3,
    title: 'Level 3 Plan',
    priceNgn: 28000,
    priceFormatted: '₦28,000',
    dailyRewardUsd: 10.00,
    badge: 'Fast Payout',
    perks: [
      'Increases Daily Reward Claim to $10.00 / day',
      'Priority fast bank payout processing',
      'Daily withdrawal limit up to ₦7,500,000'
    ]
  },
  {
    level: 4,
    title: 'Level 4 Plan',
    priceNgn: 42500,
    priceFormatted: '₦42,500',
    dailyRewardUsd: 20.00,
    badge: 'VIP Trader',
    perks: [
      'Increases Daily Reward Claim to $20.00 / day',
      'Unlimited daily withdrawal limit',
      'Zero withdrawal charges'
    ]
  },
  {
    level: 5,
    title: 'Level 5 Plan',
    priceNgn: 89000,
    priceFormatted: '₦89,000',
    dailyRewardUsd: 50.00,
    badge: 'Executive Partner',
    perks: [
      'Increases Daily Reward Claim to $50.00 / day',
      'Instant automatic bank payouts',
      'Full VIP executive benefits'
    ]
  }
];

export const UpgradeAccountPage: React.FC<UpgradeAccountPageProps> = ({
  onBack,
  onSuccessReturn
}) => {
  const { currentUser, staffAccount, submitBankTransferDeposit, currentAccountLevel, dailyRewardAmount } = useAuth();

  // Null means user is on Page 1 (Viewing all plans). Once they select a plan, it opens Page 2 (Payment & Upload).
  const [selectedTier, setSelectedTier] = useState<UpgradeTier | null>(null);
  const [proofFileName, setProofFileName] = useState('');
  const [proofFileSize, setProofFileSize] = useState<string>('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const exchangeRate = staffAccount?.exchangeRateNgn || 1630;

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
    if (!selectedTier) return;
    setStatusMessage(null);

    if (!proofPreviewUrl && !proofFileName) {
      setStatusMessage({
        type: 'error',
        text: 'Please upload your payment receipt before submitting.'
      });
      return;
    }

    const approxUsd = Math.round((selectedTier.priceNgn / exchangeRate) * 100) / 100;

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedRef = 'UPG-' + Math.floor(10000000 + Math.random() * 90000000);
      const res = submitBankTransferDeposit({
        amountUsd: approxUsd,
        amountNgn: selectedTier.priceNgn,
        senderName: currentUser?.name || 'Verified Trader',
        senderBank: `Upgrade ${selectedTier.title}`,
        referenceOrSessionId: generatedRef,
        proofImageUrl: proofPreviewUrl,
        proofFileName: proofFileName || 'payment_receipt.jpg',
        upgradeLevel: selectedTier.level
      });

      setIsSubmitting(false);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 600);
  };

  // ============================================================================
  // PAGE 1: ALL UPGRADE PLANS ONLY
  // ============================================================================
  if (!selectedTier) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
        {/* Top Header */}
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
              <h1 className="text-base font-bold text-white">Upgrade Plans</h1>
              <p className="text-xs text-slate-400">Select a plan to upgrade your account</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full block">
              Level {currentAccountLevel} (${dailyRewardAmount.toFixed(0)}/day)
            </span>
          </div>
        </div>

        {/* Plans List */}
        <div className="max-w-md mx-auto p-4 space-y-3.5">
          {UPGRADE_TIERS.map(tier => (
            <div
              key={tier.level}
              onClick={() => {
                setSelectedTier(tier);
                setStatusMessage(null);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                tier.popular
                  ? 'bg-gradient-to-br from-amber-500/15 via-[#141C2B] to-[#111722] border-amber-400/60 hover:border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'bg-[#111722] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white">{tier.title}</h3>
                      {tier.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">
                        Daily Reward: ${tier.dailyRewardUsd.toFixed(2)} / day
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-extrabold font-mono text-emerald-400 block">
                    {tier.priceFormatted}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                {tier.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-4 w-full py-2.5 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Select {tier.title} ({tier.priceFormatted})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // PAGE 2: MAKE PAYMENT & UPLOAD RECEIPT FOR SELECTED PLAN
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Top Header with Back to Plans */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedTier(null);
              setStatusMessage(null);
            }}
            className="p-2 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to Plans"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">{selectedTier.title} Payment</h1>
            <p className="text-xs text-slate-400">Pay and upload your receipt below</p>
          </div>
        </div>

        <span className="text-sm font-extrabold font-mono text-emerald-400">
          {selectedTier.priceFormatted}
        </span>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {isSuccess ? (
          /* Success Screen */
          <div className="p-6 bg-[#111722] border border-emerald-500/40 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Payment Uploaded!</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Your payment receipt for <strong className="text-emerald-400">{selectedTier.title} ({selectedTier.priceFormatted})</strong> has been submitted for approval.
              </p>
            </div>

            <div className="p-3.5 bg-[#0B0F17] rounded-xl border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="text-white font-bold">{selectedTier.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Daily Reward:</span>
                <span className="text-amber-400 font-bold font-mono">${selectedTier.dailyRewardUsd.toFixed(2)} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-emerald-400 font-bold font-mono">{selectedTier.priceFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-400 font-bold">Pending Approval</span>
              </div>
            </div>

            <button
              onClick={onSuccessReturn}
              className="w-full py-3.5 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Done</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Selected Plan Summary */}
            <div className="p-4 bg-[#141B27] border border-amber-400/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Selected Plan</span>
                <h2 className="text-base font-extrabold text-white mt-0.5">{selectedTier.title}</h2>
                <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                  Daily Reward: ${selectedTier.dailyRewardUsd.toFixed(2)} / day
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Amount to Pay</span>
                <span className="text-lg font-extrabold font-mono text-emerald-400">
                  {selectedTier.priceFormatted}
                </span>
              </div>
            </div>

            {/* Step 1: Company Bank Account */}
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">1. Pay into Company Account</h3>
              </div>

              {staffAccount && staffAccount.isConfigured && staffAccount.bankName ? (
                <div className="space-y-2.5">
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Bank Name</span>
                      <span className="font-bold text-white">{staffAccount.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60">
                      <span className="text-slate-400">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-amber-400 text-sm tracking-wider">
                          {staffAccount.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(staffAccount.accountNumber, 'acc')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60">
                      <span className="text-slate-400">Account Name</span>
                      <span className="font-semibold text-slate-200">{staffAccount.accountName}</span>
                    </div>
                  </div>

                  {copiedField && (
                    <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center">
                      Account number copied!
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-center">
                  <p className="text-xs font-bold text-amber-300">Company Bank Account Not Set Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Please contact admin or check back shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Upload Payment Receipt */}
            <form onSubmit={handleSubmitUpgrade} className="p-4 bg-[#111722] border border-slate-800 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white">2. Upload Payment Receipt</h3>
              </div>

              {statusMessage && (
                <div className="p-3 rounded-xl border bg-rose-500/15 border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="upgrade-receipt-upload"
                />

                {!proofPreviewUrl ? (
                  <label
                    htmlFor="upgrade-receipt-upload"
                    className="w-full py-8 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-[#0B0F17] flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center mb-2.5">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-white">
                      Tap here to upload payment receipt
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Select screenshot or photo of your transfer receipt
                    </span>
                  </label>
                ) : (
                  <div className="p-3.5 bg-[#0B0F17] border border-emerald-500/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate block max-w-[180px]">
                            {proofFileName}
                          </span>
                          {proofFileSize && (
                            <span className="text-[10px] text-slate-400 block">
                              {proofFileSize}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {proofPreviewUrl.startsWith('data:image') && (
                      <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48 bg-black/40 flex items-center justify-center">
                        <img
                          src={proofPreviewUrl}
                          alt="Payment Receipt"
                          className="max-h-44 w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !proofFileName}
                className="w-full py-3.5 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Payment Receipt</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
