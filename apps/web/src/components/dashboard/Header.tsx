'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  isConnected?: boolean;
}

export function Header({ title, description, action, isConnected }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#E4EAE6] bg-white/90 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div>
        <h1 className="text-sm sm:text-base font-bold text-[#14211D] tracking-tight font-display">{title}</h1>
        {description && <p className="text-xs text-[#66736D] mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Status Badge */}
        {isConnected !== undefined && (
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono font-medium ${
              isConnected
                ? 'bg-[#EAF5EF] border-[#C7E4D6] text-[#126B50]'
                : 'bg-[#F7F9F8] border-[#E4EAE6] text-[#66736D]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#16835B] animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <span>{isConnected ? 'GitHub App Connected' : 'GitHub App Standby'}</span>
          </div>
        )}

        {action}

        <Link
          href="/docs"
          className="text-xs text-[#66736D] hover:text-[#126B50] flex items-center gap-1.5 transition-colors font-mono font-medium"
        >
          <span>Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
