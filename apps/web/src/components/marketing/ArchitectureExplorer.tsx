'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Activity,
  Layers,
  ArrowRight,
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

const MOTION_EASE = [0.4, 0, 0.2, 1] as const;

export function ArchitectureExplorer() {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [direction, setDirection] = useState<number>(1);

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
      securityControls: [
        'HMAC-SHA256 signature verification',
        'Zero execution of untrusted payloads',
        'IP header sanitization',
      ],
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
      securityControls: [
        'Authenticated Redis TLS connection',
        'Per-organization tenant concurrency isolation',
      ],
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
      securityControls: [
        'Sandboxed read-only diff inspection',
        'No code execution in worker container',
      ],
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
      securityControls: [
        'Prompt-injection defense',
        'Strict Zod schema enforcement',
        'Cost and token limits',
      ],
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
      securityControls: [
        'Zero hallucination enforcement',
        'Audit trail logged with input diff hash',
      ],
    },
    {
      id: 'indexing',
      stepNum: '06',
      name: 'Whole-Codebase Vector Indexing',
      badge: 'RAG Pipeline',
      latency: '~1.4s',
      summary:
        'Recursively indexes authorized repository trees using language-aware syntax chunking and genuine vector embeddings.',
      technicalDetails: [
        'Filters non-code binaries, lockfiles, node_modules, and vendor directories',
        'Syntax-aware chunker preserves function and class boundaries with symbol scopes',
        'Incremental tree comparison using SHA-256 hashes to reindex only modified files',
        'Purges obsolete and stale code chunks upon file deletion or renaming',
      ],
      securityControls: [
        'Organization tenant isolation on vector storage',
        'Read-only recursive tree traversal',
      ],
    },
    {
      id: 'qna-approvals',
      stepNum: '07',
      name: 'Grounded Q&A & Safe Write Approvals',
      badge: 'Human-in-the-Loop',
      latency: '~2.1s',
      summary:
        'Answers deep architectural questions with verifiable citations and requires two-phase cryptographic developer approval for write actions.',
      technicalDetails: [
        'Strict line citations [filePath#L{start}-L{end}] with genuine source evidence',
        'Honest insufficient-evidence guardrail prevents hallucinated explanations',
        'Zero automatic writes: proposed test suites and patches require developer authorization',
        'Two-phase approval protocol bound to 64-character cryptographic nonce & commit SHA revalidation',
      ],
      securityControls: [
        'Cryptographic approval nonces',
        'Target commit SHA revalidation',
        'Replay attack prevention',
      ],
    },
  ];

  // Auto-play progression loop for live pipeline simulation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setDirection(1);
      setActiveStageIndex((prev) => (prev + 1) % stages.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [isPlaying, stages.length]);

  const selectStage = (index: number) => {
    setDirection(index > activeStageIndex ? 1 : -1);
    setActiveStageIndex(index);
  };

  const nextStage = () => {
    setDirection(1);
    setActiveStageIndex((prev) => (prev + 1) % stages.length);
  };

  const prevStage = () => {
    setDirection(-1);
    setActiveStageIndex((prev) => (prev - 1 + stages.length) % stages.length);
  };

  const current = stages[activeStageIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 32 : -32,
      opacity: 0,
      scale: 0.99,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { duration: 0.3, ease: MOTION_EASE },
        opacity: { duration: 0.25, ease: MOTION_EASE },
        scale: { duration: 0.3, ease: MOTION_EASE },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : 32,
      opacity: 0,
      scale: 0.99,
      transition: {
        x: { duration: 0.25, ease: MOTION_EASE },
        opacity: { duration: 0.2, ease: MOTION_EASE },
      },
    }),
  };

  return (
    <div className="w-full">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-[rgba(255,255,255,0.09)] gap-4">
        <div>
          <div className="text-[11px] font-mono text-[#34E5A5] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Live Pipeline Architecture Execution</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F3F7F5] tracking-tight font-display">
            Defense in Depth Review Pipeline
          </h2>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono text-[#B4C0BB] bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#34E5A5]" />
            <span>Avg Pipeline Latency: </span>
            <span className="text-[#F3F7F5] font-bold">~5.4s</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A1115] hover:bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-xs font-medium text-[#F3F7F5] shadow-sm transition-all duration-fast"
            title={isPlaying ? 'Pause Auto-Simulation' : 'Play Auto-Simulation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-[#34E5A5]" />
                <span className="text-[11px] font-mono font-semibold text-[#34E5A5]">Live Auto-Play</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#B4C0BB]" />
                <span className="text-[11px] font-mono text-[#B4C0BB]">Paused</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevStage}
              className="p-1.5 rounded-full bg-[#0A1115] hover:bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-[#B4C0BB] hover:text-[#F3F7F5] transition-colors shadow-sm"
              aria-label="Previous Stage"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextStage}
              className="p-1.5 rounded-full bg-[#0A1115] hover:bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-[#B4C0BB] hover:text-[#F3F7F5] transition-colors shadow-sm"
              aria-label="Next Stage"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs with Sliding Layout Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-6 relative">
        {stages.map((stage, idx) => {
          const isActive = idx === activeStageIndex;
          return (
            <button
              key={stage.id}
              onClick={() => selectStage(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-fast relative overflow-hidden ${
                isActive
                  ? 'border-[#063B2C] shadow-sm bg-[#0A1115]'
                  : 'bg-[#04070A]/70 border-[rgba(255,255,255,0.09)] hover:bg-[#0A1115] hover:border-[#CADCD2]'
              }`}
            >
              {/* Smooth Framer Motion Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-stage-pill"
                  className="absolute inset-0 bg-[rgba(52,229,165,0.10)] border-2 border-[#063B2C] rounded-2xl -z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Progress bar inside the active tab when playing */}
              {isActive && isPlaying && (
                <motion.div
                  key={`progress-${activeStageIndex}`}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4.2, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-[#126B50] rounded-full z-10"
                />
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span
                    className={`font-bold ${
                      isActive ? 'text-[#34E5A5]' : 'text-[#B4C0BB]'
                    }`}
                  >
                    STAGE {stage.stepNum}
                  </span>
                  <span className="text-[#7F8C86]">{stage.latency}</span>
                </div>
                <div
                  className={`text-xs font-semibold line-clamp-1 ${
                    isActive ? 'text-[#F3F7F5]' : 'text-[#B4C0BB]'
                  }`}
                >
                  {stage.name.replace(/^\d+\.\s*/, '')}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Pipeline Timeline Flow Line */}
      <div className="hidden sm:flex items-center justify-between px-6 py-2 mb-6 bg-[rgba(255,255,255,0.035)] rounded-full border border-[rgba(255,255,255,0.09)] text-xs font-mono text-[#B4C0BB]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
          <span className="text-[#F3F7F5] font-semibold">Active Execution Pipeline:</span>
          <span className="text-[#34E5A5] font-mono">Stage {activeStageIndex + 1} of 5</span>
        </div>
        <div className="flex items-center gap-3">
          {stages.map((s, i) => (
            <React.Fragment key={s.id}>
              <span
                className={`transition-colors duration-fast ${
                  i === activeStageIndex
                    ? 'text-[#34E5A5] font-bold underline decoration-2 underline-offset-4'
                    : i < activeStageIndex
                    ? 'text-[#10B981]'
                    : 'text-[#CADCD2]'
                }`}
              >
                {s.stepNum}
              </span>
              {i < stages.length - 1 && <span className="text-[#CADCD2]">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stage Deep Dive Telemetry Box with Fluid Slide Transitions */}
      <div className="bg-[#0A1115] border border-[rgba(255,255,255,0.09)] rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden min-h-[380px] relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full space-y-6"
          >
            {/* Stage Title and Latency Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[rgba(255,255,255,0.09)]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] font-bold">
                  STAGE {current.stepNum} • {current.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#F3F7F5] font-display">
                  {current.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#B4C0BB]">Stage Time Budget:</span>
                <span className="text-[#34E5A5] font-bold bg-[rgba(52,229,165,0.10)] px-2.5 py-0.5 rounded-full border border-[rgba(52,229,165,0.28)]">
                  {current.latency}
                </span>
              </div>
            </div>

            {/* Stage Summary */}
            <p className="text-sm text-[#B4C0BB] leading-relaxed">
              {current.summary}
            </p>

            {/* Technical Invariants & Security Controls Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Technical Invariants Card */}
              <div className="bg-[rgba(255,255,255,0.035)] p-5 rounded-2xl border border-[rgba(255,255,255,0.09)] space-y-3">
                <div className="text-[11px] font-mono text-[#F3F7F5] font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#34E5A5]" />
                  <span>Core Invariants & Technical Details</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#B4C0BB]">
                  {current.technicalDetails.map((detail, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 + 0.1, duration: 0.25 }}
                      className="flex items-start gap-2.5"
                    >
                      <span className="text-[#34E5A5] font-bold text-xs leading-4 shrink-0">›</span>
                      <span className="leading-relaxed text-[#F3F7F5]">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Security Controls Card */}
              <div className="bg-[rgba(255,255,255,0.035)] p-5 rounded-2xl border border-[rgba(255,255,255,0.09)] space-y-3">
                <div className="text-[11px] font-mono text-[#F3F7F5] font-semibold uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Security Controls & Sandboxing</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#B4C0BB]">
                  {current.securityControls.map((ctrl, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 + 0.15, duration: 0.25 }}
                      className="flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-[#F3F7F5]">{ctrl}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Stepper Action */}
            <div className="pt-3 flex items-center justify-between text-xs font-mono text-[#B4C0BB] border-t border-[rgba(255,255,255,0.09)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Zero Execution Sandbox Enforced</span>
              </span>

              <button
                type="button"
                onClick={nextStage}
                className="inline-flex items-center gap-1.5 text-[#34E5A5] font-semibold hover:underline"
              >
                <span>Advance to next stage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
