'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowRight, Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto">
        <nav className="pointer-events-auto bg-[#04070A]/95 backdrop-blur-md border border-[rgba(255,255,255,0.09)] rounded-full px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-base">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#126B50] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <GitPullRequest className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#F3F7F5] font-display">
                ReviewFlow
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-bold border border-[rgba(52,229,165,0.28)]">
                AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-7 text-[13px] font-medium text-[#B4C0BB]">
            <Link href="/#pillars" className="hover:text-[#34E5A5] transition-colors duration-fast">
              Pillars
            </Link>
            <Link href="/#safety" className="hover:text-[#34E5A5] transition-colors duration-fast">
              Safety
            </Link>
            <Link href="/#qna" className="hover:text-[#34E5A5] transition-colors duration-fast">
              Codebase Q\&amp;A
            </Link>
            <Link href="/#pricing" className="hover:text-[#34E5A5] transition-colors duration-fast">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-[#34E5A5] transition-colors duration-fast">
              Docs
            </Link>
          </div>

          {/* CTA Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs text-[#B4C0BB] hover:text-[#F3F7F5] transition-colors font-medium"
            >
              Sign In
            </Link>

            <Link
              href="/connect-github"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#126B50] hover:bg-[#0A4D3A] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all duration-fast hover:scale-[1.02]"
            >
              <span>Connect GitHub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-full text-[#B4C0BB] hover:text-[#F3F7F5] hover:bg-[#F4FAF6] border border-[rgba(255,255,255,0.09)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto mt-2 md:hidden rounded-2xl border border-[rgba(255,255,255,0.09)] bg-[#04070A]/98 backdrop-blur-md p-5 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-fast">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-[#B4C0BB]">
              <Link
                href="/#pillars"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#34E5A5]"
              >
                Pillars
              </Link>
              <Link
                href="/#safety"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#34E5A5]"
              >
                Safety
              </Link>
              <Link
                href="/#qna"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#34E5A5]"
              >
                Codebase Q\&amp;A
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#34E5A5]"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#34E5A5]"
              >
                Docs
              </Link>
            </div>
            <div className="pt-3 border-t border-[rgba(255,255,255,0.09)] flex items-center justify-between">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-medium text-[#F3F7F5]"
              >
                Sign In
              </Link>
              <Link
                href="/connect-github"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#126B50] text-white px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Connect GitHub</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
