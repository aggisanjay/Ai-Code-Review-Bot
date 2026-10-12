'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowRight, Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E4EAE6] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
            <GitPullRequest className="w-4 h-4 text-[#126B50]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-[#14211D] font-display">
              ReviewFlow
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono font-semibold border border-[#C7E4D6]">
              AI
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#66736D]">
          <a href="#showcase" className="hover:text-[#126B50] transition-colors">
            Showcase
          </a>
          <a href="#architecture" className="hover:text-[#126B50] transition-colors">
            Architecture
          </a>
          <a href="#features" className="hover:text-[#126B50] transition-colors">
            Security & AST
          </a>
          <a href="#pricing" className="hover:text-[#126B50] transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[#126B50] transition-colors">
            FAQ
          </a>
          <Link href="/decisions" className="hover:text-[#126B50] transition-colors">
            Decisions
          </Link>
          <Link href="/docs" className="hover:text-[#126B50] transition-colors">
            Docs
          </Link>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs text-[#66736D] hover:text-[#14211D] transition-colors font-medium"
          >
            Sign In
          </Link>

          <a
            href="#showcase"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs font-medium"
          >
            Live Demo
          </a>

          <Link
            href="/connect-github"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
          >
            <span>Connect GitHub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#66736D] hover:text-[#14211D] hover:bg-[#F7F9F8] border border-[#E4EAE6]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E4EAE6] bg-white px-6 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-2.5 text-sm font-medium text-[#66736D]">
            <a
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              Showcase
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              Architecture
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              Security & AST
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              FAQ
            </a>
            <Link
              href="/decisions"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              Decisions
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#126B50]"
            >
              Documentation
            </Link>
          </div>
          <div className="pt-3 border-t border-[#E4EAE6] flex items-center justify-between">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-medium text-[#14211D]"
            >
              Sign In
            </Link>
            <Link
              href="/connect-github"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
