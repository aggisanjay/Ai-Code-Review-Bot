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
    <header className="h-16 border-b border-[#E2EDE6] bg-white/95 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div>
        <h1 className="text-sm sm:text-base font-bold text-[#111C18] tracking-tight font-display">{title}</h1>
        {description && <p className="text-xs text-[#52635B] mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Status Badge */}
        {isConnected !== undefined && (
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono font-medium ${
              isConnected
                ? 'bg-[#EBF7F0] border-[#C3EBD7] text-[#063B2C]'
                : 'bg-[#F8FCFA] border-[#E2EDE6] text-[#52635B]'
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
          className="text-xs text-[#52635B] hover:text-[#063B2C] flex items-center gap-1.5 transition-colors font-mono font-medium"
        >
          <span>Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
