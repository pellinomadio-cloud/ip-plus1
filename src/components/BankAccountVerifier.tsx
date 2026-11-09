import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { NIGERIAN_BANKS, NigerianBank } from '../data/countries';
import { verifyBankAccount, BankVerificationResult } from '../services/bankVerificationService';

interface BankAccountVerifierProps {
  onAccountVerified?: (accountName: string, bank: NigerianBank, accountNumber: string) => void;
  initialBank?: NigerianBank;
  initialAccountNumber?: string;
  compactMode?: boolean;
}

export const BankAccountVerifier: React.FC<BankAccountVerifierProps> = ({
  onAccountVerified,
  initialBank,
  initialAccountNumber = '',
  compactMode = false
}) => {
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(initialBank || NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>(initialAccountNumber);
  const [bankSearch, setBankSearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<BankVerificationResult | null>(null);
  const [copiedName, setCopiedName] = useState<boolean>(false);

  // Track the last verified combo to prevent duplicate triggers
  const lastVerifiedRef = useRef<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cleanAcc = accountNumber.replace(/\D/g, '');

  // Filter banks by search query (name, code, fintech/commercial)
  const filteredBanks = NIGERIAN_BANKS.filter(
    b =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.includes(bankSearch) ||
      b.type.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Automatic verification trigger once bank is selected & account number reaches 10 digits
  useEffect(() => {
    if (cleanAcc.length === 10 && selectedBank?.code) {
      const currentCombo = `${selectedBank.code}:${cleanAcc}`;
      // Prevent duplicate call if this exact combo was just verified or is currently verifying
      if (lastVerifiedRef.current === currentCombo && verificationResult) {
        return;
      }

      executeVerification(selectedBank, cleanAcc);
    } else {
      // Clear results if account number drops below 10 digits
      if (cleanAcc.length < 10) {
        setVerificationResult(null);
        lastVerifiedRef.current = '';
      }
    }
  }, [cleanAcc, selectedBank]);

  const executeVerification = async (bank: NigerianBank, accNum: string) => {
    if (isLoading) return; // Prevent duplicate requests while one is already running
    if (accNum.length !== 10 || !bank.code) return;

    const combo = `${bank.code}:${accNum}`;
    lastVerifiedRef.current = combo;
    setIsLoading(true);
    setVerificationResult(null);

    try {
      const result = await verifyBankAccount(bank.code, accNum);
      setIsLoading(false);
      setVerificationResult(result);

      if (result.success && result.accountName) {
        onAccountVerified?.(result.accountName, bank, accNum);
      }
    } catch (err: any) {
      setIsLoading(false);
      setVerificationResult({
        success: false,
        errorMessage: err.message || 'Error: Verification request failed'
      });
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const setTestPreset = (bankId: string, testAcc: string) => {
    const bank = NIGERIAN_BANKS.find(b => b.id === bankId) || NIGERIAN_BANKS[0];
    setSelectedBank(bank);
    setAccountNumber(testAcc);
  };

  return (
    <div className={`space-y-4 ${compactMode ? '' : 'p-5 bg-[#0D131F] border border-slate-800 rounded-3xl shadow-xl'}`}>
      {!compactMode && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Bank Account Verification</h3>
              <p className="text-[11px] text-slate-400">Live NIP API Inquiry Endpoint</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>API Online</span>
          </span>
        </div>
      )}

      {/* Popular Quick Select Pills */}
      <div>
        <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
          Quick Select Popular Banks
        </label>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {[
            { id: 'access', name: 'Access', code: '044', color: '#FF6200' },
            { id: 'gtbank', name: 'GTBank', code: '058', color: '#DD4F05' },
            { id: 'zenith', name: 'Zenith', code: '057', color: '#B22222' },
            { id: 'opay', name: 'OPay', code: '100004', color: '#00B875' },
            { id: 'palmpay', name: 'PalmPay', code: '100033', color: '#6B38FB' }
          ].map(quick => {
            const isSelected = selectedBank.id === quick.id;
            return (
              <button
                key={quick.id}
                type="button"
                onClick={() => {
                  const found = NIGERIAN_BANKS.find(b => b.id === quick.id);
                  if (found) setSelectedBank(found);
                }}
                className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                    : 'bg-[#111722] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: quick.color }}
                />
                <span className="truncate w-full">{quick.name}</span>
                <span className="text-[9px] font-mono text-slate-500">{quick.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Searchable Bank Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Select Destination Bank <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-full px-3.5 py-2.5 bg-[#111722] border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedBank.badgeColor }}
              />
              <span className="font-bold text-slate-100 truncate">{selectedBank.name}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Code: {selectedBank.code}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0D1424] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-slate-800 bg-[#0B0F1A]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search Nigerian commercial bank, fintech, or code..."
                      value={bankSearch}
                      onChange={e => setBankSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#141C2B] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 no-scrollbar">
                  {filteredBanks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching banks found for "{bankSearch}"
                    </div>
                  ) : (
                    filteredBanks.map(bank => {
                      const isSelected = selectedBank.id === bank.id;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => {
                            setSelectedBank(bank);
                            setIsDropdownOpen(false);
                            setBankSearch('');
                          }}
                          className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left cursor-pointer ${
                            isSelected ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: bank.badgeColor }}
                            />
                            <span className="truncate">{bank.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                            Code: <strong className="text-white">{bank.code}</strong>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. 10-Digit Account Number Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">
            10-Digit Account Number (NUBAN) <span className="text-rose-400">*</span>
          </label>
          <span className={`text-[11px] font-mono ${cleanAcc.length === 10 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            {cleanAcc.length}/10 digits
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            required
            placeholder="e.g. 0123456789"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            className={`w-full pl-3.5 pr-20 py-2.5 bg-[#111722] border rounded-xl text-base font-mono font-bold text-white placeholder-slate-600 tracking-wider focus:outline-none transition-colors ${
              verificationResult?.success
                ? 'border-emerald-500 focus:border-emerald-400'
                : verificationResult?.errorMessage
                ? 'border-rose-500/70 focus:border-rose-400'
                : 'border-slate-800 focus:border-emerald-400'
            }`}
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isLoading && (
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            )}
            {accountNumber && (
              <button
                type="button"
                onClick={() => {
                  setAccountNumber('');
                  setVerificationResult(null);
                  lastVerifiedRef.current = '';
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 px-1 py-0.5 rounded cursor-pointer"
                title="Clear"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Live Verification State Feedback */}
      {isLoading && (
        <div className="p-3 bg-amber-400/10 border border-amber-400/25 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">Verifying Bank Account...</span>
            <span className="text-[11px] text-slate-400">
              Querying {selectedBank.name} (Code: {selectedBank.code}) for account {cleanAcc}
            </span>
          </div>
        </div>
      )}

      {/* Success State */}
      {verificationResult?.success && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-[#111C23] to-[#0E161C] border border-emerald-500/40 rounded-2xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Account Holder Name</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopy(verificationResult.accountName || '')}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedName ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-base sm:text-lg font-black text-white tracking-wide uppercase font-sans">
            {verificationResult.accountName}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1.5 border-t border-emerald-500/20">
            <span>Bank: <strong className="text-slate-200">{selectedBank.name}</strong></span>
            <span>NUBAN: <strong className="text-slate-200">{cleanAcc}</strong></span>
          </div>
        </div>
      )}

      {/* Error State */}
      {verificationResult && !verificationResult.success && !isLoading && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-300">Account Verification Failed</span>
              <span className="text-[10px] font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/30">
                {selectedBank.code}
              </span>
            </div>
            <p className="text-slate-300 font-mono text-[11px]">
              {verificationResult.errorMessage || 'Error: Invalid Account'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => executeVerification(selectedBank, cleanAcc)}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Verification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Testing Accounts Section */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Try Live Verified Demo Accounts:</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1-Click Test</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setTestPreset('access', '0000000000')}
            className="p-2 rounded-xl bg-[#111722] hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px]">Access Bank</span>
              <span className="text-[9px] font-mono text-amber-400 font-bold">044</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Acc: 0000000000</div>
          </button>

          <button
            type="button"
            onClick={() => setTestPreset('gtbank', '0000000001')}
            className="p-2 rounded-xl bg-[#111722] hover:bg-slate-800/80 border border-slate-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px]">GTBank</span>
              <span className="text-[9px] font-mono text-amber-400 font-bold">058</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Acc: 0000000001</div>
          </button>
        </div>
      </div>
    </div>
  );
};
