'use client';

import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowRight, Github } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-glow flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GitPullRequest className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-100 flex items-center gap-1.5">
              ReviewFlow <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">AI</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#showcase" className="hover:text-slate-100 transition-colors">
            Showcase
          </a>
          <a href="#architecture" className="hover:text-slate-100 transition-colors">
            Architecture
          </a>
          <a href="#features" className="hover:text-slate-100 transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-slate-100 transition-colors">
            Pricing
          </a>
          <Link href="/decisions" className="hover:text-slate-100 transition-colors">
            Decisions
          </Link>
          <Link href="/docs" className="hover:text-slate-100 transition-colors">
            Docs
          </Link>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-700/80 text-xs font-semibold hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            Explore Demo
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-glow"
          >
            <span>Connect GitHub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
