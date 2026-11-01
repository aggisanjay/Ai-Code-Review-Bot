'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  GitPullRequest,
  GitBranch,
  GitCommit,
  Check,
  Code2,
  FileCode2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

const MOTION_EASE = [0.4, 0, 0.2, 1] as const;

export function PrShowcase() {
  const [selectedFinding, setSelectedFinding] = useState<number>(0);
  const [appliedState, setAppliedState] = useState<Record<number, boolean>>({});
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

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
      unpatchedDiff: [
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
      patchedCode: [
        { type: 'ctx', oldLine: 41, newLine: 41, text: '  public verifyRefreshToken(token: string): TokenPayload {' },
        { type: 'add', oldLine: null, newLine: 42, text: '    const secret = process.env.JWT_REFRESH_SECRET;' },
        { type: 'add', oldLine: null, newLine: 43, text: '    if (!secret) {' },
        { type: 'add', oldLine: null, newLine: 44, text: '      throw new ConfigurationError("FATAL: JWT_REFRESH_SECRET is not configured");' },
        { type: 'add', oldLine: null, newLine: 45, text: '    }' },
        { type: 'add', oldLine: null, newLine: 46, text: '    return jwt.verify(token, secret);' },
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
      unpatchedDiff: [
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
      patchedCode: [
        { type: 'ctx', oldLine: 111, newLine: 111, text: '  public async revokeToken(tokenId: string): Promise<void> {' },
        { type: 'add', oldLine: null, newLine: 112, text: '    const wasSet = await redis.set(`blacklist:${tokenId}`, "1", "EX", 86400, "NX");' },
        { type: 'add', oldLine: null, newLine: 113, text: '    if (!wasSet) {' },
        { type: 'add', oldLine: null, newLine: 114, text: '      throw new UnauthorizedException("Token already consumed or invalid");' },
        { type: 'add', oldLine: null, newLine: 115, text: '    }' },
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
      unpatchedDiff: [
        { type: 'ctx', oldLine: 77, newLine: 77, text: '  // Refresh authentication session' },
        { type: 'del', oldLine: 78, newLine: null, text: '- @Post("refresh")' },
        { type: 'del', oldLine: 79, newLine: null, text: '- async refreshToken(@Req() req: Request) {' },
        { type: 'add', oldLine: null, newLine: 78, text: '+ @Throttle({ default: { limit: 10, ttl: 60000 } })' },
        { type: 'add', oldLine: null, newLine: 79, text: '+ @Post("refresh")' },
        { type: 'add', oldLine: null, newLine: 80, text: '+ async refreshToken(@Req() req: Request) {' },
        { type: 'ctx', oldLine: 80, newLine: 81, text: '    return this.authService.refresh(req.cookies.jwt);' },
      ],
      patchedCode: [
        { type: 'ctx', oldLine: 77, newLine: 77, text: '  // Refresh authentication session' },
        { type: 'add', oldLine: null, newLine: 78, text: '  @Throttle({ default: { limit: 10, ttl: 60000 } })' },
        { type: 'add', oldLine: null, newLine: 79, text: '  @Post("refresh")' },
        { type: 'add', oldLine: null, newLine: 80, text: '  async refreshToken(@Req() req: Request) {' },
        { type: 'ctx', oldLine: 80, newLine: 81, text: '    return this.authService.refresh(req.cookies.jwt);' },
      ],
      suggestion:
        'Enforce rate limiting on the token refresh route with @Throttle decorator to prevent resource exhaustion.',
    },
  ];

  const current = findings[selectedFinding];
  const isApplied = !!appliedState[selectedFinding];

  const handleApplyCommit = () => {
    setIsCommitting(true);
    setTimeout(() => {
      setIsCommitting(false);
      setAppliedState((prev) => ({ ...prev, [selectedFinding]: true }));
    }, 600);
  };

  const handleResetCommit = () => {
    setAppliedState((prev) => ({ ...prev, [selectedFinding]: false }));
  };

  return (
    <div className="w-full">
      {/* GitHub PR Meta Header */}
      <div className="bg-[#0A1115] border border-[rgba(255,255,255,0.09)] rounded-t-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#126B50] flex items-center justify-center text-white shadow-sm">
            <GitPullRequest className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#B4C0BB]">acme-cloud / auth-service</span>
              <span className="text-[#C3EBD7]">/</span>
              <span className="font-semibold text-xs text-[#F3F7F5]">PR #142</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] font-mono font-bold">
                Open PR
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.035)] text-[#B4C0BB] border border-[rgba(255,255,255,0.09)] font-mono font-medium">
                Live AST • 100% Grounded
              </span>
            </div>
            <div className="text-sm font-bold text-[#F3F7F5] mt-1 font-display">
              feat(auth): Add biometric MFA session verify and token refresh
            </div>
          </div>
        </div>

        {/* Branch Tags */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#B4C0BB]">
          <span className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#34E5A5]" />
            <span>feat/mfa-verify</span>
          </span>
          <span>→</span>
          <span className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] font-semibold text-[#F3F7F5]">
            main
          </span>
        </div>
      </div>

      {/* Main Dual-Pane Inspection Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[rgba(255,255,255,0.09)] rounded-b-3xl bg-[rgba(255,255,255,0.035)] overflow-hidden">
        {/* Left Column: Finding Selector Carousel */}
        <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-[rgba(255,255,255,0.09)] bg-[#0A1115] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[rgba(255,255,255,0.09)]">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B4C0BB] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Identified Findings ({findings.length})</span>
              </div>
              <div className="text-[11px] font-mono text-[#34E5A5] font-semibold bg-[rgba(52,229,165,0.10)] px-2.5 py-0.5 rounded-full border border-[rgba(52,229,165,0.28)]">
                Zero Hallucinations
              </div>
            </div>

            {/* Finding Cards List with Framer Motion Sliding Selection Pill */}
            <div className="space-y-2.5">
              {findings.map((f, idx) => {
                const isSelected = selectedFinding === idx;
                const isItemPatched = !!appliedState[idx];

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFinding(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-fast text-xs relative overflow-hidden ${
                      isSelected
                        ? 'border-[#063B2C] shadow-sm bg-[#0A1115]'
                        : 'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.035)] hover:bg-[#0A1115] hover:border-[#CADCD2]'
                    }`}
                  >
                    {/* Sliding active finding pill */}
                    {isSelected && (
                      <motion.div
                        layoutId="active-finding-pill"
                        className="absolute inset-0 bg-[rgba(52,229,165,0.10)] border-2 border-[#063B2C] rounded-2xl -z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}

                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                            f.severity === 'CRITICAL'
                              ? 'bg-red-50 text-[#FF6B7A] border border-red-200'
                              : f.severity === 'HIGH'
                              ? 'bg-amber-50 text-[#FFB454] border border-amber-200'
                              : 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)]'
                          }`}
                        >
                          {f.severity}
                        </span>

                        <div className="flex items-center gap-2">
                          {isItemPatched && (
                            <span className="text-[10px] font-mono font-bold text-[#10B981] bg-[rgba(52,229,165,0.10)] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[rgba(52,229,165,0.28)]">
                              <Check className="w-3 h-3" />
                              <span>Patched</span>
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-[#7F8C86]">{f.lines}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-[#F3F7F5] line-clamp-2">
                        {f.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[#B4C0BB] pt-0.5">
                        <span className="truncate max-w-[200px]">{f.file}</span>
                        <span className="text-[#34E5A5] font-semibold">{f.confidence}% Grounded</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Finding Detail Explainer Box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: MOTION_EASE }}
              className="pt-3 border-t border-[rgba(255,255,255,0.09)] space-y-2.5"
            >
              <div className="text-[11px] font-mono text-[#B4C0BB] flex items-center justify-between">
                <span>{current.cwe}</span>
                <span className="text-[#34E5A5] font-semibold">Rule: {current.ruleId}</span>
              </div>
              <p className="text-xs text-[#F3F7F5] leading-relaxed bg-[rgba(255,255,255,0.035)] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.09)]">
                {current.explanation}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Interactive Code Diff & Inline Suggestion Canvas */}
        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          {/* File Tab Header with Commit Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.09)]">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#34E5A5]" />
              <span className="font-mono text-xs font-semibold text-[#F3F7F5]">{current.file}</span>
            </div>

            {/* Commit / Revert Button */}
            <div className="flex items-center gap-2">
              {isApplied ? (
                <button
                  type="button"
                  onClick={handleResetCommit}
                  className="px-3 py-1.5 rounded-full bg-[#0A1115] hover:bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-xs font-mono text-[#B4C0BB] hover:text-[#F3F7F5] flex items-center gap-1.5 shadow-sm transition-all duration-fast"
                >
                  <RefreshCw className="w-3 h-3 text-[#B4C0BB]" />
                  <span>Reset Demo Diff</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleApplyCommit}
                disabled={isApplied || isCommitting}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-fast shadow-sm ${
                  isApplied
                    ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] font-bold'
                    : isCommitting
                    ? 'bg-[#0A4D3A] text-white opacity-80 cursor-wait'
                    : 'bg-[#126B50] hover:bg-[#0A4D3A] text-white hover:scale-[1.02]'
                }`}
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing Patch to Branch...</span>
                  </>
                ) : isApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#34E5A5]" />
                    <span>Patch Applied & Verified</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#C3EBD7]" />
                    <span>1-Click Apply Suggested Fix</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Smooth Sliding Code Diff Viewer Container */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.09)] bg-[#0A1115] overflow-hidden shadow-sm min-h-[220px]">
            <div className="bg-[#FAFDFB] px-4 py-2 border-b border-[rgba(255,255,255,0.09)] flex items-center justify-between text-xs font-mono text-[#7F8C86]">
              <span>@@ -{current.lines} @@ Unified Git Diff</span>
              <span className="text-[#34E5A5] font-semibold">
                {isApplied ? 'STATUS: PATCH VERIFIED (CLEAN)' : 'STATUS: UNPATCHED VULNERABILITY'}
              </span>
            </div>

            {/* Sliding Diff Lines with AnimatePresence */}
            <div className="p-3 font-mono text-xs overflow-x-auto leading-relaxed">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${current.id}-${isApplied ? 'patched' : 'unpatched'}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.28, ease: MOTION_EASE }}
                  className="space-y-0.5"
                >
                  {(isApplied ? current.patchedCode : current.unpatchedDiff).map((line, idx) => {
                    const isAdd = line.type === 'add';
                    const isDel = line.type === 'del';

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02, duration: 0.15 }}
                        className={`py-1 px-3 rounded-md flex items-start gap-4 transition-colors ${
                          isAdd
                            ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-medium border-l-4 border-[#10B981]'
                            : isDel
                            ? 'bg-red-50 text-[#FF6B7A] border-l-4 border-red-500 line-through decoration-red-400'
                            : 'text-[#B4C0BB]'
                        }`}
                      >
                        <span className="text-[10px] text-[#A3B8AD] select-none w-8 text-right shrink-0">
                          {line.newLine || line.oldLine}
                        </span>
                        <span className="font-mono whitespace-pre">{line.text}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* GitHub Inline Review Comment Box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`comment-${current.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: MOTION_EASE }}
              className="rounded-2xl border border-[rgba(255,255,255,0.09)] bg-[#0A1115] overflow-hidden shadow-sm"
            >
              {/* Bot Header */}
              <div className="bg-[#FAFDFB] px-4 py-2.5 border-b border-[rgba(255,255,255,0.09)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#126B50] flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-[#F3F7F5] text-xs">ReviewFlow AI Bot</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-semibold border border-[rgba(52,229,165,0.28)]">
                    automated review
                  </span>
                </div>
                <span className="text-[11px] text-[#7F8C86] font-mono">posted via GitHub Checks API</span>
              </div>

              {/* Bot Comment Body */}
              <div className="p-4 space-y-3 text-xs leading-relaxed text-[#F3F7F5]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#FF6B7A] font-mono font-bold text-[10px] border border-red-200">
                    {current.severity}
                  </span>
                  <span className="font-bold text-xs">{current.title}</span>
                </div>

                <p className="text-[#B4C0BB]">{current.suggestion}</p>

                <div className="p-3 bg-[rgba(255,255,255,0.035)] rounded-xl border border-[rgba(255,255,255,0.09)] font-mono text-[11px] text-[#34E5A5]">
                  {`\`\`\`suggestion\n${
                    current.unpatchedDiff
                      .filter((l) => l.type === 'add')
                      .map((l) => l.text.replace(/^\+\s*/, ''))
                      .join('\n')
                  }\n\`\`\``}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
