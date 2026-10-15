import React from 'react';
import { Wallet, ArrowDownToLine, ArrowUpToLine, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../data/marketData';

interface WalletViewProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ onOpenDeposit, onOpenWithdraw }) => {
  const { currentUser, transactions, positions, hideBalance, toggleHideBalance } = useAuth();
  const balance = currentUser?.balance || 0;
  const lockedMargin = positions.reduce((acc, p) => acc + p.margin, 0);
  const totalEquity = balance + lockedMargin;

  return (
    <div className="space-y-4 pb-24 text-white">
      {/* Wallet Balance Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#131926] via-[#111722] to-[#161F2E] border border-slate-800/80 p-5 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Total Portfolio Equity</span>
          <span className="font-mono text-amber-400">USD Account</span>
        </div>

        <div className="mt-2 text-3xl font-extrabold font-mono text-white">
          {hideBalance ? '••••••' : formatCurrency(totalEquity)}
        </div>

        {/* Breakdown bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block">Available Cash</span>
            <span className="font-mono font-bold text-white text-sm">
              {hideBalance ? '••••' : formatCurrency(balance)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">In Open Trades</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {hideBalance ? '••••' : formatCurrency(lockedMargin)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onOpenDeposit}
            className="py-3 px-4 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.98] text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Deposit Crypto</span>
          </button>
          <button
            onClick={onOpenWithdraw}
            className="py-3 px-4 bg-[#141B27] hover:bg-[#1A2333] border border-slate-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowUpToLine className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Custody Information */}
      <div className="p-3.5 rounded-xl bg-[#141B27] border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Insured Multi-Sig Custody</h4>
            <p className="text-[11px] text-slate-400">Funds protected with Ledger Vault technology</p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-semibold">100% Reserve</span>
      </div>

      {/* Transaction History Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">Recent Financial Activity</h3>
        {transactions.length === 0 ? (
          <div className="p-8 bg-[#141B27] border border-slate-800/80 rounded-2xl text-center text-slate-400 text-xs">
            No transactions yet. Deposit funds to start.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#141B27] border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'deposit' || tx.type === 'investment_yield'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : tx.type === 'withdrawal'
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : tx.type === 'investment'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'investment_yield' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpToLine className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-white flex items-center gap-1.5">
                      {tx.destinationDetails?.type === 'nigerian_bank' && <span>🇳🇬</span>}
                      {tx.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                      {tx.destinationDetails?.accountNumber && (
                        <span className="font-mono text-slate-500">Acc: {tx.destinationDetails.accountNumber}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold ${
                    tx.type === 'deposit' || tx.type === 'trade_profit' || tx.type === 'investment_yield'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'trade_profit' || tx.type === 'investment_yield' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </div>
                  {tx.destinationDetails?.ngnAmount && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400/90 block">
                      ≈ ₦{tx.destinationDetails.ngnAmount.toLocaleString()} NGN
                    </span>
                  )}
                  {tx.status === 'pending' ? (
                    <span className="text-[9px] text-amber-300 font-mono font-bold uppercase bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30 inline-block mt-0.5">
                      ⏳ Pending Approval
                    </span>
                  ) : tx.status === 'processing' ? (
                    <span className="text-[9px] text-rose-400 font-mono font-bold uppercase bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30 inline-block mt-0.5">
                      Rejected
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500 uppercase">{tx.status}</span>
                  )}
                </div>
              </div>

            ))}
          </div>
        )}
      </div>
    </div>
  );
};
