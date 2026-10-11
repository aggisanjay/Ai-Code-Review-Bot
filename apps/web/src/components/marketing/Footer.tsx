import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand info */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <GitPullRequest className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-100 text-sm">ReviewFlow AI</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-4 leading-relaxed">
              Every pull request. Reviewed intelligently. High-assurance automated code analysis, security checks, and line-level comments on GitHub.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational (Worker Queues Healthy)</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h5 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">Product</h5>
            <ul className="space-y-2">
              <li><a href="#showcase" className="hover:text-slate-100 transition-colors">Showcase</a></li>
              <li><a href="#architecture" className="hover:text-slate-100 transition-colors">Architecture</a></li>
              <li><Link href="/decisions" className="hover:text-slate-100 transition-colors">Engineering Decisions</Link></li>
              <li><Link href="/onboarding" className="hover:text-slate-100 transition-colors">Setup Wizard</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-100 transition-colors">Demo Dashboard</Link></li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h5 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">Resources</h5>
            <ul className="space-y-2">
              <li><Link href="/docs" className="hover:text-slate-100 transition-colors">Documentation</Link></li>
              <li><Link href="/docs/threat-model" className="hover:text-slate-100 transition-colors">Threat Model</Link></li>
              <li><Link href="/docs/api" className="hover:text-slate-100 transition-colors">API Reference</Link></li>
              <li><Link href="/docs/webhooks" className="hover:text-slate-100 transition-colors">GitHub Webhooks</Link></li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div>
            <h5 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">Trust & Security</h5>
            <ul className="space-y-2">
              <li><span className="hover:text-slate-100 cursor-pointer">Security Baseline</span></li>
              <li><span className="hover:text-slate-100 cursor-pointer">Privacy & Retention</span></li>
              <li><span className="hover:text-slate-100 cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-slate-100 cursor-pointer">SOC2 Preparedness</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} ReviewFlow AI, Inc. Built for high-velocity software engineering teams.
          </div>
          <div className="flex items-center gap-1">
            <span>Engineered with strict zero-execution sandboxing</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
