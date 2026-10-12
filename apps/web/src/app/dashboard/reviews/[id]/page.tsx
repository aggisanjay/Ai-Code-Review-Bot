'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../../../../components/dashboard/Header';
import { DiffViewer } from '../../../../components/reviews/DiffViewer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  // Fetch initial review job data
  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('reviewflow_token');
          router.push('/login');
          return;
        }

        if (res.status === 404) {
          if (isMounted) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        if (res.ok && isMounted) {
          const json = await res.json();
          setJob(json.data);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchJob();

    // Authenticated SSE stream for live updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_URL}/reviews/${params.id}/stream?token=${encodeURIComponent(token)}`);
      eventSource.onopen = () => {
        if (isMounted) setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.id && isMounted) {
            setJob(data);
            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              setIsRetrying(false);
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (isMounted) setSseConnected(false);
      };
    } catch {}

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, [params.id, router]);

  const handleRetryReview = async () => {
    setIsRetrying(true);
    setRetryMessage('Review job re-queued in durable worker queue...');

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/reviews/${params.id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setRetryMessage('Job re-queued successfully. Worker executing analysis in real-time...');
      } else {
        const errJson = await res.json();
        setRetryMessage(errJson.error?.message || 'Failed to re-queue review job.');
        setIsRetrying(false);
      }
    } catch (err: any) {
      setRetryMessage(`Failed to contact API server: ${err.message}`);
      setIsRetrying(false);
    }
  };

  const handleDismissFinding = async (findingId: string, reason: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) return;

    try {
      await fetch(`${API_URL}/reviews/findings/${findingId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      setJob((prev: any) => {
        if (!prev || !prev.result) return prev;
        return {
          ...prev,
          result: {
            ...prev.result,
            findings: prev.result.findings.map((f: any) =>
              f.id === findingId ? { ...f, dismissed: true, dismissReason: reason } : f
            ),
          },
        };
      });
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Loading pull request review analysis...</span>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="flex-1 pb-16">
        <Header title="Review Details" />
        <div className="max-w-2xl mx-auto mt-20 p-8 rounded-xl bg-[#0B0D12] border border-white/[0.08] text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Review Job Not Found</h2>
          <p className="text-xs text-zinc-400 font-mono">
            The requested review ID does not exist or belongs to another tenant organization.
          </p>
          <Link
            href="/dashboard/pull-requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Pull Requests</span>
          </Link>
        </div>
      </div>
    );
  }

  const pr = job.pullRequest || {};
  const repo = pr.repository || {};
  const result = job.result || null;
  const findings = result?.findings || [];
  const status = job.status || 'QUEUED';
  const progressPercent = job.progressPercent || (status === 'COMPLETED' ? 100 : 25);
  const statusMessage = job.statusMessage || (status === 'COMPLETED' ? 'Review analysis complete.' : 'Processing...');
  const overallRisk = result?.overallRisk || (job.errorMessage ? 'FAILED' : 'QUEUED');

  // Parse JSON fields
  let keyStrengths: string[] = [];
  let blockers: string[] = [];
  try {
    keyStrengths = result?.keyStrengths ? JSON.parse(result.keyStrengths) : [];
  } catch {}
  try {
    blockers = result?.blockers ? JSON.parse(result.blockers) : [];
  } catch {}

  const githubPrUrl = `https://github.com/${repo.fullName || repo.name}/pull/${pr.number}`;

  return (
    <div className="flex-1 pb-16">
      <Header
        title={`Review: ${repo.fullName || repo.name}#${pr.number}`}
        description="Pull request review analysis with inline code annotations and check run status."
        isConnected={sseConnected}
        action={
          <button
            onClick={handleRetryReview}
            disabled={isRetrying || status === 'QUEUED'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRetrying ? 'Re-Queueing...' : 'Re-Run Review'}</span>
          </button>
        }
      />

      <div className="px-6 pt-5 space-y-5 max-w-7xl">
        {/* Navigation & GitHub PR Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/pull-requests"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Pull Requests</span>
          </Link>

          <a
            href={githubPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline font-mono flex items-center gap-1"
          >
            <span>View on GitHub (#{pr.number})</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Real-Time Review Pipeline Status & Progress Bar */}
        <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.08] shadow-lg space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'COMPLETED'
                    ? 'bg-emerald-400'
                    : status === 'FAILED'
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-xs font-semibold font-mono text-zinc-200 uppercase tracking-wider">
                Pipeline Status: {status}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                {sseConnected ? 'SSE Live Stream: Connected' : 'Live Sync Active'}
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-400">{progressPercent}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-white/[0.06]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                status === 'FAILED' ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span>{statusMessage}</span>
            <span className="text-zinc-500">Target Commit: {job.commitSha?.substring(0, 7) || 'HEAD'}</span>
          </div>
        </div>

        {job.errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Failure Notice: {job.errorMessage}</span>
          </div>
        )}

        {retryMessage && (
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {/* PR Header & Branches Overview Card */}
        <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-zinc-400">
                  {repo.fullName || repo.name}#{pr.number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.2 rounded font-mono ${
                    overallRisk === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : overallRisk === 'HIGH'
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : overallRisk === 'SAFE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-300 border border-white/[0.08]'
                  }`}
                >
                  OVERALL RISK: {overallRisk}
                </span>
                {job.publishedToGitHub && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                    GitHub Checks Published
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{pr.title}</h2>
            </div>

            <div className="flex items-center gap-2.5">
              {pr.authorAvatarUrl ? (
                <img
                  src={pr.authorAvatarUrl}
                  alt={pr.author}
                  className="w-7 h-7 rounded-full border border-white/[0.1]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-[10px] font-mono text-zinc-300">
                  {(pr.author || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-xs">
                <span className="text-zinc-200 font-medium block">@{pr.author}</span>
                <span className="text-zinc-500 font-mono text-[10px]">Author</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span>{pr.headBranch}</span>
              <span>→</span>
              <span className="text-zinc-200">{pr.baseBranch}</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div>
              <span>Commit: </span>
              <span className="text-zinc-200">{job.commitSha?.substring(0, 7) || 'HEAD'}</span>
            </div>
            {job.durationSeconds && (
              <>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Processed in {job.durationSeconds}s</span>
                </div>
              </>
            )}
            {job.tokensUsed > 0 && (
              <>
                <span className="text-zinc-600">•</span>
                <span>{job.tokensUsed.toLocaleString()} tokens used</span>
              </>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-blue-400">Model: gemini-3.8-flash</span>
          </div>
        </div>

        {/* AI Senior Reviewer Assessment Summary */}
        {result && (
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Assessment Summary & Findings</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                Saved ~{result.estimatedReviewTimeSavedMinutes || 15} mins of review
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-[#0E1017] p-3.5 rounded-lg border border-white/[0.05]">
              {result.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Blockers */}
              {blockers.length > 0 && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-300 mb-2 flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Merge Blockers ({blockers.length})</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-rose-200">
                    {blockers.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {keyStrengths.length > 0 && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Architectural Strengths</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-200">
                    {keyStrengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Changed Files & Inline Findings */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
              Inline Review Findings ({findings.length})
            </h3>
          </div>

          {findings.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0B0D12] border border-white/[0.07] text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Issues Detected</h4>
              <p className="text-xs text-zinc-400 font-mono">
                The pull request changes passed all deterministic scanners and review policies.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f: any) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl bg-[#0B0D12] border transition-all ${
                    f.dismissed
                      ? 'opacity-60 border-white/[0.04]'
                      : f.severity === 'CRITICAL'
                      ? 'border-rose-500/30'
                      : f.severity === 'HIGH'
                      ? 'border-orange-500/30'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : f.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-xs font-semibold text-white">{f.title}</span>
                    </div>

                    {!f.dismissed ? (
                      <button
                        onClick={() => handleDismissFinding(f.id, 'Dismissed by reviewer')}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono"
                      >
                        Dismiss
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 font-mono italic">
                        Dismissed ({f.dismissReason || 'Reviewed'})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{f.explanation}</p>

                  <div className="bg-[#08090C] p-2.5 rounded-lg border border-white/[0.05] font-mono text-[11px] mb-2 space-y-1">
                    <div className="text-zinc-500">
                      File: {f.filePath}:{f.startLine}
                    </div>
                    {f.evidence && (
                      <pre className="text-rose-300 overflow-x-auto whitespace-pre-wrap">{f.evidence}</pre>
                    )}
                  </div>

                  <div className="text-xs text-emerald-400 font-mono bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                    <span className="font-semibold block mb-0.5">Remediation:</span>
                    <span>{f.remediation}</span>
                    {f.suggestedPatch && (
                      <pre className="mt-2 text-zinc-300 bg-[#08090C] p-2 rounded border border-white/[0.06] overflow-x-auto whitespace-pre-wrap">
                        {f.suggestedPatch}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
