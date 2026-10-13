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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-[#E2EDE6] gap-4">
        <div>
          <div className="text-[11px] font-mono text-[#063B2C] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Live Pipeline Architecture Execution</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111C18] tracking-tight font-display">
            Defense in Depth Review Pipeline
          </h2>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono text-[#52635B] bg-[#F8FCFA] border border-[#E2EDE6] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#063B2C]" />
            <span>Avg Pipeline Latency: </span>
            <span className="text-[#111C18] font-bold">~5.4s</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F8FCFA] border border-[#E2EDE6] text-xs font-medium text-[#111C18] shadow-sm transition-all duration-fast"
            title={isPlaying ? 'Pause Auto-Simulation' : 'Play Auto-Simulation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-[#063B2C]" />
                <span className="text-[11px] font-mono font-semibold text-[#063B2C]">Live Auto-Play</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#52635B]" />
                <span className="text-[11px] font-mono text-[#52635B]">Paused</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevStage}
              className="p-1.5 rounded-full bg-white hover:bg-[#F8FCFA] border border-[#E2EDE6] text-[#52635B] hover:text-[#111C18] transition-colors shadow-sm"
              aria-label="Previous Stage"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextStage}
              className="p-1.5 rounded-full bg-white hover:bg-[#F8FCFA] border border-[#E2EDE6] text-[#52635B] hover:text-[#111C18] transition-colors shadow-sm"
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
                  ? 'border-[#063B2C] shadow-sm bg-white'
                  : 'bg-white/70 border-[#E2EDE6] hover:bg-white hover:border-[#CADCD2]'
              }`}
            >
              {/* Smooth Framer Motion Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-stage-pill"
                  className="absolute inset-0 bg-[#EBF7F0] border-2 border-[#063B2C] rounded-2xl -z-0"
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
                  className="absolute bottom-0 left-0 h-1 bg-[#063B2C] rounded-full z-10"
                />
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span
                    className={`font-bold ${
                      isActive ? 'text-[#063B2C]' : 'text-[#52635B]'
                    }`}
                  >
                    STAGE {stage.stepNum}
                  </span>
                  <span className="text-[#7A8C84]">{stage.latency}</span>
                </div>
                <div
                  className={`text-xs font-semibold line-clamp-1 ${
                    isActive ? 'text-[#111C18]' : 'text-[#52635B]'
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
      <div className="hidden sm:flex items-center justify-between px-6 py-2 mb-6 bg-[#F8FCFA] rounded-full border border-[#E2EDE6] text-xs font-mono text-[#52635B]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
          <span className="text-[#111C18] font-semibold">Active Execution Pipeline:</span>
          <span className="text-[#063B2C] font-mono">Stage {activeStageIndex + 1} of 5</span>
        </div>
        <div className="flex items-center gap-3">
          {stages.map((s, i) => (
            <React.Fragment key={s.id}>
              <span
                className={`transition-colors duration-fast ${
                  i === activeStageIndex
                    ? 'text-[#063B2C] font-bold underline decoration-2 underline-offset-4'
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
      <div className="bg-white border border-[#E2EDE6] rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden min-h-[380px] relative">
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
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2EDE6]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#EBF7F0] text-[#063B2C] border border-[#C3EBD7] font-bold">
                  STAGE {current.stepNum} • {current.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#111C18] font-display">
                  {current.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#52635B]">Stage Time Budget:</span>
                <span className="text-[#063B2C] font-bold bg-[#EBF7F0] px-2.5 py-0.5 rounded-full border border-[#C3EBD7]">
                  {current.latency}
                </span>
              </div>
            </div>

            {/* Stage Summary */}
            <p className="text-sm text-[#52635B] leading-relaxed">
              {current.summary}
            </p>

            {/* Technical Invariants & Security Controls Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Technical Invariants Card */}
              <div className="bg-[#F8FCFA] p-5 rounded-2xl border border-[#E2EDE6] space-y-3">
                <div className="text-[11px] font-mono text-[#111C18] font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#063B2C]" />
                  <span>Core Invariants & Technical Details</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#52635B]">
                  {current.technicalDetails.map((detail, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 + 0.1, duration: 0.25 }}
                      className="flex items-start gap-2.5"
                    >
                      <span className="text-[#063B2C] font-bold text-xs leading-4 shrink-0">›</span>
                      <span className="leading-relaxed text-[#111C18]">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Security Controls Card */}
              <div className="bg-[#F8FCFA] p-5 rounded-2xl border border-[#E2EDE6] space-y-3">
                <div className="text-[11px] font-mono text-[#111C18] font-semibold uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Security Controls & Sandboxing</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#52635B]">
                  {current.securityControls.map((ctrl, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 + 0.15, duration: 0.25 }}
                      className="flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-[#111C18]">{ctrl}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Stepper Action */}
            <div className="pt-3 flex items-center justify-between text-xs font-mono text-[#52635B] border-t border-[#E2EDE6]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Zero Execution Sandbox Enforced</span>
              </span>

              <button
                type="button"
                onClick={nextStage}
                className="inline-flex items-center gap-1.5 text-[#063B2C] font-semibold hover:underline"
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
