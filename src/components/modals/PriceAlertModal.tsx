import React from 'react';
import { usePriceAlerts } from '../../context/PriceAlertContext';
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Smartphone, 
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Inbox,
  Radio
} from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose }) => {
  const {
    messages,
    notificationPermission,
    requestPermission,
    markAllAsRead,
  } = usePriceAlerts();

  React.useEffect(() => {
    if (isOpen) {
      markAllAsRead();
    }
  }, [isOpen, markAllAsRead]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0E131D] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#121824] border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  Notifications & Messages
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {messages.length} Sent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official announcements, market signals & price alerts from the trading desk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Push Notification Status Bar */}
        <div className="px-4 py-2.5 bg-[#0A0E16] border-b border-slate-800/80">
          {notificationPermission === 'granted' ? (
            <div className="flex items-center justify-between gap-2 text-xs text-emerald-400">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Instant Device Push Notifications Enabled</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Background Delivery Active</span>
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Device notifications are blocked in your browser settings. Enable them to receive alerts outside the app.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Receive instant alerts on your device even when outside the app</span>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="px-3 py-1 text-xs font-bold text-slate-950 bg-[#F5BA31] hover:bg-[#ffc842] rounded-lg transition-all shrink-0 cursor-pointer"
              >
                Allow Device Alerts
              </button>
            </div>
          )}
        </div>

        {/* Messages Sent Feed */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {messages.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">No Messages Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Messages, trading desk broadcasts, and market price alerts sent by the administrator will appear here.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isPriceAlert = msg.type === 'price_alert';
              const isSignal = msg.type === 'signal';
              return (
                <div
                  key={msg.id}
                  className="p-3.5 bg-[#131A28] border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isPriceAlert
                            ? msg.condition === 'below'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isSignal
                            ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {isPriceAlert ? (
                          msg.condition === 'below' ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5" />
                          )
                        ) : isSignal ? (
                          <Radio className="w-3.5 h-3.5" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {msg.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {msg.sender || 'IQ-PLUS Trading Desk'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(msg.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed pl-9">
                    {msg.message}
                  </p>

                  {msg.symbol && (
                    <div className="pl-9 pt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0A0E16] border border-slate-800 text-amber-400">
                        {msg.symbol}
                      </span>
                      {msg.targetPrice !== undefined && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Target: ${msg.targetPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
