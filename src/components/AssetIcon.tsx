import React from 'react';

interface AssetIconProps {
  iconType: string;
  symbol?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AssetIcon: React.FC<AssetIconProps> = ({ iconType, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }[size];

  switch (iconType) {
    case 'btc':
      return (
        <div className={`${sizeClasses} rounded-full bg-[#F7931A] flex items-center justify-center font-bold text-white shadow-md shadow-[#F7931A]/20 shrink-0`}>
          <span className="font-serif font-black tracking-tight select-none">₿</span>
        </div>
      );

    case 'eth':
      return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-b from-[#627EEA] to-[#455DB5] flex items-center justify-center text-white shadow-md shadow-[#627EEA]/20 shrink-0`}>
          <svg className="w-5 h-5 fill-current" viewBox="0 0 256 417" preserveAspectRatio="xMidYMid">
            <path fill="#ffffff" fillOpacity="0.9" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
            <path fill="#ffffff" d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
            <path fill="#ffffff" fillOpacity="0.9" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601 128.038-179.94z" />
            <path fill="#ffffff" d="M127.962 416.905v-104.72L0 236.585z" />
          </svg>
        </div>
      );

    case 'gold':
      return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-[#D9A74A] to-[#996D19] flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0`}>
          <svg className="w-5 h-5 text-amber-950" viewBox="0 0 24 24" fill="currentColor">
            {/* Stylized gold bullion bars */}
            <path d="M4 14h10l2 4H2l2-4z" opacity="0.9" />
            <path d="M10 7h10l2 4H8l2-4z" />
            <path d="M6 18h14l1 3H7l-1-3z" opacity="0.8" />
          </svg>
        </div>
      );

    case 'eur':
      return (
        <div className={`${sizeClasses} rounded-full bg-[#1A365D] relative overflow-hidden flex items-center justify-center border border-slate-700/60 shadow-md shrink-0`}>
          {/* Dual EU and US flag inspired insignia */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 bg-[#003399] flex items-center justify-center">
              <span className="text-[10px] text-amber-300 font-bold leading-none">★</span>
            </div>
            <div className="w-1/2 bg-[#B22234] flex flex-col justify-around py-0.5">
              <div className="h-0.5 bg-white w-full opacity-90"></div>
              <div className="h-0.5 bg-white w-full opacity-90"></div>
              <div className="h-0.5 bg-white w-full opacity-90"></div>
            </div>
          </div>
          <div className="relative z-10 w-3 h-3 bg-slate-900/80 rounded-full flex items-center justify-center text-[7px] font-bold text-white">
            $
          </div>
        </div>
      );

    case 'oil':
      return (
        <div className={`${sizeClasses} rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center text-slate-200 shadow-md shrink-0`}>
          <svg className="w-5 h-5 fill-slate-200" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
      );

    case 'sol':
      return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] flex items-center justify-center text-white shadow-md shrink-0`}>
          <span className="text-xs font-black tracking-widest text-slate-950 font-mono">◎</span>
        </div>
      );

    case 'forex':
      return (
        <div className={`${sizeClasses} rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-amber-400 font-bold shadow-md shrink-0`}>
          <span className="text-xs font-mono font-black">£</span>
        </div>
      );

    default:
      return (
        <div className={`${sizeClasses} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0`}>
          <span className="text-xs">$</span>
        </div>
      );
  }
};
