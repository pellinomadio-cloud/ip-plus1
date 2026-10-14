import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'button' | 'banner' | 'drawer';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'button',
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Suppress button if app is already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If direct browser prompt isn't fired yet or on iOS/Safari, show guide
      setShowGuide(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className={`w-full bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0 text-amber-400 border border-amber-400/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-amber-300 leading-tight truncate">Install IQ-PLUS App</p>
              <p className="text-slate-400 text-[11px] truncate">Fast 1-tap trading on your home screen</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>

        {/* Modal Guide */}
        {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />}
      </>
    );
  }

  if (variant === 'drawer') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-400/5 hover:from-amber-500/25 hover:to-amber-400/10 border border-amber-500/30 text-amber-300 font-semibold text-sm transition-all group ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400 border border-amber-400/30">
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="font-bold">Install App</div>
              <div className="text-[11px] font-normal text-slate-400">Add to Home Screen for fast access</div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">PWA</span>
        </button>

        {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />}
      </>
    );
  }

  // Default header button variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install IQ-PLUS App on device"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 font-bold text-xs transition-all active:scale-95 shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />}
    </>
  );
};

interface InstallGuideModalProps {
  onClose: () => void;
  isIOS: boolean;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#0D121B] border border-amber-500/30 p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <img src="/pwa-192x192.png" alt="IQ-PLUS Logo" className="w-9 h-9 object-contain rounded-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-300">IQ-PLUS Trading</h3>
            <p className="text-xs text-slate-400">Install app for native performance</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3.5 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-5">
            <p className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Safari / iOS Instructions:
            </p>
            <ol className="space-y-2.5 list-decimal list-inside pl-1 text-slate-300">
              <li className="leading-relaxed">
                Tap the <strong className="text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"><Share className="w-3 h-3 text-amber-400" /> Share</strong> button in your browser toolbar.
              </li>
              <li className="leading-relaxed">
                Scroll down and tap <strong className="text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"><PlusSquare className="w-3 h-3 text-amber-400" /> Add to Home Screen</strong>.
              </li>
              <li className="leading-relaxed">
                Tap <strong className="text-amber-300">Add</strong> to complete installation.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-5">
            <p className="font-semibold text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Chrome / Android / Desktop:
            </p>
            <ol className="space-y-2.5 list-decimal list-inside pl-1 text-slate-300">
              <li className="leading-relaxed">
                Look for the <strong className="text-white">Install</strong> icon in your browser address bar or menu.
              </li>
              <li className="leading-relaxed">
                Tap <strong className="text-white">Install IQ-PLUS</strong> to add the app directly to your device home screen or app launcher.
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shadow-lg"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
