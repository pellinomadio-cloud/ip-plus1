import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { NIGERIAN_BANKS, NigerianBank } from '../data/countries';
import { verifyBankAccount, BankVerificationResult } from '../services/bankVerificationService';

export interface BankAccountVerificationProps {
  initialBank?: NigerianBank;
  initialAccountNumber?: string;
  onVerificationChange?: (result: {
    isVerified: boolean;
    accountName: string;
    accountNumber: string;
    bank: NigerianBank;
    errorMessage?: string;
  }) => void;
  className?: string;
  compact?: boolean;
}

export const BankAccountVerification: React.FC<BankAccountVerificationProps> = ({
  initialBank,
  initialAccountNumber = '',
  onVerificationChange,
  className = '',
  compact = false
}) => {
  const [selectedBank, setSelectedBank] = useState<NigerianBank>(
    initialBank || NIGERIAN_BANKS[0]
  );
  const [accountNumber, setAccountNumber] = useState<string>(initialAccountNumber);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState<boolean>(false);
  const [bankSearch, setBankSearch] = useState<string>('');

  // Verification states
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [lastVerifiedKey, setLastVerifiedKey] = useState<string>('');

  // In-flight request lock & debounce timer
  const requestInProgressRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter banks by search keyword or code
  const filteredBanks = NIGERIAN_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.includes(bankSearch)
  );

  // Core verification function
  const executeVerification = async (bank: NigerianBank, accNum: string) => {
    const cleanAcc = accNum.replace(/\D/g, '').trim();
    if (cleanAcc.length !== 10) return;

    const requestKey = `${bank.code}:${cleanAcc}`;

    // Prevent duplicate request if already verified for this exact combination
    if (lastVerifiedKey === requestKey && verifiedAccountName && !verificationError) {
      return;
    }

    // Prevent duplicate concurrent requests
    if (requestInProgressRef.current) {
      return;
    }

    requestInProgressRef.current = true;
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const res: BankVerificationResult = await verifyBankAccount(bank.code, cleanAcc);

      if (res.success && res.accountName) {
        setVerifiedAccountName(res.accountName);
        setVerificationError(null);
        setLastVerifiedKey(requestKey);

        onVerificationChange?.({
          isVerified: true,
          accountName: res.accountName,
          accountNumber: cleanAcc,
          bank,
        });
      } else {
        const errorText = res.errorMessage || 'Error: Invalid Account';
        setVerifiedAccountName('');
        setVerificationError(errorText);
        setLastVerifiedKey(requestKey);

        onVerificationChange?.({
          isVerified: false,
          accountName: '',
          accountNumber: cleanAcc,
          bank,
          errorMessage: errorText
        });
      }
    } catch (err: any) {
      const errorText = err.message || 'Error: Verification service unreachable';
      setVerifiedAccountName('');
      setVerificationError(errorText);

      onVerificationChange?.({
        isVerified: false,
        accountName: '',
        accountNumber: cleanAcc,
        bank,
        errorMessage: errorText
      });
    } finally {
      setIsVerifying(false);
      requestInProgressRef.current = false;
    }
  };

  // Automatic verification once bank is selected and account number reaches 10 digits
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '');

    // Reset verified state if account number changed or is incomplete
    if (cleanAcc.length !== 10) {
      if (verifiedAccountName || verificationError) {
        setVerifiedAccountName('');
        setVerificationError(null);
        setLastVerifiedKey('');
        onVerificationChange?.({
          isVerified: false,
          accountName: '',
          accountNumber: cleanAcc,
          bank: selectedBank,
        });
      }
      return;
    }

    // Debounce to allow user to finish typing or pasting
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeVerification(selectedBank, cleanAcc);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [accountNumber, selectedBank]);

  const handleBankSelect = (bank: NigerianBank) => {
    setSelectedBank(bank);
    setIsBankDropdownOpen(false);
    setBankSearch('');

    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length === 10) {
      executeVerification(bank, cleanAcc);
    }
  };

  const handleManualRetry = () => {
    executeVerification(selectedBank, accountNumber);
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Searchable Bank Selector */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Bank / Financial Institution</span>
          </label>
          <span className="text-[10px] font-mono text-slate-400">
            Code: <strong className="text-emerald-400">{selectedBank.code}</strong>
          </span>
        </div>

        {/* Dropdown Toggle Button */}
        <button
          type="button"
          onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
          className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:border-emerald-400"
          aria-expanded={isBankDropdownOpen}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: selectedBank.badgeColor }}
            />
            <span className="font-bold text-slate-100 truncate">{selectedBank.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">({selectedBank.code})</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isBankDropdownOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </button>

        {/* Searchable Dropdown Menu */}
        {isBankDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0D131F] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-800 bg-[#090D14]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bank name or 3-digit CBN code..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-[#141B27] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
                {bankSearch && (
                  <button
                    type="button"
                    onClick={() => setBankSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Banks List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/50 no-scrollbar">
              {filteredBanks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No bank found matching &quot;{bankSearch}&quot;
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleBankSelect(bank)}
                    className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/70 transition-colors text-left cursor-pointer ${
                      selectedBank.id === bank.id
                        ? 'bg-emerald-500/10 text-emerald-300 font-bold'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: bank.badgeColor }}
                      />
                      <span className="truncate">{bank.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                      {bank.code}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 10-Digit Account Number Input */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            10-Digit Account Number (NUBAN)
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            {accountNumber.replace(/\D/g, '').length}/10 digits
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
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3.5 py-2.5 pr-20 bg-[#0B0F17] border border-slate-800 focus:border-emerald-400 rounded-xl text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none tracking-widest transition-colors"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {accountNumber && (
              <button
                type="button"
                onClick={() => setAccountNumber('')}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isVerifying ? (
              <span className="text-amber-400 flex items-center gap-1 font-mono text-[11px] bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Verifying</span>
              </span>
            ) : verifiedAccountName ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Verification Status Feedback Cards */}
      {/* 1. Loading State */}
      {isVerifying && (
        <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300 animate-in fade-in">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
          <div className="space-y-0.5">
            <span className="font-bold block">Verifying Account with {selectedBank.name}...</span>
            <span className="text-[11px] text-amber-400/80 block font-mono">
              Connecting to verification API with bank code {selectedBank.code}
            </span>
          </div>
        </div>
      )}

      {/* 2. Success State: Displays Returned Account Name */}
      {!isVerifying && verifiedAccountName && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-[#101F1B] to-[#0D1815] border border-emerald-500/40 rounded-xl space-y-1.5 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Account Holder Verified
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
              {selectedBank.code} · NUBAN OK
            </span>
          </div>

          <div className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-1.5">
            <span>{verifiedAccountName}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-emerald-500/20 font-mono">
            <span>Bank: {selectedBank.name}</span>
            <span>Acc: {accountNumber}</span>
          </div>
        </div>
      )}

      {/* 3. Failure State: Displays Returned Error Message */}
      {!isVerifying && verificationError && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-white">Account Verification Failed</span>
              <span className="text-rose-300 font-mono block text-[11px]">
                {verificationError}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-rose-500/20 text-[11px]">
            <span className="text-slate-400">
              Double check the 10-digit number and bank selection.
            </span>
            <button
              type="button"
              onClick={handleManualRetry}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
