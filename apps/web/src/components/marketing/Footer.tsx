import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.09)] bg-[#0A1115] text-[#B4C0BB] text-xs py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#126B50] flex items-center justify-center shadow-sm">
                <GitPullRequest className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[#F3F7F5] text-base font-display tracking-tight">
                ReviewFlow AI
              </span>
            </div>
            <p className="text-[#B4C0BB] max-w-sm text-xs leading-relaxed">
              A modern engineering platform that brings static analysis, AST security verification, and grounded code reviews together in one clear and intelligent experience.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono text-[11px] font-semibold border border-[rgba(52,229,165,0.28)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>All Systems Operational (Zero-Execution Isolation)</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-semibold text-[#F3F7F5] mb-4 uppercase tracking-wider text-[11px] font-mono">
              Product
            </h5>
            <ul className="space-y-3 text-xs">
              <li>
                <Link href="/#pillars" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  PR Showcase
                </Link>
              </li>
              <li>
                <Link href="/#safety" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  Safety
                </Link>
              </li>
              <li>
                <Link href="/#qna" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  Codebase Q\&amp;A
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  Live Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h5 className="font-semibold text-[#F3F7F5] mb-4 uppercase tracking-wider text-[11px] font-mono">
              Resources
            </h5>
            <ul className="space-y-3 text-xs">
              <li>
                <Link href="/docs" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs#threat-model" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  Threat Model
                </Link>
              </li>
              <li>
                <Link href="/docs#api" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs#webhooks" className="hover:text-[#34E5A5] transition-colors duration-fast">
                  GitHub Webhooks
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Company */}
          <div>
            <h5 className="font-semibold text-[#F3F7F5] mb-4 uppercase tracking-wider text-[11px] font-mono">
              Company
            </h5>
            <ul className="space-y-3 text-xs">
              <li>
                <span className="hover:text-[#34E5A5] transition-colors duration-fast cursor-pointer">About Us</span>
              </li>
              <li>
                <span className="hover:text-[#34E5A5] transition-colors duration-fast cursor-pointer">Security & Compliance</span>
              </li>
              <li>
                <span className="hover:text-[#34E5A5] transition-colors duration-fast cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-[#34E5A5] transition-colors duration-fast cursor-pointer">Contact Support</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[rgba(255,255,255,0.09)] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#7F8C86]">
          <div>
            © {new Date().getFullYear()} ReviewFlow AI, Inc. Built for engineering teams shipping high-assurance code.
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[#F3F7F5]">
            <span>Zero-execution sandbox inspection</span>
            <ShieldCheck className="w-4 h-4 text-[#34E5A5]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
