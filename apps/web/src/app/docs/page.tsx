'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Webhook,
  Terminal,
} from 'lucide-react';
import { Navbar } from '../../components/marketing/Navbar';
import { Footer } from '../../components/marketing/Footer';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0A1115] text-[#F3F7F5]">
      <Navbar />

      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto space-y-10">
        <div>
          <Link
            href="/"
            className="text-xs text-[#9AA7A1] hover:text-[#34E5A5] flex items-center gap-1.5 mb-4 font-mono font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F3F7F5] font-display">
            ReviewFlow AI Documentation
          </h1>
          <p className="text-sm text-[#9AA7A1] mt-2 max-w-2xl leading-relaxed">
            Architecture, installation guides, review policies, prompt injection defenses, and API reference.
          </p>
        </div>

        {/* Section 1: Quickstart & GitHub App */}
        <div id="webhooks" className="p-7 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] space-y-4 shadow-sleek-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5]">
              <Webhook className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#F3F7F5] font-display">1. Installing the GitHub App</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#9AA7A1] leading-relaxed">
            ReviewFlow AI integrates via a native GitHub App rather than asking developers to paste personal access tokens.
            Once installed on your personal account or organization, GitHub delivers signed webhook events on{' '}
            <code className="text-[#34E5A5] bg-[rgba(52,229,165,0.10)] px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">pull_request.opened</code> and{' '}
            <code className="text-[#34E5A5] bg-[rgba(52,229,165,0.10)] px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">synchronize</code>.
          </p>
          <div className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] font-mono text-xs text-[#F3F7F5] space-y-1.5">
            <span className="text-[#9AA7A1] font-semibold block mb-1"># Required GitHub App Permissions (Least Privilege):</span>
            <div>• Pull Requests: Read & Write (for line-level inline review comments)</div>
            <div>• Checks: Read & Write (for check runs and status badges)</div>
            <div>• Repository Metadata: Read-only</div>
          </div>
        </div>

        {/* Section 2: Review Engine & Prompt Injection Defense */}
        <div id="threat-model" className="p-7 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] space-y-4 shadow-sleek-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#F3F7F5] font-display">2. Prompt-Injection Defense & Sandboxing</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#9AA7A1] leading-relaxed">
            Because pull requests can originate from external or untrusted contributors, diff contents may contain
            adversarial jailbreaks (e.g., hidden comments attempting to command the AI to approve the PR).
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#F3F7F5]">
            <li className="flex items-start gap-2.5">
              <span className="text-[#34E5A5] font-bold">•</span>
              <span>
                <strong>Quarantine Delimiters:</strong> All diff lines are strictly enclosed in{' '}
                <code className="text-[#34E5A5] bg-[rgba(52,229,165,0.10)] px-1 py-0.5 rounded font-mono text-xs font-semibold">&lt;UNTRUSTED_DIFF&gt;</code> tags.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#34E5A5] font-bold">•</span>
              <span>
                <strong>Adversarial Flagging:</strong> If an injection command is identified, ReviewFlow AI halts
                and creates a CRITICAL security alert.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#34E5A5] font-bold">•</span>
              <span>
                <strong>Zero Code Execution:</strong> ReviewFlow AI never runs the untrusted pull request code.
                Static AST scanning and tokenized diff parsing run in a read-only environment.
              </span>
            </li>
          </ul>
        </div>

        {/* Section 3: REST API Reference */}
        <div id="api" className="p-7 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] space-y-4 shadow-sleek-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5]">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#F3F7F5] font-display">3. REST API Reference</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#9AA7A1] leading-relaxed">
            ReviewFlow AI provides an OpenAPI 3.0 documented REST API. Authenticate using Bearer tokens in the{' '}
            <code className="text-[#34E5A5] bg-[rgba(52,229,165,0.10)] px-1.5 py-0.5 rounded font-mono text-xs font-semibold">Authorization</code> header.
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex justify-between items-center">
              <span className="text-[#34E5A5] font-bold">GET /api/v1/health</span>
              <span className="text-[#9AA7A1]">Service health check</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex justify-between items-center">
              <span className="text-[#34E5A5] font-bold">GET /api/v1/pull-requests</span>
              <span className="text-[#9AA7A1]">List PRs with severity filter & pagination</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex justify-between items-center">
              <span className="text-[#34E5A5] font-bold">GET /api/v1/reviews/:id</span>
              <span className="text-[#9AA7A1]">Fetch review job, summary, & findings</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex justify-between items-center">
              <span className="text-[#34E5A5] font-bold">POST /api/v1/webhooks/github</span>
              <span className="text-[#9AA7A1]">GitHub App HMAC webhook endpoint</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
