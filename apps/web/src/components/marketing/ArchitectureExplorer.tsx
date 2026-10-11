'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Layers,
  Cpu,
  Brain,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  technicalDetails: string[];
  latency: string;
  securityControls: string[];
}

export function ArchitectureExplorer() {
  const [activeStageId, setActiveStageId] = useState<string>('webhook');

  const stages: Stage[] = [
    {
      id: 'webhook',
      name: '1. GitHub Webhook Ingestion',
      badge: 'Edge Ingestion',
      icon: <Webhook className="w-5 h-5 text-indigo-400" />,
      summary:
        'Receives pull_request.opened and synchronize events via raw HTTPS request from GitHub App Hookshot.',
      technicalDetails: [
        'Raw request buffer capture for cryptographic signature integrity',
        'HMAC-SHA256 verification using crypto.timingSafeEqual against timing attacks',
        'X-GitHub-Delivery idempotency deduplication with unique DB constraints',
        'Acknowledges GitHub HTTP 200 within <200ms before asynchronous processing',
      ],
      latency: '~45ms',
      securityControls: ['HMAC-SHA256 signature verification', 'No execution of untrusted payloads', 'IP header scrubbing'],
    },
    {
      id: 'queue',
      name: '2. Redis & BullMQ Queueing',
      badge: 'Durable Queue',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      summary:
        'Queues review jobs with exponential backoff retries, commit SHA tracking, and worker concurrency bounds.',
      technicalDetails: [
        'Idempotency key format: `review-${pullRequestId}-${commitSha}`',
        'Dead-letter queue handling for resilient failure isolation',
        'Prevents stale reviews: cancels superseded jobs if a newer commit SHA is detected',
        'Durable job state mirrored in PostgreSQL for auditability and dashboard sync',
      ],
      latency: '~12ms',
      securityControls: ['Authenticated Redis TLS connection', 'Concurrency limits per organization tier'],
    },
    {
      id: 'static',
      name: '3. Deterministic Static Engine',
      badge: 'Static Analysis',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      summary:
        'Runs blazing-fast AST and pattern scans for hardcoded secrets, SQL injection, eval() invocations, and silent catches.',
      technicalDetails: [
        'Unified git diff parsing into structured hunk line mappings',
        'Regex and AST rule checks with zero runtime code execution',
        'High-entropy secret detection (API keys, JWT signing fallbacks, passwords)',
        'OWASP Top 10 injection pattern scanning on added lines (+ lines only)',
      ],
      latency: '~320ms',
      securityControls: ['Sandboxed read-only diff inspection', 'No code execution in worker container'],
    },
    {
      id: 'ai',
      name: '4. AI Review Engine & Defense',
      badge: 'LLM Orchestration',
      icon: <Brain className="w-5 h-5 text-purple-400" />,
      summary:
        'Orchestrates Gemini / OpenAI models with explicit prompt-injection defenses and strict Zod output schemas.',
      technicalDetails: [
        'Strict untrusted data boundaries: <UNTRUSTED_DIFF> markers',
        'System prompt directive: flags injection attempts ("Ignore instructions") as CRITICAL vulnerabilities',
        'JSON-only output validated against strict Zod ReviewSummarySchema',
        'Bounded context windows, token limit budgeting, and real-time cost metering',
      ],
      latency: '~4.8s',
      securityControls: ['Prompt-injection defense', 'Strict Zod schema enforcement', 'Cost and token limits'],
    },
    {
      id: 'grounding',
      name: '5. Evidence Grounding & Deduplication',
      badge: 'Verification',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      summary:
        'Grounds findings against actual source diff lines and deduplicates overlapping static and AI findings.',
      technicalDetails: [
        'Verifies that finding.filePath and line numbers exist in the pull request diff',
        'Discards ungrounded or hallucinated findings automatically',
        'Merges duplicate findings, retaining the highest severity and highest confidence explanation',
        'Ranks findings by severity order: CRITICAL -> HIGH -> MEDIUM -> LOW -> INFO',
      ],
      latency: '~110ms',
      securityControls: ['Hallucination filter', 'Deterministic line verification'],
    },
    {
      id: 'publish',
      name: '6. GitHub Publishing & Checks',
      badge: 'GitHub App Action',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      summary:
        'Publishes actionable inline review comments on PR lines and sets GitHub Check Run conclusion.',
      technicalDetails: [
        'Posts GitHub Check Run (conclusion: failure if CRITICAL policy violated, otherwise success)',
        'Publishes inline PR review comments with suggested code patch diff blocks',
        'Updates organization usage metering (reviews count, tokens, cost) in database',
        'Emits live status updates to frontend dashboard via SSE/polling',
      ],
      latency: '~650ms',
      securityControls: ['Scoped GitHub App installation token', 'No write access outside target PR'],
    },
  ];

  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  return (
    <div className="w-full max-w-6xl mx-auto my-16">
      <div className="text-center mb-10">
        <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          Interactive Architecture Explorer
        </span>
        <h2 className="text-3xl font-extrabold text-slate-100 mt-3">
          From GitHub Webhook to Production Inline Review
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
          Explore the asynchronous review pipeline lifecycle, security boundaries, and engineering decisions.
        </p>
      </div>

      {/* Stage Selector Pills */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        {stages.map((stage) => {
          const isSelected = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 text-slate-100 shadow-glow'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {stage.icon}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {stage.latency}
                </span>
              </div>
              <span className="text-xs font-semibold line-clamp-1">{stage.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  {activeStage.icon}
                </div>
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    {activeStage.badge}
                  </span>
                  <h3 className="text-xl font-bold text-slate-100">{activeStage.name}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Avg Duration: {activeStage.latency}
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-base mb-6 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
              {activeStage.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Implementation */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" /> Technical Architecture
                </h4>
                <ul className="space-y-2.5">
                  {activeStage.technicalDetails.map((detail, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security Controls */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Security Safeguards
                </h4>
                <ul className="space-y-2.5">
                  {activeStage.securityControls.map((control, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{control}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
