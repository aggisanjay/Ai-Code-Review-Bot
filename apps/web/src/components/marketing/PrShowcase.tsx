'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  GitPullRequest,
  GitBranch,
  GitCommit,
  Check,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ChevronRight,
  Terminal,
  FileCode2,
  Sparkles,
  Zap,
} from 'lucide-react';

export function PrShowcase() {
  const [selectedFinding, setSelectedFinding] = useState<number>(0);
  const [applied, setApplied] = useState<boolean>(false);

  const findings = [
    {
      id: 0,
      severity: 'CRITICAL',
      category: 'SECURITY',
      ruleId: 'SEC-JWT-FALLBACK',
      title: 'Cryptographic Fallback Secret in Token Verification',
      file: 'src/services/token.service.ts',
      lines: 'L42-45',
      confidence: 99,
      cwe: 'CWE-798: Use of Hardcoded Credentials',
      explanation:
        'When process.env.JWT_REFRESH_SECRET is unset, token verification falls back to a static string. An attacker could forge arbitrary administrator tokens if the variable is omitted in staging or production.',
      diffLines: [
        { type: 'ctx', oldLine: 41, newLine: 41, text: '  public verifyRefreshToken(token: string): TokenPayload {' },
        { type: 'del', oldLine: 42, newLine: null, text: '-   const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";' },
        { type: 'del', oldLine: 43, newLine: null, text: '-   return jwt.verify(token, secret);' },
        { type: 'add', oldLine: null, newLine: 42, text: '+   const secret = process.env.JWT_REFRESH_SECRET;' },
        { type: 'add', oldLine: null, newLine: 43, text: '+   if (!secret) {' },
        { type: 'add', oldLine: null, newLine: 44, text: '+     throw new ConfigurationError("FATAL: JWT_REFRESH_SECRET is not configured");' },
        { type: 'add', oldLine: null, newLine: 45, text: '+   }' },
        { type: 'add', oldLine: null, newLine: 46, text: '+   return jwt.verify(token, secret);' },
        { type: 'ctx', oldLine: 44, newLine: 47, text: '  }' },
      ],
      suggestion:
        'Throw a fatal configuration exception if JWT_REFRESH_SECRET is omitted. Never allow a hardcoded fallback string for cryptographic verification keys.',
    },
    {
      id: 1,
      severity: 'HIGH',
      category: 'CONCURRENCY',
      ruleId: 'RACE-REDIS-REVOKE',
      title: 'TOCTOU Race Condition in Redis Token Invalidation',
      file: 'src/services/session.service.ts',
      lines: 'L112-116',
      confidence: 94,
      cwe: 'CWE-362: Race Condition',
      explanation:
        'Separate async GET and SET operations on Redis permit concurrent requests to consume a single revoked refresh token simultaneously during the network delay gap.',
      diffLines: [
        { type: 'ctx', oldLine: 111, newLine: 111, text: '  public async revokeToken(tokenId: string): Promise<void> {' },
        { type: 'del', oldLine: 112, newLine: null, text: '-   const isRevoked = await redis.get(`blacklist:${tokenId}`);' },
        { type: 'del', oldLine: 113, newLine: null, text: '-   if (isRevoked) throw new UnauthorizedException("Already revoked");' },
        { type: 'del', oldLine: 114, newLine: null, text: '-   await redis.set(`blacklist:${tokenId}`, "1");' },
        { type: 'add', oldLine: null, newLine: 112, text: '+   const wasSet = await redis.set(`blacklist:${tokenId}`, "1", "EX", 86400, "NX");' },
        { type: 'add', oldLine: null, newLine: 113, text: '+   if (!wasSet) {' },
        { type: 'add', oldLine: null, newLine: 114, text: '+     throw new UnauthorizedException("Token already consumed or invalid");' },
        { type: 'add', oldLine: null, newLine: 115, text: '+   }' },
        { type: 'ctx', oldLine: 115, newLine: 116, text: '  }' },
      ],
      suggestion:
        'Use Redis atomic transaction (SET NX) to atomically check and set the revocation mark in a single operation.',
    },
    {
      id: 2,
      severity: 'MEDIUM',
      category: 'PERFORMANCE',
      ruleId: 'PERF-RATE-LIMIT',
      title: 'Unbounded Asymmetric Crypto Endpoint Without Rate Limiting',
      file: 'src/controllers/auth.controller.ts',
      lines: 'L78-82',
      confidence: 91,
      cwe: 'CWE-770: Allocation of Resources Without Limits',
      explanation:
        'Cryptographic verification consumes significant CPU cycles. Unbounded calls to /auth/refresh can saturate node event loops during traffic spikes.',
      diffLines: [
        { type: 'ctx', oldLine: 77, newLine: 77, text: '  // Refresh authentication session' },
        { type: 'del', oldLine: 78, newLine: null, text: '- @Post("refresh")' },
        { type: 'del', oldLine: 79, newLine: null, text: '- async refreshToken(@Req() req: Request) {' },
        { type: 'add', oldLine: null, newLine: 78, text: '+ @Throttle({ default: { limit: 10, ttl: 60000 } })' },
        { type: 'add', oldLine: null, newLine: 79, text: '+ @Post("refresh")' },
        { type: 'add', oldLine: null, newLine: 80, text: '+ async refreshToken(@Req() req: Request) {' },
        { type: 'ctx', oldLine: 80, newLine: 81, text: '    return this.authService.refresh(req.cookies.jwt);' },
      ],
      suggestion:
        'Enforce rate limiting on the token refresh route with @Throttle decorator to prevent resource exhaustion.',
    },
  ];

  const current = findings[selectedFinding];

  return (
    <div className="w-full max-w-6xl mx-auto my-8">
      {/* GitHub PR Meta Header */}
      <div className="bg-[#0B0D12] border border-white/[0.08] rounded-t-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300">
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-400">acme-cloud / auth-service</span>
              <span className="text-zinc-600">/</span>
              <span className="font-semibold text-xs text-white">#142</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                Open PR
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                Interactive Sandbox • Sample Data
              </span>
            </div>
            <div className="text-xs text-zinc-300 font-medium mt-0.5">
              feat(auth): Add JWT refresh token rotation and cookie session handler
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.06] text-zinc-300">
            <GitBranch className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-400">feature/jwt-rotation</span>
            <span className="text-zinc-500">→</span>
            <span className="text-white">main</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.06] text-zinc-300">
            <GitCommit className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-300">8f2a1b9</span>
          </div>
        </div>
      </div>

      {/* Main Review Window */}
      <div className="bg-[#08090C] border-x border-b border-white/[0.08] rounded-b-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl">
        {/* Left Column: Finding Selector & Remediation Details */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0A0C10] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Identified Findings ({findings.length})
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Grounding: 100% Verified
              </div>
            </div>

            {/* Findings Tab List */}
            <div className="space-y-2">
              {findings.map((f, idx) => {
                const isSelected = idx === selectedFinding;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFinding(idx);
                      setApplied(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'bg-[#121620] border-blue-500/50 shadow-sm'
                        : 'bg-zinc-900/30 border-white/[0.05] hover:bg-zinc-900/60 hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            f.severity === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : f.severity === 'HIGH'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{f.ruleId}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{f.lines}</span>
                    </div>
                    <div className="font-medium text-zinc-200 line-clamp-1">{f.title}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-1">{f.file}</div>
                  </button>
                );
              })}
            </div>

            {/* Finding Deep Dive Card */}
            <div className="pt-2 border-t border-white/[0.06] space-y-3">
              <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span>{current.cwe}</span>
                <span className="text-emerald-400">Confidence: {current.confidence}%</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-[#0E1017] p-3 rounded-md border border-white/[0.05]">
                {current.explanation}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/[0.06] mt-4 flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-zinc-500">
              Inline PR Comment Ready
            </div>
            <button
              onClick={() => setApplied(true)}
              disabled={applied}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                applied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'btn-primary'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Patch Committed</span>
                </>
              ) : (
                <>
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Apply 1-Click Suggestion</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Code Diff Hunk with GitHub-Style Inline Comment */}
        <div className="lg:col-span-7 bg-[#08090C] flex flex-col justify-between">
          <div>
            {/* Diff Header Bar */}
            <div className="bg-[#0B0D12] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-300">
                <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{current.file}</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                Unified Diff Viewer
              </div>
            </div>

            {/* Code Diff Display */}
            <div className="font-mono text-xs overflow-x-auto divide-y divide-white/[0.02]">
              {current.diffLines.map((line, idx) => {
                const isDel = line.type === 'del';
                const isAdd = line.type === 'add';

                return (
                  <div
                    key={idx}
                    className={`flex items-stretch py-0.5 px-3 leading-5 select-text ${
                      isDel
                        ? 'bg-rose-500/10 text-rose-200'
                        : isAdd
                        ? 'bg-emerald-500/10 text-emerald-200'
                        : 'text-zinc-400'
                    }`}
                  >
                    {/* Line Numbers */}
                    <div className="w-8 shrink-0 text-right pr-3 select-none text-[11px] text-zinc-600 font-mono">
                      {line.oldLine || ''}
                    </div>
                    <div className="w-8 shrink-0 text-right pr-3 select-none text-[11px] text-zinc-600 font-mono">
                      {line.newLine || ''}
                    </div>

                    {/* Diff Marker & Content */}
                    <div className="w-4 shrink-0 select-none text-[11px] font-bold">
                      {isDel ? '-' : isAdd ? '+' : ' '}
                    </div>
                    <div className="flex-1 whitespace-pre pl-1 text-[11px]">
                      {line.text.replace(/^[+-]\s*/, '')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inline ReviewFlow AI Comment Block */}
            <div className="m-4 rounded-lg bg-[#0D0F16] border border-blue-500/30 overflow-hidden shadow-lg">
              <div className="bg-[#121520] px-3.5 py-2 border-b border-blue-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="font-semibold text-zinc-200 text-xs">ReviewFlow AI</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                    bot
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">automated review</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">posted via GitHub Check</span>
              </div>

              <div className="p-3.5 space-y-2 text-xs">
                <div className="text-zinc-300 font-medium">
                  Suggested change
                </div>
                <div className="text-zinc-400 text-[11px] leading-relaxed">
                  {current.suggestion}
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => setApplied(true)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08] transition-all text-[11px] font-medium"
                  >
                    Commit suggestion
                  </button>
                  <span className="text-[11px] text-zinc-500">Sign-off required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
