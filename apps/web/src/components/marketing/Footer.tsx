import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#E4EAE6] bg-[#F7F9F8] text-[#66736D] text-xs py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand info */}
          <div className="col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center">
                <GitPullRequest className="w-3.5 h-3.5 text-[#126B50]" />
              </div>
              <span className="font-semibold text-[#14211D] text-sm font-display tracking-tight">
                ReviewFlow AI
              </span>
            </div>
            <p className="text-[#66736D] max-w-sm text-xs leading-relaxed">
              Every pull request reviewed intelligently. High-assurance automated code analysis, security checks, and line-level comments on GitHub.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono text-[11px] font-medium border border-[#C7E4D6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16835B] animate-pulse" />
              <span>All Systems Operational (Worker Queues Healthy)</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-semibold text-[#14211D] mb-3.5 uppercase tracking-wider text-[11px] font-mono">
              Product
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#showcase" className="hover:text-[#126B50] transition-colors">
                  Showcase
                </Link>
              </li>
              <li>
                <Link href="/#architecture" className="hover:text-[#126B50] transition-colors">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/decisions" className="hover:text-[#126B50] transition-colors">
                  Engineering Decisions
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-[#126B50] transition-colors">
                  Setup Wizard
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#126B50] transition-colors">
                  Demo Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h5 className="font-semibold text-[#14211D] mb-3.5 uppercase tracking-wider text-[11px] font-mono">
              Resources
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/docs" className="hover:text-[#126B50] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs#threat-model" className="hover:text-[#126B50] transition-colors">
                  Threat Model
                </Link>
              </li>
              <li>
                <Link href="/docs#api" className="hover:text-[#126B50] transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs#webhooks" className="hover:text-[#126B50] transition-colors">
                  GitHub Webhooks
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div>
            <h5 className="font-semibold text-[#14211D] mb-3.5 uppercase tracking-wider text-[11px] font-mono">
              Trust & Security
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span className="hover:text-[#126B50] cursor-pointer">Security Baseline</span>
              </li>
              <li>
                <span className="hover:text-[#126B50] cursor-pointer">Privacy & Retention</span>
              </li>
              <li>
                <span className="hover:text-[#126B50] cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-[#126B50] cursor-pointer">SOC2 Preparedness</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#E4EAE6] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#66736D]">
          <div>
            © {new Date().getFullYear()} ReviewFlow AI, Inc. Built for high-velocity software engineering teams.
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[#14211D]">
            <span>Zero-execution sandbox inspection</span>
            <ShieldCheck className="w-4 h-4 text-[#126B50]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
