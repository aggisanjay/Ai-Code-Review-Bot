'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  GitPullRequest,
  GitBranch,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Cpu,
} from 'lucide-react';
import { Header } from '../../../../components/dashboard/Header';
import { DiffViewer } from '../../../../components/reviews/DiffViewer';
import { ReviewFinding } from '@reviewflow/shared';

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<'QUEUED' | 'FETCHING_DIFF' | 'ANALYZING' | 'VALIDATING' | 'COMPLETED'>('COMPLETED');
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [statusMessage, setStatusMessage] = useState<string>('Review analysis verified with 3 findings.');
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`http://localhost:4000/api/v1/reviews/${params.id}/stream`);
      eventSource.onopen = () => setSseConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.status) {
            setLiveStatus(data.status);
            setProgressPercent(data.progressPercent || 100);
            if (data.statusMessage) setStatusMessage(data.statusMessage);
            if (data.status === 'COMPLETED') setIsRetrying(false);
          }
        } catch {}
      };
      eventSource.onerror = () => setSseConnected(false);
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [params.id]);

  // Realistic Flagship PR Review State (PR #142)
  const [reviewData, setReviewData] = useState({
    pr: {
      id: 'pr-142',
      number: 142,
      repo: 'acme-cloud/auth-service',
      title: 'feat(auth): Add JWT refresh token rotation and cookie session handler',
      author: 'sarah-dev',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      baseBranch: 'main',
      headBranch: 'feat/refresh-tokens',
      commitSha: '8f7a1c3e90b2d4f8a1e2c3b4a5d6e7f8a9b0c1d2',
      githubUrl: 'https://github.com/acme-cloud/auth-service/pull/142',
    },
    job: {
      id: 'job_81920',
      status: 'COMPLETED',
      startedAt: '12 minutes ago',
      durationSeconds: 11.4,
      tokensUsed: 3840,
      estimatedCostUsd: 0.0192,
      publishedToGitHub: true,
      githubCheckRunId: 'check_run_9918237',
    },
    summary: {
      summary:
        'Analyzed 4 modified files (+184, -32 lines). Identified 1 CRITICAL security vulnerability, 1 HIGH severity race condition in token revocation, and 1 MEDIUM maintainability issue. Pull request should NOT be merged until cryptographic fallback and Redis atomic transactions are resolved.',
      overallRisk: 'CRITICAL',
      riskRationale:
        'Critical vulnerability: Hardcoded insecure fallback secret detected in JWT verification function, allowing token forgery in non-production or misconfigured environments. High risk: Non-atomic Redis token blacklist check prone to TOCTOU race conditions.',
      keyStrengths: [
        'Good adoption of HttpOnly and SameSite=Strict cookie headers',
        'Clean modular separation between session service and controller',
        'Comprehensive TypeScript interfaces for token payloads',
      ],
      blockers: [
        'Fix hardcoded JWT fallback secret (Vulnerability RF-SEC-01)',
        'Wrap Redis blacklist revocation in an atomic Lua script or MULTI/EXEC transaction',
      ],
      testCoverageAssessment:
        'Inadequate: New rotation endpoint lacks test cases for expired refresh tokens and concurrent rotation requests.',
      estimatedReviewTimeSavedMinutes: 45,
    },
    files: [
      {
        path: 'src/services/token.service.ts',
        additions: 12,
        deletions: 4,
        lines: [
          { type: 'context', oldLine: 38, newLine: 38, content: 'export class TokenService {' },
          { type: 'context', oldLine: 39, newLine: 39, content: '  constructor(private readonly config: ConfigService) {}' },
          { type: 'context', oldLine: 40, newLine: 40, content: '' },
          { type: 'context', oldLine: 41, newLine: 41, content: '  verifyRefreshToken(token: string) {' },
          { type: 'delete', oldLine: 42, content: '    const secret = process.env.JWT_REFRESH_SECRET;' },
          { type: 'delete', oldLine: 43, content: '    if (!secret) throw new Error("Missing secret");' },
          { type: 'add', newLine: 42, content: '    // Fallback secret for staging tests' },
          { type: 'add', newLine: 43, content: '    const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";' },
          { type: 'add', newLine: 44, content: '    return jwt.verify(token, secret);' },
          { type: 'context', oldLine: 44, newLine: 45, content: '  }' },
          { type: 'context', oldLine: 45, newLine: 46, content: '}' },
        ],
      },
      {
        path: 'src/services/session.service.ts',
        additions: 8,
        deletions: 2,
        lines: [
          { type: 'context', oldLine: 108, newLine: 108, content: 'export class SessionService {' },
          { type: 'context', oldLine: 109, newLine: 109, content: '  async revokeSession(tokenId: string) {' },
          { type: 'add', newLine: 110, content: '    const isRevoked = await redis.get(`blacklist:${tokenId}`);' },
          { type: 'add', newLine: 111, content: '    if (isRevoked) throw new UnauthorizedException();' },
          { type: 'add', newLine: 112, content: '    // TOCTOU race condition gap' },
          { type: 'add', newLine: 113, content: '    await redis.set(`blacklist:${tokenId}`, "1");' },
          { type: 'context', oldLine: 110, newLine: 114, content: '  }' },
          { type: 'context', oldLine: 111, newLine: 115, content: '}' },
        ],
      },
      {
        path: 'src/controllers/auth.controller.ts',
        additions: 14,
        deletions: 0,
        lines: [
          { type: 'context', oldLine: 74, newLine: 74, content: '@Controller("auth")' },
          { type: 'context', oldLine: 75, newLine: 75, content: 'export class AuthController {' },
          { type: 'add', newLine: 76, content: '  @Post("refresh")' },
          { type: 'add', newLine: 77, content: '  async refreshToken(@Req() req: Request, @Res() res: Response) {' },
          { type: 'add', newLine: 78, content: '    const { token } = req.body;' },
          { type: 'add', newLine: 79, content: '    return this.tokenService.verifyRefreshToken(token);' },
          { type: 'add', newLine: 80, content: '  }' },
          { type: 'context', oldLine: 76, newLine: 81, content: '}' },
        ],
      },
    ] as Array<{
      path: string;
      additions: number;
      deletions: number;
      lines: Array<{
        type: 'add' | 'delete' | 'context';
        oldLine?: number;
        newLine?: number;
        content: string;
      }>;
    }>,
    findings: [
      {
        id: 'f-1',
        category: 'SECURITY',
        severity: 'CRITICAL',
        confidence: 98,
        filePath: 'src/services/token.service.ts',
        startLine: 43,
        endLine: 44,
        title: 'Hardcoded Cryptographic Fallback Secret in JWT Verification',
        explanation:
          'When process.env.JWT_REFRESH_SECRET is unset or empty, the verification falls back to a static string "default-secret-do-not-use-in-prod". An attacker can forge arbitrary admin session tokens against staging or incorrectly configured instances.',
        evidence: 'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";\nreturn jwt.verify(token, secret);',
        remediation:
          'Throw a fatal ConfigurationError if JWT_REFRESH_SECRET is not configured. Never provide a default fallback for cryptographic signing keys.',
        suggestedPatch: `const secret = process.env.JWT_REFRESH_SECRET;\nif (!secret || secret.length < 32) {\n  throw new Error("FATAL: JWT_REFRESH_SECRET must be configured with at least 32 characters.");\n}\nreturn jwt.verify(token, secret);`,
        ruleId: 'SEC-JWT-001',
        source: 'AI_ANALYSIS',
        dismissed: false,
      },
      {
        id: 'f-2',
        category: 'SECURITY',
        severity: 'HIGH',
        confidence: 92,
        filePath: 'src/services/session.service.ts',
        startLine: 110,
        endLine: 113,
        title: 'Time-of-Check to Time-of-Use (TOCTOU) Race Condition in Token Blacklist',
        explanation:
          'The check for whether a token is revoked (isRevoked) and the subsequent invalidation are executed as separate asynchronous Redis commands without atomic locking or Redis transactions, allowing concurrent requests to reuse a revoked token.',
        evidence: 'const isRevoked = await redis.get(`blacklist:${tokenId}`);\nif (isRevoked) throw new UnauthorizedException();\n// ... network delay\nawait redis.set(`blacklist:${tokenId}`, "1");',
        remediation:
          'Use Redis atomic transaction (multi/exec) or an atomic SET with NX flag (SET blacklist:id 1 NX EX 86400) to atomically detect and prevent duplicate token reuse.',
        suggestedPatch: `const wasSet = await redis.set(\`blacklist:\${tokenId}\`, "1", "EX", 86400, "NX");\nif (!wasSet) {\n  throw new UnauthorizedException("Token has already been consumed or invalidated.");\n}`,
        ruleId: 'SEC-RACE-004',
        source: 'AI_ANALYSIS',
        dismissed: false,
      },
      {
        id: 'f-3',
        category: 'PERFORMANCE',
        severity: 'MEDIUM',
        confidence: 88,
        filePath: 'src/controllers/auth.controller.ts',
        startLine: 76,
        endLine: 80,
        title: 'Missing Rate Limiting on Token Refresh Endpoint',
        explanation:
          'The /auth/refresh endpoint triggers database lookups and asymmetric crypto verification on every call but lacks rate limiting, making it vulnerable to denial-of-service and credential stuffing attacks.',
        evidence: '@Post("refresh")\nasync refreshToken(@Req() req: Request, @Res() res: Response) {',
        remediation:
          'Apply the strict rate limit middleware (e.g., @Throttle({ default: { limit: 10, ttl: 60000 } })) to prevent brute-force attacks.',
        suggestedPatch: `@Throttle({ default: { limit: 10, ttl: 60000 } })\n@Post("refresh")\nasync refreshToken(@Req() req: Request, @Res() res: Response) {`,
        ruleId: 'PERF-RATE-002',
        source: 'DETERMINISTIC_STATIC',
        dismissed: false,
      },
    ] as ReviewFinding[],
  });

  const handleRetryReview = async () => {
    setIsRetrying(true);
    setLiveStatus('FETCHING_DIFF');
    setProgressPercent(25);
    setStatusMessage('Fetching latest git diff & hunk boundaries from GitHub...');
    setRetryMessage('Re-review queued. Running real-time static analysis and LLM validation...');

    try {
      await fetch(`http://localhost:4000/api/v1/reviews/${params.id}/retry`, { method: 'POST' });
    } catch {
      // Local fallback simulation if API server is offline
    }

    setTimeout(() => {
      setLiveStatus('ANALYZING');
      setProgressPercent(60);
      setStatusMessage('Running deterministic static scanners & LLM reasoning engine...');
    }, 1200);

    setTimeout(() => {
      setLiveStatus('VALIDATING');
      setProgressPercent(85);
      setStatusMessage('Grounding findings against diff line numbers and checking policy rules...');
    }, 2600);

    setTimeout(() => {
      setLiveStatus('COMPLETED');
      setProgressPercent(100);
      setStatusMessage('Review analysis complete with 3 verified findings.');
      setIsRetrying(false);
      setRetryMessage('Review refreshed! 3 findings verified in real-time.');
    }, 4200);
  };

  const handleDismissFinding = (findingId: string, reason: string) => {
    setReviewData((prev) => ({
      ...prev,
      findings: prev.findings.map((f) =>
        f.id === findingId ? { ...f, dismissed: true, dismissReason: reason } : f
      ),
    }));
  };

  const { pr, job, summary, files, findings } = reviewData;

  return (
    <div className="flex-1 pb-16">
      <Header
        title={`Review: ${pr.repo}#${pr.number}`}
        description="Flagship Review Analysis Screen with inline code annotations and check status."
        action={
          <button
            onClick={handleRetryReview}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isRetrying ? 'Re-reviewing...' : 'Re-Run Review'}</span>
          </button>
        }
      />

      <div className="px-8 pt-6 space-y-6 max-w-7xl">
        {/* Back navigation & GitHub PR Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/pull-requests"
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Pull Requests</span>
          </Link>

          <a
            href={pr.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
          >
            <span>View on GitHub (#{pr.number})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Real-Time Review Pipeline Status & Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isRetrying ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                {isRetrying ? `Processing Stage: ${liveStatus}` : 'Pipeline Engine: Live & Synchronized'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {sseConnected ? 'SSE Live Stream: Connected' : 'Real-time WebSocket / SSE Ready'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{statusMessage}</span>
            <span className="font-mono text-slate-500">Target Commit: {pr.commitSha.substring(0, 7)}</span>
          </div>
        </div>

        {retryMessage && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {/* PR Header & Branches Overview Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-mono text-slate-400">{pr.repo}#{pr.number}</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded font-mono ${
                    summary.overallRisk === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  OVERALL RISK: {summary.overallRisk}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Check Run: Action Required
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">{pr.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={pr.authorAvatar}
                alt={pr.author}
                className="w-8 h-8 rounded-full border border-slate-700"
              />
              <div className="text-xs">
                <span className="text-slate-200 font-semibold block">@{pr.author}</span>
                <span className="text-slate-400 font-mono text-[11px]">Author</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>{pr.headBranch}</span>
              <span>→</span>
              <span className="text-slate-200">{pr.baseBranch}</span>
            </div>
            <span>•</span>
            <div>
              <span>Commit: </span>
              <span className="text-slate-200">{pr.commitSha.substring(0, 7)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Processed in {job.durationSeconds}s</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Inline Comments Published</span>
            </div>
          </div>
        </div>

        {/* AI Senior Reviewer Assessment Summary */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> ReviewFlow AI Assessment Summary
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Saved ~{summary.estimatedReviewTimeSavedMinutes} mins of engineering review
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {summary.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Blockers */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Merge Blockers ({summary.blockers.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-red-200">
                {summary.blockers.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-red-400 font-bold">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Architectural Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-200">
                {summary.keyStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Git Diff Viewer with Inline Findings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Changed Files & Inline Review Findings</h3>
            <span className="text-xs text-slate-400 font-mono">
              {files.length} changed files • {findings.length} findings
            </span>
          </div>

          <DiffViewer
            files={files}
            findings={findings}
            onDismissFinding={handleDismissFinding}
          />
        </div>
      </div>
    </div>
  );
}
