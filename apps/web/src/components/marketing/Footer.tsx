import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#07080A] text-zinc-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand info */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="font-semibold text-white text-sm">ReviewFlow AI</span>
            </div>
            <p className="text-zinc-400 max-w-sm text-xs leading-relaxed">
              Every pull request. Reviewed intelligently. High-assurance automated code analysis, security checks, and line-level comments on GitHub.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational (Worker Queues Healthy)</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[10px] font-mono">Product</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#showcase" className="hover:text-white transition-colors">Showcase</a></li>
              <li><a href="#architecture" className="hover:text-white transition-colors">Architecture</a></li>
              <li><Link href="/decisions" className="hover:text-white transition-colors">Engineering Decisions</Link></li>
              <li><Link href="/onboarding" className="hover:text-white transition-colors">Setup Wizard</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Demo Dashboard</Link></li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h5 className="font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[10px] font-mono">Resources</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/docs/threat-model" className="hover:text-white transition-colors">Threat Model</Link></li>
              <li><Link href="/docs/api" className="hover:text-white transition-colors">API Reference</Link></li>
              <li><Link href="/docs/webhooks" className="hover:text-white transition-colors">GitHub Webhooks</Link></li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div>
            <h5 className="font-semibold text-zinc-300 mb-3 uppercase tracking-wider text-[10px] font-mono">Trust & Security</h5>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer">Security Baseline</span></li>
              <li><span className="hover:text-white cursor-pointer">Privacy & Retention</span></li>
              <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer">SOC2 Preparedness</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div>
            © {new Date().getFullYear()} ReviewFlow AI, Inc. Built for high-velocity software engineering teams.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Engineered with strict zero-execution sandboxing</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
      </div>
    </footer>
  );
}
