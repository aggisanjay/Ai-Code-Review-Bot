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
    <header className="h-16 border-b border-[rgba(255,255,255,0.09)] bg-[#04070A]/95 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div>
        <h1 className="text-sm sm:text-base font-bold text-[#F3F7F5] tracking-tight font-display">{title}</h1>
        {description && <p className="text-xs text-[#B4C0BB] mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Status Badge */}
        {isConnected !== undefined && (
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono font-medium ${
              isConnected
                ? 'bg-[rgba(52,229,165,0.10)] border-[rgba(52,229,165,0.28)] text-[#34E5A5]'
                : 'bg-[rgba(255,255,255,0.035)] border-[rgba(255,255,255,0.09)] text-[#B4C0BB]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#10B981] animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <span>{isConnected ? 'GitHub App Connected' : 'GitHub App Standby'}</span>
          </div>
        )}

        {action}

        <Link
          href="/docs"
          className="text-xs text-[#B4C0BB] hover:text-[#34E5A5] flex items-center gap-1.5 transition-colors font-mono font-medium"
        >
          <span>Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
