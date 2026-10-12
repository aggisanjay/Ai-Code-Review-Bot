'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  GitPullRequest,
  GitBranch,
  GitCommit,
  Check,
  Code2,
  FileCode2,
  Sparkles,
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
    <div className="w-full max-w-6xl mx-auto my-10">
      {/* GitHub PR Meta Header */}
      <div className="bg-white border border-[#E4EAE6] rounded-t-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sleek-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center text-[#126B50] shadow-sm">
            <GitPullRequest className="w-4 h-4 text-[#126B50]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#66736D]">acme-cloud / auth-service</span>
              <span className="text-[#C7E4D6]">/</span>
              <span className="font-semibold text-xs text-[#14211D]">#142</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-mono font-medium">
                Open PR
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F9F8] text-[#66736D] border border-[#E4EAE6] font-mono font-medium">
                Interactive Sandbox • Live AST
              </span>
            </div>
            <div className="text-xs font-semibold text-[#14211D] mt-1 font-display">
              feat(auth): Add JWT refresh token rotation and cookie session handler
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE6] text-[#14211D]">
            <GitBranch className="w-3.5 h-3.5 text-[#66736D]" />
            <span className="text-[#66736D]">feature/jwt-rotation</span>
            <span className="text-[#66736D]">→</span>
            <span className="font-medium text-[#14211D]">main</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E4EAE6] text-[#66736D]">
            <GitCommit className="w-3.5 h-3.5 text-[#66736D]" />
            <span className="font-medium text-[#14211D]">8f2a1b9</span>
          </div>
        </div>
      </div>

      {/* Main Review Window */}
      <div className="bg-white border-x border-b border-[#E4EAE6] rounded-b-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-sleek-lg">
        {/* Left Column: Finding Selector & Remediation Details */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#E4EAE6] bg-[#F7F9F8] p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#66736D]">
                Identified Findings ({findings.length})
              </div>
              <div className="text-[11px] font-mono text-[#126B50] font-semibold bg-[#EAF5EF] px-2 py-0.5 rounded-full border border-[#C7E4D6]">
                100% Grounded
              </div>
            </div>

            {/* Findings Tab List */}
            <div className="space-y-2.5">
              {findings.map((f, idx) => {
                const isSelected = idx === selectedFinding;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFinding(idx);
                      setApplied(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'bg-white border-[#126B50] shadow-sleek-sm ring-1 ring-[#126B50]/20'
                        : 'bg-white/80 border-[#E4EAE6] hover:bg-white hover:border-[#D5DFDA]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            f.severity === 'CRITICAL'
                              ? 'bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4]'
                              : f.severity === 'HIGH'
                              ? 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]'
                              : 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6]'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-[11px] font-mono text-[#66736D] font-medium">{f.ruleId}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#66736D]">{f.lines}</span>
                    </div>
                    <div className="font-semibold text-[#14211D] line-clamp-1">{f.title}</div>
                    <div className="text-[11px] text-[#66736D] font-mono mt-1">{f.file}</div>
                  </button>
                );
              })}
            </div>

            {/* Finding Deep Dive Card */}
            <div className="pt-3 border-t border-[#E4EAE6] space-y-2.5">
              <div className="text-[11px] font-mono text-[#66736D] flex items-center justify-between">
                <span>{current.cwe}</span>
                <span className="text-[#126B50] font-semibold">Confidence: {current.confidence}%</span>
              </div>
              <p className="text-xs text-[#14211D] leading-relaxed bg-white p-3.5 rounded-xl border border-[#E4EAE6]">
                {current.explanation}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E4EAE6] mt-4 flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-[#66736D]">
              Inline GitHub Check Ready
            </div>
            <button
              onClick={() => setApplied(true)}
              disabled={applied}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                applied
                  ? 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-semibold'
                  : 'btn-primary'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#126B50]" />
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
        <div className="lg:col-span-7 bg-[#14211D] flex flex-col justify-between text-zinc-100">
          <div>
            {/* Diff Header Bar */}
            <div className="bg-[#0B1512] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-300">
                <FileCode2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-zinc-200">{current.file}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Deterministic AST Diff
              </div>
            </div>

            {/* Code Diff Display */}
            <div className="font-mono text-xs overflow-x-auto divide-y divide-white/[0.04] p-2">
              {current.diffLines.map((line, idx) => {
                const isDel = line.type === 'del';
                const isAdd = line.type === 'add';

                return (
                  <div
                    key={idx}
                    className={`flex items-stretch py-0.5 px-3 leading-5 rounded select-text ${
                      isDel
                        ? 'bg-rose-500/15 text-rose-200'
                        : isAdd
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'text-zinc-300'
                    }`}
                  >
                    {/* Line Numbers */}
                    <div className="w-8 shrink-0 text-right pr-3 select-none text-[11px] text-zinc-500 font-mono">
                      {line.oldLine || ''}
                    </div>
                    <div className="w-8 shrink-0 text-right pr-3 select-none text-[11px] text-zinc-500 font-mono">
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
            <div className="m-4 rounded-xl bg-white border border-[#E4EAE6] overflow-hidden shadow-sleek-md text-[#14211D]">
              <div className="bg-[#F7F9F8] px-4 py-2.5 border-b border-[#E4EAE6] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#126B50]" />
                  </div>
                  <span className="font-semibold text-[#14211D] text-xs">ReviewFlow AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EAF5EF] text-[#126B50] font-mono font-medium">
                    bot
                  </span>
                  <span className="text-[10px] text-[#66736D] font-mono">automated review</span>
                </div>
                <span className="text-[10px] text-[#66736D] font-mono">posted via GitHub Check</span>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <div className="text-[#14211D] font-semibold">
                  Suggested change
                </div>
                <div className="text-[#66736D] text-[11px] leading-relaxed">
                  {current.suggestion}
                </div>

                <div className="pt-2 flex items-center gap-3 text-xs font-mono">
                  <button
                    onClick={() => setApplied(true)}
                    className="px-3 py-1.5 rounded-lg btn-primary text-white text-[11px] font-medium"
                  >
                    Commit suggestion
                  </button>
                  <span className="text-[11px] text-[#66736D]">Verified cryptographic patch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
