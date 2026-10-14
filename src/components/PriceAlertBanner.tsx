import React from 'react';
import { usePriceAlerts } from '../context/PriceAlertContext';
import { Bell, X, ArrowUpRight, Zap } from 'lucide-react';

export const PriceAlertBanner: React.FC = () => {
  const { lastTriggeredAlert, clearLastTriggeredAlert, openCreateAlertForAsset } = usePriceAlerts();

  if (!lastTriggeredAlert) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[120] animate-bounce-in">
      <div className="bg-[#141E33] border-2 border-amber-400/80 rounded-2xl p-3.5 shadow-2xl shadow-amber-500/20 backdrop-blur-xl flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-pulse">
            <Bell className="w-5 h-5 fill-slate-950" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                PRICE TARGET HIT!
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">
              {lastTriggeredAlert.assetName} ({lastTriggeredAlert.symbol})
            </h4>
            <p className="text-xs text-emerald-400 font-mono font-bold">
              Target Price Hit: ${lastTriggeredAlert.targetPrice.toLocaleString()}
            </p>
            {lastTriggeredAlert.note && (
              <p className="text-[11px] text-slate-400 italic">"{lastTriggeredAlert.note}"</p>
            )}

            <div className="pt-1.5 flex items-center gap-2">
              <button
                onClick={() => {
                  openCreateAlertForAsset(lastTriggeredAlert.symbol);
                  clearLastTriggeredAlert();
                }}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
              >
                Manage Alerts <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={clearLastTriggeredAlert}
          className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
