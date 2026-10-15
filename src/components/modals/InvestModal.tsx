import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Wallet, 
  Plus, 
  AlertCircle, 
  Check, 
  Zap, 
  ChevronRight, 
  RefreshCw,
  Percent,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INVESTMENT_PLANS } from '../../data/investmentPlans';
import { InvestmentPlan, UserInvestment } from '../../types';
import { AssetIcon } from '../AssetIcon';
import { formatCurrency } from '../../data/marketData';
import { playAlertChime } from '../../utils/notificationUtils';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
}

export const InvestModal: React.FC<InvestModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit
}) => {
  const { 
    currentUser, 
    investments, 
    createInvestment, 
    claimInvestmentEarnings, 
    settleDailyYield, 
    cancelOrRedeemInvestment 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'plans' | 'my_investments'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentBalance = currentUser?.balance || 0;
  const activeInvestments = investments.filter(i => i.status === 'active');
  const totalInvested = activeInvestments.reduce((acc, i) => acc + i.investedAmount, 0);
  const totalAccruedUnclaimed = activeInvestments.reduce((acc, i) => acc + i.accruedEarnings, 0);
  const totalLifetimeClaimed = investments.reduce((acc, i) => acc + i.claimedEarnings, 0);

  const numInvestAmount = parseFloat(investAmount) || 0;
  const dailyReturn = selectedPlan ? ((numInvestAmount * (selectedPlan.apyPercent / 100)) / 365) : 0;
  const totalEstProfit = selectedPlan ? (dailyReturn * selectedPlan.durationDays) : 0;
  const totalEstReturn = numInvestAmount + totalEstProfit;

  const handleSelectPlan = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setInvestAmount(Math.min(currentBalance > 0 ? currentBalance : plan.minInvestment, 100).toString());
    setFeedback(null);
  };

  const handlePresetPercentage = (pct: number) => {
    if (!currentBalance || currentBalance <= 0) {
      setInvestAmount('0');
      return;
    }
    const val = (currentBalance * pct).toFixed(2);
    setInvestAmount(val);
  };

  const handlePresetAmount = (val: number) => {
    setInvestAmount(val.toString());
  };

  const handleConfirmInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedPlan) return;
    if (numInvestAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid investment amount.' });
      return;
    }
    if (numInvestAmount < selectedPlan.minInvestment) {
      setFeedback({ 
        type: 'error', 
        message: `Minimum required investment for ${selectedPlan.name} is $${selectedPlan.minInvestment}.` 
      });
      return;
    }
    if (numInvestAmount > currentBalance) {
      setFeedback({ 
        type: 'error', 
        message: `Insufficient dashboard balance ($${currentBalance.toFixed(2)}). Please deposit funds to invest.` 
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = createInvestment(selectedPlan.id, numInvestAmount);
      setIsSubmitting(false);

      if (res.success) {
        playAlertChime();
        setFeedback({ type: 'success', message: res.message });
        setInvestAmount('');
        // Switch to my investments tab after a moment to show their active position
        setTimeout(() => {
          setSelectedPlan(null);
          setActiveTab('my_investments');
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }, 400);
  };

  const handleClaimAll = () => {
    const res = claimInvestmentEarnings();
    if (res.success) {
      playAlertChime();
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleClaimSingle = (invId: string) => {
    const res = claimInvestmentEarnings(invId);
    if (res.success) {
      playAlertChime();
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSettleDay = (invId: string) => {
    const res = settleDailyYield(invId);
    if (res.success) {
      playAlertChime();
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0F1521] border border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#121927] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">Crypto Invest & Earn</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Instant Payout
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Invest with your dashboard balance & receive earnings directly back
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance & Yield Summary Banner */}
        <div className="px-4 py-3 bg-[#0B0F17] border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
          {/* Available to Invest */}
          <div className="bg-[#141B27] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Dashboard Balance</span>
            <span className="font-mono font-extrabold text-white text-sm sm:text-base">
              ${currentBalance.toFixed(2)}
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-semibold mt-1"
            >
              <Plus className="w-2.5 h-2.5" /> Deposit Funds
            </button>
          </div>

          {/* Active Staked Principal */}
          <div className="bg-[#141B27] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Invested</span>
            <span className="font-mono font-extrabold text-white text-sm sm:text-base">
              ${totalInvested.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {activeInvestments.length} active position{activeInvestments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Unclaimed Accrued Yield */}
          <div className="bg-[#141B27] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Unclaimed Yield</span>
            <span className="font-mono font-extrabold text-emerald-400 text-sm sm:text-base animate-pulse">
              +${totalAccruedUnclaimed.toFixed(2)}
            </span>
            {totalAccruedUnclaimed > 0 ? (
              <button
                onClick={handleClaimAll}
                className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1 mt-1 cursor-pointer"
              >
                Claim to Balance →
              </button>
            ) : (
              <span className="text-[10px] text-slate-500 block mt-1">Accruing live</span>
            )}
          </div>

          {/* Total Claimed Lifetime */}
          <div className="bg-[#141B27] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Delivered to Balance</span>
            <span className="font-mono font-extrabold text-amber-400 text-sm sm:text-base">
              +${totalLifetimeClaimed.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Paid to account</span>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedback && (
          <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between shrink-0 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 flex gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('plans');
              setSelectedPlan(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${
              activeTab === 'plans'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-[#141B27] text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            Crypto Earn Vaults ({INVESTMENT_PLANS.length})
          </button>
          <button
            onClick={() => setActiveTab('my_investments')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${
              activeTab === 'my_investments'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-[#141B27] text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            My Active Investments ({activeInvestments.length})
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {activeTab === 'plans' && !selectedPlan && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Select a crypto vault to deposit your dashboard balance</span>
                <span className="font-semibold text-emerald-400">Guaranteed Return</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INVESTMENT_PLANS.map(plan => {
                  return (
                    <div
                      key={plan.id}
                      className="p-4 rounded-2xl bg-[#141B27] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                      <div>
                        {/* Top plan header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <AssetIcon iconType={plan.iconType} symbol={plan.cryptoSymbol} size="sm" />
                            <div>
                              <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                                {plan.name}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {plan.cryptoSymbol} · {plan.durationDays} Days Lock
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full shrink-0">
                            {plan.badge}
                          </span>
                        </div>

                        {/* APY highlight */}
                        <div className="mt-3.5 p-3 rounded-xl bg-[#0C111A] border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Estimated APY</span>
                            <span className="text-xl font-extrabold font-mono text-emerald-400">
                              {plan.apyPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Daily Return</span>
                            <span className="text-xs font-mono font-bold text-slate-200">
                              +{(plan.apyPercent / 365).toFixed(3)}% / day
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                          {plan.description}
                        </p>

                        <div className="mt-2.5 space-y-1">
                          {plan.highlights.slice(0, 2).map((h, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom action button */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Min: <strong className="text-white">${plan.minInvestment}</strong>
                        </span>

                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <span>Invest Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Investment Execution Screen (When a plan is selected) */}
          {activeTab === 'plans' && selectedPlan && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
              >
                ← Back to All Plans
              </button>

              <form onSubmit={handleConfirmInvestment} className="space-y-4 bg-[#141B27] border border-slate-800 rounded-2xl p-4 sm:p-5">
                {/* Plan header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <AssetIcon iconType={selectedPlan.iconType} symbol={selectedPlan.cryptoSymbol} size="md" />
                    <div>
                      <h3 className="font-extrabold text-white text-base">{selectedPlan.name}</h3>
                      <p className="text-xs text-slate-400">{selectedPlan.cryptoName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-emerald-400 block">
                      {selectedPlan.apyPercent}% APY
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {selectedPlan.durationDays} Days Term
                    </span>
                  </div>
                </div>

                {/* Balance & Source of funds */}
                <div className="p-3 bg-[#0C111A] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[11px] text-slate-400 block">Available Dashboard Balance</span>
                      <span className="font-mono font-bold text-white text-sm">
                        ${currentBalance.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="py-1 px-2.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Deposit
                  </button>
                </div>

                {/* Amount input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Amount to Invest ($ USD)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Min: ${selectedPlan.minInvestment} · Max: ${selectedPlan.maxInvestment.toLocaleString()}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-base">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={selectedPlan.minInvestment}
                      max={selectedPlan.maxInvestment}
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder={selectedPlan.minInvestment.toString()}
                      className="w-full pl-8 pr-16 py-3 bg-[#0B0F17] border border-slate-700/80 rounded-xl text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => handlePresetPercentage(1)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition-colors"
                    >
                      MAX
                    </button>
                  </div>

                  {/* Percentage Presets */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[0.25, 0.50, 0.75, 1.0].map((pct, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetPercentage(pct)}
                        className="py-1.5 rounded-lg bg-[#0E1522] hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>

                  {/* High Value Quick Amounts (matching user request for $1k, $3k, $5k) */}
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[100, 500, 1000, 3000, 5000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePresetAmount(val)}
                        className={`py-1 rounded-lg border text-[10px] font-mono font-semibold transition-colors ${
                          numInvestAmount === val 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-[#0E1522] text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        ${val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-Time Return Calculations */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#0C121D] to-[#111A29] border border-emerald-500/25 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> Daily Estimated Return:
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +${dailyReturn.toFixed(2)} USD / day
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Total Net Yield ({selectedPlan.durationDays} Days):
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +${totalEstProfit.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-300 font-semibold">Total Payout at Maturity:</span>
                    <span className="font-mono font-extrabold text-white text-base">
                      ${totalEstReturn.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="pt-1 text-[11px] text-emerald-300/80 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Earnings will be delivered straight to your dashboard balance.</span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || numInvestAmount <= 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <span>Confirm Investment of ${numInvestAmount > 0 ? numInvestAmount.toFixed(2) : '0.00'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* My Active Investments Tab */}
          {activeTab === 'my_investments' && (
            <div className="space-y-3">
              {activeInvestments.length === 0 ? (
                <div className="py-12 px-4 rounded-2xl bg-[#141B27] border border-slate-800 text-center space-y-3">
                  <Coins className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Active Crypto Investments</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Start an investment in the Crypto Earn Vaults tab to earn daily returns delivered straight to your dashboard balance.
                  </p>
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="py-2.5 px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <span>Explore Crypto Vaults</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Quick Action: Claim All */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-300 font-bold block">
                        Unclaimed Yield Available: +${totalAccruedUnclaimed.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Deliver all uncollected profits straight to your dashboard balance
                      </p>
                    </div>

                    <button
                      onClick={handleClaimAll}
                      disabled={totalAccruedUnclaimed <= 0}
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim to Balance</span>
                    </button>
                  </div>

                  {/* List of active investments */}
                  {activeInvestments.map(inv => {
                    const elapsedMs = Math.max(0, Date.now() - new Date(inv.startDate).getTime());
                    const totalDurationMs = new Date(inv.endDate).getTime() - new Date(inv.startDate).getTime();
                    const progressPercent = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));

                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-[#141B27] border border-slate-800 space-y-3 shadow-sm"
                      >
                        {/* Title and stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 font-mono">
                              {inv.cryptoSymbol}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{inv.planName}</h4>
                              <span className="text-[10px] text-slate-400">
                                {inv.durationDays} Days · {inv.apyPercent}% APY
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            Active & Earning
                          </span>
                        </div>

                        {/* Financial metrics */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#0C111A] border border-slate-800/80 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Invested Principal</span>
                            <span className="font-mono font-bold text-white">
                              ${inv.investedAmount.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Daily Yield</span>
                            <span className="font-mono font-bold text-emerald-400">
                              +${inv.dailyProfitAmount.toFixed(2)}/day
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Accrued Unclaimed</span>
                            <span className="font-mono font-bold text-emerald-300 animate-pulse">
                              +${inv.accruedEarnings.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Lock Term Progress</span>
                            <span>{progressPercent}% Complete</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {/* Settle 1-day yield instant test button */}
                            <button
                              onClick={() => handleSettleDay(inv.id)}
                              className="py-1.5 px-2.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Advance 1 daily yield payment directly to your dashboard balance"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Settle 1-Day Yield</span>
                            </button>

                            {/* Claim Accrued */}
                            <button
                              onClick={() => handleClaimSingle(inv.id)}
                              disabled={inv.accruedEarnings <= 0}
                              className="py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Claim (+${inv.accruedEarnings.toFixed(2)})</span>
                            </button>
                          </div>

                          {/* Redeem / End */}
                          <button
                            onClick={() => cancelOrRedeemInvestment(inv.id)}
                            className="text-[11px] text-slate-400 hover:text-rose-400 font-medium transition-colors"
                          >
                            Redeem Early
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
