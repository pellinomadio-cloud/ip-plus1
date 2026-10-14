import React, { useState } from 'react';
import { Crown, ChevronRight, ShieldCheck, Zap, Headphones, X, CheckCircle2 } from 'lucide-react';

export const TrustBanner: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#141B27] border border-slate-800/80 hover:border-slate-700/80 active:scale-[0.99] transition-all text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Gold crown inside badge */}
          <div className="w-10 h-10 rounded-xl bg-[#101520] border border-amber-400/30 flex items-center justify-center shrink-0 shadow-sm">
            <Crown className="w-5 h-5 text-[#F5BA31] fill-amber-400/20" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Trade with Confidence
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              <span>Fast execution</span>
              <span className="text-slate-600">•</span>
              <span>Secure funds</span>
              <span className="text-slate-600">•</span>
              <span>24/7 support</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
      </button>

      {/* Security & Trust Details Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121824] border border-slate-800 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Why Trade on IQ-PLUS</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800/80 flex gap-3 items-start">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">Sub-Millisecond Execution</h5>
                  <p className="text-slate-400 text-xs mt-0.5">Direct market routing with zero slippage guarantees on major currency pairs and crypto.</p>
                </div>
              </div>

              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800/80 flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">Tier-1 Segregated Funds</h5>
                  <p className="text-slate-400 text-xs mt-0.5">Your capital is held in custody with top-tier international banking partners and insured cold wallets.</p>
                </div>
              </div>

              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800/80 flex gap-3 items-start">
                <Headphones className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white">24/7 Institutional Support</h5>
                  <p className="text-slate-400 text-xs mt-0.5">Multilingual trading desk assistance available via instant chat and dedicated account managers.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm transition-colors"
            >
              Continue Trading
            </button>
          </div>
        </div>
      )}
    </>
  );
};
