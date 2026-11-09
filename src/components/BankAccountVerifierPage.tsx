import React from 'react';
import { ArrowLeft, ShieldCheck, ExternalLink, Code2, Server } from 'lucide-react';
import { BankAccountVerifier } from './BankAccountVerifier';
import { NigerianBank } from '../data/countries';

interface BankAccountVerifierPageProps {
  onBack: () => void;
  onSelectVerifiedAccount?: (accountName: string, bank: NigerianBank, accountNumber: string) => void;
}

export const BankAccountVerifierPage: React.FC<BankAccountVerifierPageProps> = ({
  onBack,
  onSelectVerifiedAccount
}) => {
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
            <h1 className="text-base font-bold text-white leading-tight">Bank Account Verification</h1>
            <p className="text-[11px] text-slate-400">Live NIP API Inquiry Engine</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-mono">Status</span>
          <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active</span>
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Verification Component */}
        <BankAccountVerifier
          onAccountVerified={onSelectVerifiedAccount}
          compactMode={false}
        />

        {/* Live API Documentation & Technical Specs */}
        <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>API Integration Specifications</span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>Endpoint:</span>
              <span className="text-amber-400 truncate max-w-[200px]">
                https://api.wtproject.space/vrf/verify.php
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Method:</span>
              <span className="text-emerald-400 font-bold">POST</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Content-Type:</span>
              <span className="text-slate-300">application/x-www-form-urlencoded</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Parameters:</span>
              <span className="text-slate-300">bank_code, account_number</span>
            </div>
          </div>
        </div>

        {/* Security & Reliability Card */}
        <div className="p-3.5 rounded-xl bg-[#111722] border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Verifications are executed in real-time directly through Nigerian Inter-Bank Settlement System (NIBSS) protocols.
          </span>
        </div>
      </div>
    </div>
  );
};
