'use client';

import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowRight, Github } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08090C]/80 backdrop-blur-md border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <GitPullRequest className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              ReviewFlow
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.08] text-zinc-400 font-mono font-medium border border-white/[0.06]">
              AI
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <a href="#showcase" className="hover:text-white transition-colors">
            Showcase
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Security & AST
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
          <Link href="/decisions" className="hover:text-white transition-colors">
            Architecture Decisions
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            Docs
          </Link>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>

          <a
            href="#showcase"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 text-zinc-300 border border-white/[0.08] text-xs font-medium hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
          >
            Live Demo
          </a>

          <Link
            href="/connect-github"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-primary text-xs font-medium"
          >
            <span>Connect GitHub</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
