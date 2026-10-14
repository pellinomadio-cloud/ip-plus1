import React from 'react';

interface BrandLogoProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  showTagline = true, 
  size = 'md',
  className = ''
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const taglineSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Golden geometric chart bar mark */}
      <div className={`${iconSize} relative flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 40 32" fill="none" className="w-full h-full text-[#F5BA31]">
          {/* First short bar */}
          <path d="M4 28L10 18L14 28H4Z" fill="#F5BA31" />
          {/* Middle rising bar */}
          <path d="M13 28L21 12L25 28H13Z" fill="#F5BA31" opacity="0.95" />
          {/* Tallest rising spear bar with arrow notch */}
          <path d="M24 28L34 4L37 10L29 28H24Z" fill="#F5BA31" />
          {/* Dynamic rising connecting line */}
          <path d="M6 24L18 14L28 8L36 3" stroke="#F5BA31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div>
        <div className={`font-extrabold tracking-wide text-[#F5BA31] ${titleSize} leading-none flex items-center gap-1`}>
          <span>IQ-PLUS</span>
        </div>
        {showTagline && (
          <p className={`text-slate-400 font-normal ${taglineSize} leading-tight mt-1 tracking-normal`}>
            Trade Smarter. Grow Faster.
          </p>
        )}
      </div>
    </div>
  );
};
