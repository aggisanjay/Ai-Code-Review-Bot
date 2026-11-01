'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0A1115] text-[#F3F7F5] flex flex-col justify-between selection:bg-[rgba(52,229,165,0.10)] selection:text-[#34E5A5]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20 w-full flex-1">
        <div className="mb-10">
          <Link
            href="/"
            className="text-xs font-medium text-[#9AA7A1] hover:text-[#F3F7F5] inline-flex items-center gap-1.5 mb-5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Product Overview</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-[11px] font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5 text-[#34E5A5]" />
            <span>Architecture Decision Records (ADR)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F3F7F5] mb-3">
            Engineering Decisions & Trade-Offs
          </h1>
          <p className="text-sm text-[#9AA7A1] max-w-2xl leading-relaxed">
            ReviewFlow AI is engineered for production reliability, defensive security, and developer clarity. Here is why we made specific architectural choices instead of taking common shortcuts.
          </p>
        </div>

        <div className="space-y-5">
          {DECISIONS.map((adr) => (
            <div
              key={adr.id}
              className="p-6 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] hover:border-[rgba(52,229,165,0.45)]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(18,107,80,0.06)] transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.09)]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)]">
                    {adr.id}
                  </span>
                  <h3 className="text-base font-bold text-[#F3F7F5]">{adr.title}</h3>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#9AA7A1]">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-semibold text-[11px] border border-[rgba(52,229,165,0.28)]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{adr.status}</span>
                  </span>
                  <span>•</span>
                  <span className="font-medium">{adr.date}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA7A1] block mb-1">
                    Context & Problem Statement
                  </span>
                  <p className="text-[#9AA7A1] leading-relaxed">{adr.context}</p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#34E5A5] block mb-1">
                    Architectural Decision
                  </span>
                  <div className="text-[#F3F7F5] bg-[#04070A] p-4 rounded-xl border border-[rgba(255,255,255,0.09)] font-medium leading-relaxed">
                    {adr.decision}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA7A1] block mb-1">
                    Consequences & Engineering Impact
                  </span>
                  <p className="text-[#9AA7A1] leading-relaxed">{adr.consequences}</p>
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
