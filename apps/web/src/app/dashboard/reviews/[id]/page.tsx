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
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#F7F9F8]">
        <div className="flex items-center gap-3 text-[#66736D] font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#126B50]" />
          <span>Loading pull request review analysis...</span>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="flex-1 pb-16 bg-[#F7F9F8]">
        <Header title="Review Details" />
        <div className="max-w-2xl mx-auto mt-20 p-8 rounded-2xl bg-white border border-[#E4EAE6] text-center space-y-4 shadow-sleek-md">
          <AlertCircle className="w-8 h-8 text-[#B7791F] mx-auto" />
          <h2 className="text-base font-bold text-[#14211D] font-display">Review Job Not Found</h2>
          <p className="text-xs text-[#66736D] font-mono">
            The requested review ID does not exist or belongs to another tenant organization.
          </p>
          <Link
            href="/dashboard/pull-requests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold"
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
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title={`Review: ${repo.fullName || repo.name}#${pr.number}`}
        description="Pull request review analysis with inline code annotations and check run status."
        isConnected={sseConnected}
        action={
          <button
            onClick={handleRetryReview}
            disabled={isRetrying || status === 'QUEUED'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-secondary text-xs font-semibold shadow-sleek-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-[#126B50]' : ''}`} />
            <span>{isRetrying ? 'Re-Queueing...' : 'Re-Run Review'}</span>
          </button>
        }
      />

      <div className="px-6 sm:px-8 pt-6 space-y-6 max-w-7xl mx-auto">
        {/* Navigation & GitHub PR Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/pull-requests"
            className="text-xs text-[#66736D] hover:text-[#126B50] flex items-center gap-1 font-mono transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Pull Requests</span>
          </Link>

          <a
            href={githubPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#126B50] hover:underline font-mono flex items-center gap-1.5 font-semibold"
          >
            <span>View on GitHub (#{pr.number})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Real-Time Review Pipeline Status & Progress Bar */}
        <div className="p-5 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'COMPLETED'
                    ? 'bg-[#16835B]'
                    : status === 'FAILED'
                    ? 'bg-[#C43D4B]'
                    : 'bg-[#B7791F] animate-pulse'
                }`}
              />
              <span className="text-xs font-bold font-mono text-[#14211D] uppercase tracking-wider">
                Pipeline Status: {status}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-semibold">
                {sseConnected ? 'SSE Live Stream: Connected' : 'Live Sync Active'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#126B50]">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#F7F9F8] overflow-hidden border border-[#E4EAE6]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                status === 'FAILED' ? 'bg-[#C43D4B]' : 'bg-[#126B50]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#66736D] font-mono">
            <span>{statusMessage}</span>
            <span>Target Commit: <strong className="text-[#14211D]">{job.commitSha?.substring(0, 7) || 'HEAD'}</strong></span>
          </div>
        </div>

        {job.errorMessage && (
          <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#C43D4B] shrink-0" />
            <span>Failure Notice: {job.errorMessage}</span>
          </div>
        )}

        {retryMessage && (
          <div className="p-4 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <Sparkles className="w-4 h-4 text-[#126B50] shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {/* PR Header & Branches Overview Card */}
        <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-mono text-[#66736D] font-medium">
                  {repo.fullName || repo.name}#{pr.number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono ${
                    overallRisk === 'CRITICAL'
                      ? 'bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4]'
                      : overallRisk === 'HIGH'
                      ? 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]'
                      : overallRisk === 'SAFE'
                      ? 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6]'
                      : 'bg-[#F7F9F8] text-[#14211D] border border-[#E4EAE6]'
                  }`}
                >
                  OVERALL RISK: {overallRisk}
                </span>
                {job.publishedToGitHub && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono font-bold border border-[#C7E4D6]">
                    GitHub Checks Published
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#14211D] tracking-tight font-display">{pr.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              {pr.authorAvatarUrl ? (
                <img
                  src={pr.authorAvatarUrl}
                  alt={pr.author}
                  className="w-8 h-8 rounded-full border border-[#E4EAE6]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EAF5EF] text-[#126B50] flex items-center justify-center text-[11px] font-mono font-bold">
                  {(pr.author || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-xs">
                <span className="text-[#14211D] font-bold block">@{pr.author}</span>
                <span className="text-[#66736D] font-mono text-[10px]">Author</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#66736D] font-mono pt-4 border-t border-[#E4EAE6]">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[#126B50]" />
              <span className="font-semibold text-[#126B50]">{pr.headBranch}</span>
              <span>→</span>
              <span className="text-[#14211D] font-medium">{pr.baseBranch}</span>
            </div>
            <span>•</span>
            <div>
              <span>Commit: </span>
              <span className="text-[#14211D] font-bold">{job.commitSha?.substring(0, 7) || 'HEAD'}</span>
            </div>
            {job.durationSeconds && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#66736D]" />
                  <span>Processed in {job.durationSeconds}s</span>
                </div>
              </>
            )}
            {job.tokensUsed > 0 && (
              <>
                <span>•</span>
                <span>{job.tokensUsed.toLocaleString()} tokens used</span>
              </>
            )}
            <span>•</span>
            <span className="text-[#126B50] font-semibold">Model: gemini-3.5-flash</span>
          </div>
        </div>

        {/* AI Senior Reviewer Assessment Summary */}
        {result && (
          <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#126B50]" />
                <span>Assessment Summary & Findings</span>
              </h3>
              <span className="text-[11px] font-mono text-[#66736D]">
                Saved ~{result.estimatedReviewTimeSavedMinutes || 15} mins of review
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#14211D] leading-relaxed bg-[#F7F9F8] p-4 rounded-xl border border-[#E4EAE6]">
              {result.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Blockers */}
              {blockers.length > 0 && (
                <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#C43D4B] mb-2 flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="w-4 h-4 text-[#C43D4B]" />
                    <span>Merge Blockers ({blockers.length})</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#14211D]">
                    {blockers.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#C43D4B] font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {keyStrengths.length > 0 && (
                <div className="p-4 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6]">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#126B50] mb-2 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-[#16835B]" />
                    <span>Architectural Strengths</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#14211D]">
                    {keyStrengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#16835B] font-bold">•</span>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
              Inline Review Findings ({findings.length})
            </h3>
          </div>

          {findings.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white border border-[#E4EAE6] text-center space-y-2 shadow-sleek-sm">
              <CheckCircle2 className="w-7 h-7 text-[#16835B] mx-auto" />
              <h4 className="text-base font-bold text-[#14211D] font-display">No Issues Detected</h4>
              <p className="text-xs text-[#66736D] font-mono">
                The pull request changes passed all deterministic scanners and review policies.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map((f: any) => (
                <div
                  key={f.id}
                  className={`p-5 rounded-2xl bg-white border transition-all shadow-sleek-sm ${
                    f.dismissed
                      ? 'opacity-60 border-[#E4EAE6]'
                      : f.severity === 'CRITICAL'
                      ? 'border-[#F8B4B4] ring-1 ring-[#C43D4B]/20'
                      : f.severity === 'HIGH'
                      ? 'border-[#FDE68A] ring-1 ring-[#B7791F]/20'
                      : 'border-[#E4EAE6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          f.severity === 'CRITICAL'
                            ? 'bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4]'
                            : f.severity === 'HIGH'
                            ? 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]'
                            : 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6]'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-sm font-bold text-[#14211D] font-display">{f.title}</span>
                    </div>

                    {!f.dismissed ? (
                      <button
                        onClick={() => handleDismissFinding(f.id, 'Dismissed by reviewer')}
                        className="text-[11px] text-[#66736D] hover:text-[#C43D4B] font-mono font-medium hover:underline"
                      >
                        Dismiss
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#66736D] font-mono italic">
                        Dismissed ({f.dismissReason || 'Reviewed'})
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[#14211D] mb-3 leading-relaxed">{f.explanation}</p>

                  <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#E4EAE6] font-mono text-[11px] mb-3 space-y-1">
                    <div className="text-[#66736D]">
                      File: <strong className="text-[#14211D]">{f.filePath}:{f.startLine}</strong>
                    </div>
                    {f.evidence && (
                      <pre className="text-[#C43D4B] overflow-x-auto whitespace-pre-wrap pt-1">{f.evidence}</pre>
                    )}
                  </div>

                  <div className="text-xs text-[#14211D] font-mono bg-[#EAF5EF] p-3.5 rounded-xl border border-[#C7E4D6]">
                    <span className="font-bold text-[#126B50] block mb-1">Remediation Guidance:</span>
                    <span>{f.remediation}</span>
                    {f.suggestedPatch && (
                      <pre className="mt-2 text-[#14211D] bg-white p-3 rounded-lg border border-[#C7E4D6] overflow-x-auto whitespace-pre-wrap">
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
