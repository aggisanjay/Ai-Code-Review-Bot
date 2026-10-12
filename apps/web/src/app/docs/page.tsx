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
    <div className="min-h-screen bg-white text-[#14211D]">
      <Navbar />

      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto space-y-10">
        <div>
          <Link
            href="/"
            className="text-xs text-[#66736D] hover:text-[#126B50] flex items-center gap-1.5 mb-4 font-mono font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#14211D] font-display">
            ReviewFlow AI Documentation
          </h1>
          <p className="text-sm text-[#66736D] mt-2 max-w-2xl leading-relaxed">
            Architecture, installation guides, review policies, prompt injection defenses, and API reference.
          </p>
        </div>

        {/* Section 1: Quickstart & GitHub App */}
        <div id="webhooks" className="p-7 rounded-2xl bg-white border border-[#E4EAE6] space-y-4 shadow-sleek-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50]">
              <Webhook className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#14211D] font-display">1. Installing the GitHub App</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#66736D] leading-relaxed">
            ReviewFlow AI integrates via a native GitHub App rather than asking developers to paste personal access tokens.
            Once installed on your personal account or organization, GitHub delivers signed webhook events on{' '}
            <code className="text-[#126B50] bg-[#EAF5EF] px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">pull_request.opened</code> and{' '}
            <code className="text-[#126B50] bg-[#EAF5EF] px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">synchronize</code>.
          </p>
          <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] font-mono text-xs text-[#14211D] space-y-1.5">
            <span className="text-[#66736D] font-semibold block mb-1"># Required GitHub App Permissions (Least Privilege):</span>
            <div>• Pull Requests: Read & Write (for line-level inline review comments)</div>
            <div>• Checks: Read & Write (for check runs and status badges)</div>
            <div>• Repository Metadata: Read-only</div>
          </div>
        </div>

        {/* Section 2: Review Engine & Prompt Injection Defense */}
        <div id="threat-model" className="p-7 rounded-2xl bg-white border border-[#E4EAE6] space-y-4 shadow-sleek-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#16835B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#14211D] font-display">2. Prompt-Injection Defense & Sandboxing</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#66736D] leading-relaxed">
            Because pull requests can originate from external or untrusted contributors, diff contents may contain
            adversarial jailbreaks (e.g., hidden comments attempting to command the AI to approve the PR).
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#14211D]">
            <li className="flex items-start gap-2.5">
              <span className="text-[#16835B] font-bold">•</span>
              <span>
                <strong>Quarantine Delimiters:</strong> All diff lines are strictly enclosed in{' '}
                <code className="text-[#126B50] bg-[#EAF5EF] px-1 py-0.5 rounded font-mono text-xs font-semibold">&lt;UNTRUSTED_DIFF&gt;</code> tags.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#16835B] font-bold">•</span>
              <span>
                <strong>Adversarial Flagging:</strong> If an injection command is identified, ReviewFlow AI halts
                and creates a CRITICAL security alert.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#16835B] font-bold">•</span>
              <span>
                <strong>Zero Code Execution:</strong> ReviewFlow AI never runs the untrusted pull request code.
                Static AST scanning and tokenized diff parsing run in a read-only environment.
              </span>
            </li>
          </ul>
        </div>

        {/* Section 3: REST API Reference */}
        <div id="api" className="p-7 rounded-2xl bg-white border border-[#E4EAE6] space-y-4 shadow-sleek-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50]">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#14211D] font-display">3. REST API Reference</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#66736D] leading-relaxed">
            ReviewFlow AI provides an OpenAPI 3.0 documented REST API. Authenticate using Bearer tokens in the{' '}
            <code className="text-[#126B50] bg-[#EAF5EF] px-1.5 py-0.5 rounded font-mono text-xs font-semibold">Authorization</code> header.
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex justify-between items-center">
              <span className="text-[#16835B] font-bold">GET /api/v1/health</span>
              <span className="text-[#66736D]">Service health check</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex justify-between items-center">
              <span className="text-[#126B50] font-bold">GET /api/v1/pull-requests</span>
              <span className="text-[#66736D]">List PRs with severity filter & pagination</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex justify-between items-center">
              <span className="text-[#126B50] font-bold">GET /api/v1/reviews/:id</span>
              <span className="text-[#66736D]">Fetch review job, summary, & findings</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex justify-between items-center">
              <span className="text-[#126B50] font-bold">POST /api/v1/webhooks/github</span>
              <span className="text-[#66736D]">GitHub App HMAC webhook endpoint</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
