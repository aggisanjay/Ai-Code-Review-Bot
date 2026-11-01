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
} from 'lucide-react';
import { Header } from '../../components/dashboard/Header';
import { InsightCharts } from '../../components/dashboard/InsightCharts';
import { Reveal, Tilt3D, CountUp } from '../../components/ui/Motion3D';

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
      iconColor: 'text-[#126B50]',
      iconBg: 'bg-[#EAF5EF]',
    },
    {
      title: 'Critical Issues Blocked',
      value: String(criticalBlocked),
      change: criticalBlocked > 0 ? 'Pre-merge protection' : 'Zero critical defects',
      icon: ShieldAlert,
      iconColor: 'text-[#C43D4B]',
      iconBg: 'bg-[#FDE8E8]',
    },
    {
      title: 'Average Turnaround',
      value: avgTurnaround,
      change: 'Sub-minute cycle target',
      icon: Clock,
      iconColor: 'text-[#126B50]',
      iconBg: 'bg-[#EAF5EF]',
    },
    {
      title: 'Engineering Hours Saved',
      value: hoursSaved,
      change: 'Grounded team velocity',
      icon: Zap,
      iconColor: 'text-[#B7791F]',
      iconBg: 'bg-[#FEF3C7]',
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
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title="Dashboard Overview"
        description="Automated code review telemetry, pull request security posture, and velocity."
        isConnected={isLiveConnected}
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E4EAE6] text-xs font-mono shadow-sleek-sm">
            <span
              className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-[#16835B] animate-pulse' : 'bg-zinc-400'
                }`}
            />
            <span className={isLiveConnected ? 'text-[#126B50] font-semibold' : 'text-[#66736D]'}>
              {isLiveConnected ? `Live Sync (${lastSyncTime})` : 'Connecting...'}
            </span>
          </div>
        }
      />

      <div className="px-6 sm:px-8 pt-8 space-y-7 max-w-7xl mx-auto">
        {/* Prominent Connect GitHub Banner when disconnected */}
        {!isLoading && installations.length === 0 && (
          <div className="p-6 rounded-2xl bg-white border border-[#C7E4D6] shadow-sleek-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center shrink-0">
                <Github className="w-6 h-6 text-[#126B50]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#14211D] flex items-center gap-2.5 font-display">
                  <span>Connect Your GitHub Account or Organization</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] text-[10px] font-mono border border-[#C7E4D6] font-bold">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-[#66736D] mt-1 max-w-2xl leading-relaxed">
                  Install the official ReviewFlow AI GitHub App on your repositories to enable automated pull request code reviews and security scanning. No personal access tokens or Gemini keys needed.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/repositories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shrink-0 shadow-sm"
            >
              <Github className="w-4 h-4" />
              <span>Connect GitHub</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <Tilt3D>
                  <div
                    className="p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#B2E0C7] transition-all duration-fast flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#52635B]">
                          {stat.title}
                        </span>
                        <div className={`w-8 h-8 rounded-full ${stat.iconBg} flex items-center justify-center border border-black/5`}>
                          <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-[#111C18] font-mono tracking-tight"><CountUp value={stat.value} /></div>
                    </div>
                    <div className="mt-3.5 pt-3 border-t border-[#F0F5F2] flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#10B981] bg-[#EBF7F0] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#10B981]" />
                        <span>{stat.change}</span>
                      </span>
                    </div>
                  </div>
                </Tilt3D>
              </Reveal>
            );
          })}
        </div>

        <InsightCharts analytics={analytics} />

        {/* Severity Distribution & Engine Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Finding Breakdown Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[#111C18]">
                Findings by Severity
              </h3>
              <span className="text-[11px] font-medium text-[#52635B] bg-[#F7FAF8] px-2 py-0.5 rounded-full border border-[#E2EDE6]">
                Persisted
              </span>
            </div>

            {totalFindings === 0 ? (
              <div className="py-10 text-center space-y-2">
                <span className="text-xs text-[#111C18] font-semibold block">Zero findings recorded</span>
                <span className="text-[11px] text-[#52635B] block">
                  Reviews will populate severity metrics automatically.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#DC2626] font-semibold flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Critical
                    </span>
                    <span className="text-[#111C18] font-mono font-bold text-xs">{severity.CRITICAL}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0FAF4] rounded-full overflow-hidden border border-[#E2EDE6]">
                    <div
                      className="h-full bg-[#DC2626] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((severity.CRITICAL / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#D97706] font-semibold flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#D97706]" /> High
                    </span>
                    <span className="text-[#111C18] font-mono font-bold text-xs">{severity.HIGH}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0FAF4] rounded-full overflow-hidden border border-[#E2EDE6]">
                    <div
                      className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((severity.HIGH / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#063B2C] font-semibold flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#063B2C]" /> Medium
                    </span>
                    <span className="text-[#111C18] font-mono font-bold text-xs">{severity.MEDIUM}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0FAF4] rounded-full overflow-hidden border border-[#E2EDE6]">
                    <div
                      className="h-full bg-[#063B2C] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((severity.MEDIUM / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#52635B] font-semibold flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#52635B]" /> Low & Info
                    </span>
                    <span className="text-[#111C18] font-mono font-bold text-xs">{severity.LOW}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0FAF4] rounded-full overflow-hidden border border-[#E2EDE6]">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((severity.LOW / totalFindings) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actionable Setup & Review Controls */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold text-[#111C18] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#063B2C]" />
                  <span>Review Engine Status & Controls</span>
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EBF7F0] text-[#063B2C] border border-[#C3EBD7] font-semibold">
                  Engine Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#52635B] leading-relaxed mb-5">
                Automated pull request analysis executes deterministic security analyzers alongside configured Google Gemini reasoning models ({appInfo?.aiModel || 'gemini-3.5-flash'}). Webhook events trigger asynchronous review jobs without blocking developer workflow.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
                  <span className="text-[#52635B] text-[11px] font-semibold block mb-1.5">Active AI Model</span>
                  <div className="flex items-center gap-2 text-[#111C18] font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span>{appInfo?.aiModel ? `Google Gemini (${appInfo.aiModel})` : 'Google Gemini 3.5 Flash (gemini-3.5-flash)'}</span>
                  </div>
                  <span className="text-[10px] text-[#7A8C84] mt-1 block font-mono">High-Speed Reasoning & JSON Schema</span>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
                  <span className="text-[#52635B] text-[11px] font-semibold block mb-1.5">Policy Enforcement</span>
                  <div className="flex items-center gap-2 text-[#111C18] font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    <span>Block PR on Critical Findings (Active)</span>
                  </div>
                  <span className="text-[10px] text-[#7A8C84] mt-1 block font-mono">Zero Critical Defect Merge Gates</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2EDE6] flex items-center justify-between text-xs text-[#52635B]">
              <span className="font-medium">Tenant Isolation: Enforced</span>
              <Link
                href="/dashboard/repositories"
                className="text-[#063B2C] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Manage Policies</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Pull Requests Section */}
        <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#14211D] font-display">Recent Pull Requests</h3>
              <p className="text-xs text-[#66736D] mt-0.5">Latest code review events and automated finding summaries.</p>
            </div>
            <Link
              href="/dashboard/pull-requests"
              className="text-xs text-[#126B50] font-semibold hover:underline font-mono flex items-center gap-1"
            >
              <span>View All PRs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pullRequests.length === 0 ? (
            /* Honest Empty State */
            <div className="py-14 px-4 text-center border-2 border-dashed border-[#E4EAE6] rounded-2xl bg-[#F7F9F8]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E4EAE6] flex items-center justify-center mx-auto mb-3.5 text-[#66736D] shadow-sm">
                <FolderGit2 className="w-6 h-6 text-[#126B50]" />
              </div>
              <h4 className="text-sm font-bold text-[#14211D] font-display">No pull requests reviewed yet</h4>
              <p className="text-xs text-[#66736D] max-w-md mx-auto mt-1 mb-5 font-mono">
                Connect a GitHub repository and open a pull request to trigger your first automated AI code review.
              </p>
              <Link
                href="/dashboard/repositories"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Repository</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E4EAE6]">
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
                    className="py-4 flex items-center justify-between gap-4 hover:bg-[#F7F9F8] px-3 rounded-xl transition-colors block group"
                  >
                    <div className="flex items-start gap-3.5">
                      {pr.authorAvatarUrl ? (
                        <img
                          src={pr.authorAvatarUrl}
                          alt={pr.author}
                          className="w-8 h-8 rounded-full border border-[#E4EAE6] mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#EAF5EF] border border-[#C7E4D6] mt-0.5 flex items-center justify-center text-[10px] font-mono text-[#126B50] font-bold">
                          {pr.author.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#66736D] font-medium">
                            {pr.repoFullName || pr.repoName}#{pr.number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${risk === 'CRITICAL'
                                ? 'bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4]'
                                : risk === 'HIGH'
                                  ? 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]'
                                  : 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6]'
                              }`}
                          >
                            {risk}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#14211D] group-hover:text-[#126B50] transition-colors mt-0.5">
                          {pr.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#66736D] mt-1 font-mono">
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
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4] text-[11px] font-bold">
                            {criticalCount} Critical
                          </span>
                        )}
                        {highCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A] text-[11px] font-bold">
                            {highCount} High
                          </span>
                        )}
                        {criticalCount === 0 && highCount === 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] text-[11px] font-semibold">
                            All Clean
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#66736D] group-hover:text-[#126B50] transition-colors" />
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
