'use client';

import React from 'react';
import Link from 'next/link';

export function LogoIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <div
      className={`${className} relative flex items-center justify-center rounded-lg bg-gradient-to-br from-[#34E5A5] to-[#059669] shadow-[0_0_20px_rgba(52,229,165,0.4)] shrink-0`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#04070A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="9" r="2.5" />
        <path d="M6 8.5v7" />
        <path d="M18 11.5v2.5a3.5 3.5 0 0 1-3.5 3.5H8.5" />
      </svg>
    </div>
  );
}

export function Logo({
  href = '/',
  showBadge = true,
  className = '',
}: {
  href?: string;
  showBadge?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`group flex items-center gap-2.5 ${className}`}>
      <LogoIcon className="w-7 h-7 transition-transform duration-300 group-hover:scale-105" />
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[15px] tracking-tight text-[#F3F7F5] font-display">
          ReviewFlow
        </span>
        {showBadge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#34E5A5]/15 text-[#34E5A5] font-mono font-bold border border-[#34E5A5]/30 shadow-[0_0_10px_rgba(52,229,165,0.15)]">
            AI
          </span>
        )}
      </div>
    </Link>
  );
}

