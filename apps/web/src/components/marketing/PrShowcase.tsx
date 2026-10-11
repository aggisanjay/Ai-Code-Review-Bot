'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  CheckCircle2,
  GitPullRequest,
  AlertTriangle,
  Code2,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export function PrShowcase() {
  const [selectedFinding, setSelectedFinding] = useState<number>(0);
  const [showPatch, setShowPatch] = useState<boolean>(true);

  const findings = [
    {
      id: 0,
      severity: 'CRITICAL',
      category: 'SECURITY',
      title: 'Hardcoded Cryptographic Fallback Secret in JWT Verification',
      file: 'src/services/token.service.ts',
      lines: 'Lines 42-45',
      confidence: 98,
      explanation:
        'When process.env.JWT_REFRESH_SECRET is unset, token verification falls back to a static string. An attacker could forge arbitrary administrator tokens if the variable is omitted in staging or production.',
      evidence:
        'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";\nreturn jwt.verify(token, secret);',
      remediation:
        'Throw a fatal configuration error during startup if JWT_REFRESH_SECRET is not defined. Never allow a hardcoded default for secrets.',
      patch:
        'const secret = process.env.JWT_REFRESH_SECRET;\nif (!secret) {\n  throw new ConfigurationError("FATAL: JWT_REFRESH_SECRET is required");\n}\nreturn jwt.verify(token, secret);',
    },
    {
      id: 1,
      severity: 'HIGH',
      category: 'SECURITY',
      title: 'TOCTOU Race Condition in Redis Token Blacklist Revocation',
      file: 'src/services/session.service.ts',
      lines: 'Lines 112-118',
      confidence: 92,
      explanation:
        'Asynchronous separate GET and SET operations on Redis permit concurrent requests to consume a revoked refresh token simultaneously during the network delay gap.',
      evidence:
        'const isRevoked = await redis.get(`blacklist:${tokenId}`);\nif (isRevoked) throw new UnauthorizedException();\nawait redis.set(`blacklist:${tokenId}`, "1");',
      remediation:
        'Use Redis atomic transaction (SET NX) to check and invalidate the token in a single atomic instruction.',
      patch:
        'const wasSet = await redis.set(`blacklist:${tokenId}`, "1", "EX", 86400, "NX");\nif (!wasSet) {\n  throw new UnauthorizedException("Token has already been consumed");\n}',
    },
    {
      id: 2,
      severity: 'MEDIUM',
      category: 'PERFORMANCE',
      title: 'Missing Rate Limiting on Asymmetric Crypto Refresh Endpoint',
      file: 'src/controllers/auth.controller.ts',
      lines: 'Lines 78-82',
      confidence: 88,
      explanation:
        'Cryptographic verification consumes CPU resources. Unbounded requests to /auth/refresh can saturate node event loops without throttling.',
      evidence:
        '@Post("refresh")\nasync refreshToken(@Req() req: Request) { ... }',
      remediation:
        'Apply the standard rate-limit decorator (@Throttle({ default: { limit: 10, ttl: 60000 } })).',
      patch:
        '@Throttle({ default: { limit: 10, ttl: 60000 } })\n@Post("refresh")\nasync refreshToken(@Req() req: Request) { ... }',
    },
  ];

  const current = findings[selectedFinding];

  return (
    <div className="w-full max-w-6xl mx-auto my-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">acme-cloud/auth-service#142</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Open PR
              </span>
            </div>
            <p className="text-sm text-slate-400">feat(auth): Add JWT refresh token rotation and cookie session handler</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-amber-400 border border-amber-500/30 font-medium">
            Sample Product Data
          </span>
        </div>
      </div>

      {/* Main Interactive Showcase Card */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Top Summary Bar */}
        <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" /> OVERALL RISK: CRITICAL
            </span>
            <span className="text-xs text-slate-400">
              Evaluated 4 files (+184, -32 lines) in <span className="text-slate-200 font-mono">8.4s</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">1 Critical</span>
            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono">1 High</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">1 Medium</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">3 Passed Checks</span>
          </div>
        </div>

        {/* 2-Column Split: Findings List & Detailed Code Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          {/* Left Column: Finding Selector */}
          <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-950/40 p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
              Detected Findings ({findings.length})
            </div>

            {findings.map((finding, idx) => (
              <button
                key={finding.id}
                onClick={() => setSelectedFinding(idx)}
                className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                  selectedFinding === idx
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-md'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : finding.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {finding.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{finding.confidence}% confidence</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{finding.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
                  <span>{finding.file}</span>
                  <span>•</span>
                  <span>{finding.lines}</span>
                </div>
              </button>
            ))}

            <div className="p-3 mt-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
              <span>
                <strong>Senior Reviewer Agent:</strong> Findings are verified with evidence grounding before posting inline GitHub comments.
              </span>
            </div>
          </div>

          {/* Right Column: Code & Remediation Inspector */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-950/60">
            <div>
              {/* Finding Title & File Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
                    <span>{current.file}</span>
                    <span>•</span>
                    <span className="text-indigo-400">{current.lines}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{current.title}</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {current.category}
                </span>
              </div>

              {/* Explanation */}
              <div className="mb-4 text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-100 block mb-1">Risk Impact:</span>
                {current.explanation}
              </div>

              {/* Code Evidence View */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <Code2 className="w-3.5 h-3.5" /> Flagged Code in Pull Request:
                  </span>
                </div>
                <pre className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-200 font-mono text-xs overflow-x-auto whitespace-pre">
                  {current.evidence}
                </pre>
              </div>

              {/* Suggested Patch View Toggle */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Zap className="w-3.5 h-3.5" /> ReviewFlow Actionable Remediation:
                  </span>
                  <button
                    onClick={() => setShowPatch(!showPatch)}
                    className="text-indigo-400 hover:text-indigo-300 font-sans text-xs underline"
                  >
                    {showPatch ? 'Hide Suggested Patch' : 'View Suggested Patch'}
                  </button>
                </div>
                <p className="text-xs text-slate-300 mb-2">{current.remediation}</p>

                {showPatch && (
                  <motion.pre
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 font-mono text-xs overflow-x-auto whitespace-pre"
                  >
                    {current.patch}
                  </motion.pre>
                )}
              </div>
            </div>

            {/* Bottom Actions simulated */}
            <div className="pt-4 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                Line comment published directly to GitHub PR
              </span>
              <a
                href="/dashboard/reviews/pr-142"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Inspect Full Review in Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
