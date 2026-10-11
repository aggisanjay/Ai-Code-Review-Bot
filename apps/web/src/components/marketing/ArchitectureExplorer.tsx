'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Layers,
  Cpu,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
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
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-white/[0.08] gap-4">
        <div>
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            End-To-End Systems Architecture
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Review Pipeline Execution Stages
          </h2>
        </div>
        <div className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08] px-3 py-1.5 rounded-md flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Average Total Pipeline Latency: </span>
          <span className="text-white font-semibold">~5.4s</span>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`p-3 rounded-lg border text-left transition-all relative ${
                isActive
                  ? 'bg-[#10141E] border-blue-500/50 shadow-sm'
                  : 'bg-[#0B0D12] border-white/[0.06] hover:bg-[#121620] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className={isActive ? 'text-blue-400 font-semibold' : 'text-zinc-500'}>
                  {stage.stepNum}
                </span>
                <span className="text-zinc-500">{stage.latency}</span>
              </div>
              <div className="text-xs font-medium text-zinc-200 line-clamp-1">
                {stage.name.replace(/^\d+\.\s*/, '')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Deep Dive Telemetry Box */}
      <div className="bg-[#0B0D12] border border-white/[0.08] rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              STAGE {current.stepNum}
            </span>
            <h3 className="text-base font-semibold text-white">
              {current.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-400">Step Budget:</span>
            <span className="text-emerald-400 font-semibold">{current.latency}</span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed mb-6">
          {current.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Invariants */}
          <div className="bg-[#0E1017] p-4 rounded-lg border border-white/[0.05]">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Core Invariants & Technical Details</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {current.technicalDetails.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 text-xs leading-4">›</span>
                  <span className="leading-5">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Controls */}
          <div className="bg-[#0E1017] p-4 rounded-lg border border-white/[0.05]">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security Controls & Sandboxing</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {current.securityControls.map((ctrl, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-5">{ctrl}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
