'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#090B0E]/80 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div>
        <h1 className="text-sm font-semibold text-white tracking-tight">{title}</h1>
        {description && <p className="text-[11px] text-zinc-400">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>GitHub App Connected</span>
        </div>

        {action}

        <Link
          href="/docs"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
        >
          <span>Docs</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
}
