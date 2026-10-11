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
    <div className="min-h-screen bg-[#08090C] text-[#EDEDEF]">
      <Navbar />

      <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto space-y-10">
        <div>
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 mb-4 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">ReviewFlow AI Documentation</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Architecture, installation guides, review policies, prompt injection defenses, and API reference.
          </p>
        </div>

        {/* Section 1: Quickstart & GitHub App */}
        <div className="p-6 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06] text-blue-400">
              <Webhook className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">1. Installing the GitHub App</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ReviewFlow AI integrates via a native GitHub App rather than asking developers to paste personal access tokens.
            Once installed on your personal account or organization, GitHub delivers signed webhook events on{' '}
            <code className="text-blue-400 bg-zinc-900 px-1 py-0.5 rounded font-mono text-[11px]">pull_request.opened</code> and{' '}
            <code className="text-blue-400 bg-zinc-900 px-1 py-0.5 rounded font-mono text-[11px]">synchronize</code>.
          </p>
          <div className="p-3.5 rounded-lg bg-[#0E1017] border border-white/[0.05] font-mono text-[11px] text-zinc-300 space-y-1">
            <span className="text-zinc-500"># Required GitHub App Permissions (Least Privilege):</span>
            <div>• Pull Requests: Read & Write (for line-level inline review comments)</div>
            <div>• Checks: Read & Write (for check runs and status badges)</div>
            <div>• Repository Metadata: Read-only</div>
          </div>
        </div>

        {/* Section 2: Review Engine & Prompt Injection Defense */}
        <div className="p-6 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06] text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">2. Prompt-Injection Defense & Sandboxing</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Because pull requests can originate from external or untrusted contributors, diff contents may contain
            adversarial jailbreaks (e.g., hidden comments attempting to command the AI to approve the PR).
          </p>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Quarantine Delimiters:</strong> All diff lines are strictly enclosed in{' '}
                <code className="text-blue-400 font-mono text-[11px]">&lt;UNTRUSTED_DIFF&gt;</code> tags.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Adversarial Flagging:</strong> If an injection command is identified, ReviewFlow AI halts
                and creates a CRITICAL security alert.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Zero Code Execution:</strong> ReviewFlow AI never runs the untrusted pull request code.
                Static AST scanning and tokenized diff parsing run in a read-only environment.
              </span>
            </li>
          </ul>
        </div>

        {/* Section 3: REST API Reference */}
        <div className="p-6 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06] text-blue-400">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">3. REST API Reference</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ReviewFlow AI provides an OpenAPI 3.0 documented REST API. Authenticate using Bearer tokens in the{' '}
            <code className="text-blue-400 font-mono text-[11px]">Authorization</code> header.
          </p>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="p-2.5 rounded-md bg-[#0E1017] border border-white/[0.05] flex justify-between">
              <span className="text-emerald-400">GET /api/v1/health</span>
              <span className="text-zinc-500">Service health check</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#0E1017] border border-white/[0.05] flex justify-between">
              <span className="text-blue-400">GET /api/v1/pull-requests</span>
              <span className="text-zinc-500">List PRs with severity filter & pagination</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#0E1017] border border-white/[0.05] flex justify-between">
              <span className="text-blue-400">GET /api/v1/reviews/:id</span>
              <span className="text-zinc-500">Fetch review job, summary, & findings</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#0E1017] border border-white/[0.05] flex justify-between">
              <span className="text-cyan-400">POST /api/v1/webhooks/github</span>
              <span className="text-zinc-500">GitHub App HMAC webhook endpoint</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
