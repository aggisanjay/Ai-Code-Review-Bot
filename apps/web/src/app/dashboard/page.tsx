'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitPullRequest,
  ShieldAlert,
  Clock,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  FolderGit2,
  Plus,
  Github,
  ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/dashboard/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [analyticsRes, prsRes, instRes, appInfoRes] = await Promise.all([
          fetch(`${API_URL}/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/pull-requests?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/repositories/installations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/repositories/app-info`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (analyticsRes.status === 401 || prsRes.status === 401) {
          localStorage.removeItem('reviewflow_token');
          router.push('/login');
          return;
        }

        if (analyticsRes.ok && isMounted) {
          const analyticsJson = await analyticsRes.json();
          setAnalytics(analyticsJson.data);
        }

        if (prsRes.ok && isMounted) {
          const prsJson = await prsRes.json();
          setPullRequests(prsJson.data || []);
        }

        if (instRes.ok && isMounted) {
          const instJson = await instRes.json();
          setInstallations(instJson.data || []);
        }

        if (appInfoRes.ok && isMounted) {
          const appInfoJson = await appInfoRes.json();
          setAppInfo(appInfoJson.data);
        }

        if (isMounted) {
          setIsLiveConnected(true);
          setLastSyncTime(new Date().toLocaleTimeString());
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLiveConnected(false);
          setIsLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router]);

  const totalReviews = analytics?.totalReviews ?? 0;
  const criticalBlocked = analytics?.criticalIssuesPrevented ?? 0;
  const avgTurnaround = analytics?.averageReviewDurationSeconds
    ? `${analytics.averageReviewDurationSeconds}s`
    : '0.0s';
  const hoursSaved = analytics?.timeSavedHours
    ? `${analytics.timeSavedHours} hrs`
    : '0.0 hrs';

  const stats = [
    {
      title: 'Total Reviews',
      value: String(totalReviews),
      change: totalReviews > 0 ? 'Persisted review jobs' : 'No review events yet',
      icon: GitPullRequest,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Critical Vulnerabilities Blocked',
      value: String(criticalBlocked),
      change: criticalBlocked > 0 ? 'Pre-merge protection' : 'Zero critical defects',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
    {
      title: 'Average Turnaround',
      value: avgTurnaround,
      change: 'Sub-minute cycle target',
      icon: Clock,
      iconColor: 'text-sky-400',
    },
    {
      title: 'Engineering Hours Saved',
      value: hoursSaved,
      change: 'Grounded team velocity',
      icon: Zap,
      iconColor: 'text-amber-400',
    },
  ];

  const severity = analytics?.severityDistribution || {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  const totalFindings =
    (severity.CRITICAL || 0) +
    (severity.HIGH || 0) +
    (severity.MEDIUM || 0) +
    (severity.LOW || 0);

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Dashboard Overview"
        description="Automated code review telemetry, pull request security posture, and velocity."
        isConnected={isLiveConnected}
        action={
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0D0F14] border border-white/[0.08] text-xs font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span className={isLiveConnected ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
              {isLiveConnected ? `Live Sync (${lastSyncTime})` : 'Connecting...'}
            </span>
          </div>
        }
      />

      <div className="px-6 pt-6 space-y-6 max-w-7xl">
        {/* Prominent Connect GitHub Banner when disconnected */}
        {!isLoading && installations.length === 0 && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#0E1017] to-purple-950/30 border border-blue-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.1] flex items-center justify-center shrink-0">
                <Github className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Connect Your GitHub Account or Organization</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono border border-blue-500/30">Action Required</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
                  Install the official ReviewFlow AI GitHub App on your repositories to enable automated pull request code reviews and security scanning. No personal access tokens or Gemini keys needed.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/repositories"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-primary text-xs font-medium shrink-0 shadow-lg hover:shadow-blue-500/20"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Connect GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07] hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{stat.title}</span>
                  <div className="w-6 h-6 rounded-md bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
                    <Icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Severity Distribution & Engine Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Finding Breakdown Card */}
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                Findings by Severity
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Persisted</span>
            </div>

            {totalFindings === 0 ? (
              <div className="py-8 text-center space-y-2">
                <span className="text-xs text-zinc-400 font-mono block">Zero findings recorded</span>
                <span className="text-[11px] text-zinc-500 font-mono block">
                  Reviews will populate severity metrics automatically.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Critical
                    </span>
                    <span className="text-zinc-300 font-mono font-bold text-xs">{severity.CRITICAL}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.round((severity.CRITICAL / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-orange-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> High
                    </span>
                    <span className="text-zinc-300 font-mono font-bold text-xs">{severity.HIGH}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.round((severity.HIGH / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Medium
                    </span>
                    <span className="text-zinc-300 font-mono font-bold text-xs">{severity.MEDIUM}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.round((severity.MEDIUM / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Low & Info
                    </span>
                    <span className="text-zinc-300 font-mono font-bold text-xs">{severity.LOW}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.round((severity.LOW / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actionable Setup & Review Controls */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Review Engine Status & Controls</span>
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Engine Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Automated pull request analysis executes deterministic security analyzers alongside configured Google Gemini reasoning models ({appInfo?.aiModel || 'gemini-3.8-flash'}). Webhook events trigger asynchronous review jobs without blocking developer workflow.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05]">
                  <span className="text-zinc-500 text-[11px] font-mono block mb-1">Active AI Model</span>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{appInfo?.aiModel ? `Google Gemini (${appInfo.aiModel})` : 'Google Gemini (gemini-3.8-flash)'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05]">
                  <span className="text-zinc-500 text-[11px] font-mono block mb-1">Policy Enforcement</span>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Block PR on Critical Findings (Active)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-mono text-[11px]">
              <span>Tenant Isolation: Enforced</span>
              <Link
                href="/dashboard/repositories"
                className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Manage Policies</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Pull Requests Section */}
        <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Pull Requests</h3>
              <p className="text-xs text-zinc-400">Latest code review events and automated finding summaries.</p>
            </div>
            <Link
              href="/dashboard/pull-requests"
              className="text-xs text-blue-400 hover:underline font-mono flex items-center gap-1"
            >
              <span>View All PRs</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {pullRequests.length === 0 ? (
            /* Honest Empty State */
            <div className="py-12 px-4 text-center border border-dashed border-white/[0.08] rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <FolderGit2 className="w-5 h-5 text-zinc-400" />
              </div>
              <h4 className="text-sm font-medium text-zinc-200">No pull requests reviewed yet</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4 font-mono">
                Connect a GitHub repository and open a pull request to trigger your first automated AI code review.
              </p>
              <Link
                href="/dashboard/repositories"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Repository</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {pullRequests.map((pr) => {
                const latestJob = pr.latestReview;
                const risk = latestJob?.overallRisk || 'SAFE';
                const duration = latestJob?.durationSeconds ? `${latestJob.durationSeconds}s` : '—';
                const criticalCount = latestJob?.findingCounts?.CRITICAL || 0;
                const highCount = latestJob?.findingCounts?.HIGH || 0;

                return (
                  <Link
                    key={pr.id}
                    href={`/dashboard/reviews/${latestJob?.id || pr.id}`}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-lg transition-colors block group"
                  >
                    <div className="flex items-start gap-3">
                      {pr.authorAvatarUrl ? (
                        <img
                          src={pr.authorAvatarUrl}
                          alt={pr.author}
                          className="w-7 h-7 rounded-full border border-white/[0.1] mt-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.1] mt-0.5 flex items-center justify-center text-[10px] font-mono text-zinc-300">
                          {pr.author.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400">
                            {pr.repoFullName || pr.repoName}#{pr.number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              risk === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : risk === 'HIGH'
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {risk}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors mt-0.5">
                          {pr.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-mono">
                          <span>@{pr.author}</span>
                          <span>•</span>
                          <span>Review: {duration}</span>
                          <span>•</span>
                          <span>SHA: {pr.headSha?.substring(0, 7) || 'HEAD'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {criticalCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                            {criticalCount} Critical
                          </span>
                        )}
                        {highCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20 text-[11px]">
                            {highCount} High
                          </span>
                        )}
                        {criticalCount === 0 && highCount === 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                            All Clean
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
