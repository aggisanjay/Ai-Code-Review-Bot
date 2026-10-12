'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowRight, Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto">
        <nav className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#E2EDE6] rounded-full px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-base">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#063B2C] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <GitPullRequest className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#111C18] font-display">
                ReviewFlow
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EBF7F0] text-[#063B2C] font-mono font-bold border border-[#C3EBD7]">
                AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-7 text-[13px] font-medium text-[#52635B]">
            <Link href="/#showcase" className="hover:text-[#063B2C] transition-colors duration-fast">
              Showcase
            </Link>
            <Link href="/#architecture" className="hover:text-[#063B2C] transition-colors duration-fast">
              Architecture
            </Link>
            <Link href="/#features" className="hover:text-[#063B2C] transition-colors duration-fast">
              Features
            </Link>
            <Link href="/#pricing" className="hover:text-[#063B2C] transition-colors duration-fast">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-[#063B2C] transition-colors duration-fast">
              Docs
            </Link>
          </div>

          {/* CTA Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs text-[#52635B] hover:text-[#111C18] transition-colors font-medium"
            >
              Sign In
            </Link>

            <Link
              href="/connect-github"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#063B2C] hover:bg-[#0A4D3A] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all duration-fast hover:scale-[1.02]"
            >
              <span>Connect GitHub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-full text-[#52635B] hover:text-[#111C18] hover:bg-[#F4FAF6] border border-[#E2EDE6]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto mt-2 md:hidden rounded-2xl border border-[#E2EDE6] bg-white/98 backdrop-blur-md p-5 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-fast">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-[#52635B]">
              <Link
                href="/#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#063B2C]"
              >
                Showcase
              </Link>
              <Link
                href="/#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#063B2C]"
              >
                Architecture
              </Link>
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#063B2C]"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#063B2C]"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#063B2C]"
              >
                Docs
              </Link>
            </div>
            <div className="pt-3 border-t border-[#E2EDE6] flex items-center justify-between">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-medium text-[#111C18]"
              >
                Sign In
              </Link>
              <Link
                href="/connect-github"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#063B2C] text-white px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
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
