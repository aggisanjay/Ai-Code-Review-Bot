'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react';

interface Stage {
  id: string;
  stepNum: string;
  name: string;
  badge: string;
  latency: string;
  summary: string;
  technicalDetails: string[];
  securityControls: string[];
}

export function ArchitectureExplorer() {
  const [activeStageId, setActiveStageId] = useState<string>('webhook');

  const stages: Stage[] = [
    {
      id: 'webhook',
      stepNum: '01',
      name: 'GitHub Webhook Ingestion',
      badge: 'Edge Ingestion',
      latency: '~45ms',
      summary:
        'Receives pull_request.opened and synchronize events via raw HTTPS request from GitHub App Hookshot.',
      technicalDetails: [
        'Raw request buffer capture for cryptographic signature integrity',
        'HMAC-SHA256 verification using crypto.timingSafeEqual against timing attacks',
        'X-GitHub-Delivery idempotency deduplication with unique database constraints',
        'Acknowledges GitHub HTTP 200 within <200ms before asynchronous processing',
      ],
      securityControls: ['HMAC-SHA256 signature verification', 'Zero execution of untrusted payloads', 'IP header sanitization'],
    },
    {
      id: 'queue',
      stepNum: '02',
      name: 'Redis & BullMQ Queueing',
      badge: 'Durable Queue',
      latency: '~12ms',
      summary:
        'Queues review jobs with exponential backoff retries, commit SHA tracking, and worker concurrency bounds.',
      technicalDetails: [
        'Idempotency key format: review-{pullRequestId}-{commitSha}',
        'Dead-letter queue handling for resilient failure isolation',
        'Prevents stale reviews: cancels superseded jobs if a newer commit SHA is detected',
        'Durable job state mirrored in SQLite/PostgreSQL for auditability and dashboard sync',
      ],
      securityControls: ['Authenticated Redis TLS connection', 'Per-organization tenant concurrency isolation'],
    },
    {
      id: 'static',
      stepNum: '03',
      name: 'Deterministic Static Engine',
      badge: 'AST Scanning',
      latency: '~320ms',
      summary:
        'Runs blazing-fast AST and pattern scans for hardcoded secrets, SQL injection, eval() invocations, and silent catches.',
      technicalDetails: [
        'Unified git diff parsing into structured hunk line mappings',
        'Regex and AST rule checks with zero runtime code execution',
        'High-entropy secret detection (API keys, JWT signing fallbacks, passwords)',
        'OWASP Top 10 injection pattern scanning on added lines (+ lines only)',
      ],
      securityControls: ['Sandboxed read-only diff inspection', 'No code execution in worker container'],
    },
    {
      id: 'ai',
      stepNum: '04',
      name: 'AI Review Engine & Defense',
      badge: 'LLM Orchestration',
      latency: '~4.8s',
      summary:
        'Orchestrates Gemini / OpenAI models with explicit prompt-injection defenses and strict Zod output schemas.',
      technicalDetails: [
        'Strict untrusted data boundaries: <UNTRUSTED_DIFF> markers',
        'System prompt directive: flags injection attempts ("Ignore instructions") as CRITICAL vulnerabilities',
        'JSON-only output validated against strict Zod ReviewSummarySchema',
        'Bounded context windows, token limit budgeting, and real-time cost metering',
      ],
      securityControls: ['Prompt-injection defense', 'Strict Zod schema enforcement', 'Cost and token limits'],
    },
    {
      id: 'grounding',
      stepNum: '05',
      name: 'Evidence Grounding & Deduplication',
      badge: 'Grounding Verification',
      latency: '~180ms',
      summary:
        'Validates every LLM finding against the real git diff lines. Strips hallucinations, merges duplicates, and formats GitHub Markdown.',
      technicalDetails: [
        'Verification pass ensures every quoted snippet actually exists in the hunk',
        'Deduplicates overlapping static and LLM findings, prioritizing the highest confidence score',
        'Generates GitHub Check Run summaries and inline line comment payloads',
        'Publishes review verdict directly to the GitHub Pull Request',
      ],
      securityControls: ['Zero hallucination enforcement', 'Audit trail logged with input diff hash'],
    },
  ];

  const current = stages.find((s) => s.id === activeStageId) || stages[0];

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-5 border-b border-[#E4EAE6] gap-4">
        <div>
          <div className="text-[11px] font-mono text-[#126B50] font-semibold uppercase tracking-wider mb-1.5">
            End-To-End Systems Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#14211D] tracking-tight font-display">
            Review Pipeline Execution Stages
          </h2>
        </div>
        <div className="text-xs font-mono text-[#66736D] bg-[#F7F9F8] border border-[#E4EAE6] px-3.5 py-2 rounded-xl flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#126B50]" />
          <span>Average Total Pipeline Latency: </span>
          <span className="text-[#14211D] font-bold">~5.4s</span>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isActive
                  ? 'bg-[#EAF5EF] border-[#126B50] shadow-sleek-sm ring-1 ring-[#126B50]/30'
                  : 'bg-white border-[#E4EAE6] hover:bg-[#F7F9F8] hover:border-[#D5DFDA]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <span className={isActive ? 'text-[#126B50] font-bold' : 'text-[#66736D]'}>
                  {stage.stepNum}
                </span>
                <span className="text-[#66736D]">{stage.latency}</span>
              </div>
              <div className={`text-xs font-semibold line-clamp-1 ${isActive ? 'text-[#14211D]' : 'text-[#66736D]'}`}>
                {stage.name.replace(/^\d+\.\s*/, '')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Deep Dive Telemetry Box */}
      <div className="bg-white border border-[#E4EAE6] rounded-2xl p-6 sm:p-8 shadow-sleek-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E4EAE6] mb-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-bold">
              STAGE {current.stepNum}
            </span>
            <h3 className="text-lg font-bold text-[#14211D] font-display">
              {current.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#66736D]">Step Budget:</span>
            <span className="text-[#126B50] font-bold bg-[#EAF5EF] px-2 py-0.5 rounded-md border border-[#C7E4D6]">{current.latency}</span>
          </div>
        </div>

        <p className="text-sm text-[#66736D] leading-relaxed mb-8">
          {current.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Invariants */}
          <div className="bg-[#F7F9F8] p-5 rounded-xl border border-[#E4EAE6]">
            <div className="text-[11px] font-mono text-[#14211D] font-semibold uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#126B50]" />
              <span>Core Invariants & Technical Details</span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#66736D]">
              {current.technicalDetails.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#126B50] font-bold text-xs leading-4">›</span>
                  <span className="leading-5 text-[#14211D]">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Controls */}
          <div className="bg-[#F7F9F8] p-5 rounded-xl border border-[#E4EAE6]">
            <div className="text-[11px] font-mono text-[#14211D] font-semibold uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16835B]" />
              <span>Security Controls & Sandboxing</span>
            </div>
            <ul className="space-y-2.5 text-xs text-[#66736D]">
              {current.securityControls.map((ctrl, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16835B] shrink-0 mt-0.5" />
                  <span className="leading-5 text-[#14211D]">{ctrl}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
