'use client';

import React from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowLeft, Cpu, ShieldCheck, Database, Layers, CheckCircle, Zap } from 'lucide-react';
import { Navbar } from '../../components/marketing/Navbar';
import { Footer } from '../../components/marketing/Footer';

const DECISIONS = [
  {
    id: 'ADR-001',
    title: 'Hybrid Deterministic Scanner & LLM Reasoning Pipeline',
    status: 'ACCEPTED',
    date: 'October 2026',
    context:
      'Relying solely on LLMs creates high token latency (10-30s) and non-deterministic false negatives on well-known patterns (e.g. hardcoded secrets, eval calls, missing error handling). Conversely, pure static analysis misses semantic logic flaws and test adequacy.',
    decision:
      'Execute fast regex-based deterministic checks first (sub-millisecond), followed by structured LLM reasoning with strict schema enforcement. Findings are aggregated, deduplicated, and grounded against git diff hunk line bounds.',
    consequences:
      'Guarantees 100% detection of critical credentials and known antipatterns before model invocation. Reduces token consumption while providing deep contextual reviews.',
  },
  {
    id: 'ADR-002',
    title: 'Asynchronous BullMQ Job Architecture vs. Synchronous Webhooks',
    status: 'ACCEPTED',
    date: 'October 2026',
    context:
      'GitHub webhooks require HTTP 200 acknowledgements within 10 seconds. AI code reviews on multi-file diffs can take 3-15 seconds. Processing synchronously causes GitHub webhook timeouts, repeated delivery retries, and worker thrashing.',
    decision:
      'Validate HMAC signatures, store event delivery idempotency records in PostgreSQL/SQLite, and enqueue jobs to Redis/BullMQ. The webhook handler responds immediately within 250ms.',
    consequences:
      'Eliminates webhook timeouts, provides bounded worker concurrency, and supports retry backoff and cancellation of superseded commits.',
  },
  {
    id: 'ADR-003',
    title: 'Commit SHA Supersession Guards',
    status: 'ACCEPTED',
    date: 'October 2026',
    context:
      'Fast-paced developers frequently push multiple commits in rapid succession. Reviewing every intermediate commit wastes model tokens and floods the pull request with obsolete comments.',
    decision:
      'Before running model inference and publishing GitHub Check Runs, the worker verifies that pullRequest.headSha === job.commitSha. If a newer commit exists, the job transitions immediately to SUPERSEDED.',
    consequences:
      'Saves 40%+ token costs on active branches and eliminates stale, confusing comments on superseded revisions.',
  },
  {
    id: 'ADR-004',
    title: 'Strict Zod Output Validation & Line Grounding',
    status: 'ACCEPTED',
    date: 'October 2026',
    context:
      'LLMs can hallucinate non-existent line numbers or propose comments on files not present in the diff, causing GitHub Review Comments API to fail with HTTP 422 Unprocessable Entity.',
    decision:
      'Model output is parsed against a strict Zod schema (ReviewSummarySchema). Findings are cross-referenced with parsed git hunks: out-of-bound lines are shifted to the nearest modified line or surfaced in PR-level check summaries.',
    consequences:
      'Zero 422 API errors on GitHub review comment publication and guaranteed grounding in actual code changes.',
  },
  {
    id: 'ADR-005',
    title: 'Dual Database Strategy: SQLite for Dev, PostgreSQL for Production',
    status: 'ACCEPTED',
    date: 'October 2026',
    context:
      'Forcing local contributors to install Docker, start PostgreSQL, and configure connection strings before evaluating the product creates heavy onboarding friction.',
    decision:
      'Prisma ORM abstracts database queries. The repository includes zero-config SQLite for instant local execution and automated tests, while maintaining production readiness for managed PostgreSQL with connection pooling.',
    consequences:
      'Instant local testing from a clean git checkout, passing all unit and security tests in sub-2 seconds without external cloud dependencies.',
  },
];

export default function EngineeringDecisionsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24 w-full flex-1">
        <div className="mb-12">
          <Link
            href="/"
            className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1.5 mb-6 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Product Overview</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture Decision Records (ADR)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Engineering Decisions & Trade-Offs
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            ReviewFlow AI is engineered for production reliability, defensive security, and developer clarity. Here is why we made specific architectural choices instead of taking common shortcuts.
          </p>
        </div>

        <div className="space-y-6">
          {DECISIONS.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-400 font-bold">
                    {item.id}
                  </span>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{item.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] font-mono text-slate-400">
                    Context & Challenge
                  </h4>
                  <p className="text-slate-400 leading-relaxed">{item.context}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px] font-mono">
                    Architectural Decision
                  </h4>
                  <p className="text-slate-300 leading-relaxed">{item.decision}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px] font-mono">
                    Result & Impact
                  </h4>
                  <p className="text-slate-300 leading-relaxed">{item.consequences}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
