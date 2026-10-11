'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Github, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/60 px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div>
        <h1 className="text-base font-bold text-slate-100">{title}</h1>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GitHub App Connected</span>
        </div>

        {action}

        <Link
          href="/docs"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <span>Docs</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
}
