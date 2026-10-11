'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  ShieldAlert,
  Clock,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Header } from '../../components/dashboard/Header';

export default function DashboardOverviewPage() {
  const stats = [
    {
      title: 'Total Reviews',
      value: '38',
      change: '+14% this month',
      icon: GitPullRequest,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Critical Vulnerabilities Blocked',
      value: '7',
      change: '100% blocked pre-merge',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
    {
      title: 'Average Turnaround',
      value: '8.4s',
      change: 'Sub-minute review cycle',
      icon: Clock,
      iconColor: 'text-sky-400',
    },
    {
      title: 'Engineering Hours Saved',
      value: '38.5 hrs',
      change: 'Calculated team velocity',
      icon: Zap,
      iconColor: 'text-amber-400',
    },
  ];

  const recentPRs = [
    {
      id: 'pr-142',
      number: 142,
      repo: 'acme-cloud/auth-service',
      title: 'feat(auth): Add JWT refresh token rotation and cookie session handler',
      author: 'sarah-dev',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      status: 'COMPLETED',
      risk: 'CRITICAL',
      findings: { critical: 1, high: 1, medium: 1, low: 1 },
      duration: '11.4s',
      time: '20m ago',
    },
    {
      id: 'pr-156',
      number: 156,
      repo: 'acme-cloud/api-gateway',
      title: 'fix(billing): Update Stripe webhook idempotency check & subscription sync',
      author: 'david-k',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'COMPLETED',
      risk: 'HIGH',
      findings: { critical: 0, high: 1, medium: 1, low: 0 },
      duration: '8.7s',
      time: '2h ago',
    },
    {
      id: 'pr-168',
      number: 168,
      repo: 'acme-cloud/checkout-frontend',
      title: 'refactor(ui): Optimize bundle size with dynamic imports and lazy hydration',
      author: 'elena-ui',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'COMPLETED',
      risk: 'SAFE',
      findings: { critical: 0, high: 0, medium: 0, low: 0 },
      duration: '6.2s',
      time: '5h ago',
    },
  ];

  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [livePrs, setLivePrs] = useState(recentPRs);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  useEffect(() => {
    let isMounted = true;
    const fetchLiveData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/v1/pull-requests');
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && json.data.length > 0 && isMounted) {
            setLivePrs(
              json.data.map((pr: any) => ({
                id: pr.id,
                number: pr.number,
                repo: pr.repository?.fullName || 'acme-cloud/auth-service',
                title: pr.title,
                author: pr.author,
                authorAvatar:
                  pr.authorAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                status: pr.reviewJobs?.[0]?.status || 'COMPLETED',
                risk: pr.reviewJobs?.[0]?.result?.overallRisk || 'CRITICAL',
                findings: { critical: 1, high: 1, medium: 1, low: 0 },
                duration: pr.reviewJobs?.[0]?.durationSeconds
                  ? `${pr.reviewJobs[0].durationSeconds}s`
                  : '8.4s',
                time: 'Live',
              }))
            );
            setIsLiveConnected(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        }
      } catch {
        if (isMounted) setIsLiveConnected(false);
      }
    };

    fetchLiveData();
    const timer = setInterval(fetchLiveData, 3500);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Dashboard Overview"
        description="Automated code review telemetry, pull request security posture, and velocity."
        action={
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0D0F14] border border-white/[0.08] text-xs font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span className={isLiveConnected ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
              {isLiveConnected ? `Live Sync (${lastSyncTime})` : 'Standalone Ready'}
            </span>
          </div>
        }
      />

      <div className="px-6 pt-6 space-y-6 max-w-7xl">
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

        {/* Severity Distribution & Activity Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Finding Breakdown Card */}
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                Findings by Severity
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Past 30 Days</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Critical
                  </span>
                  <span className="text-zinc-300 font-mono font-bold text-xs">7</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-[12%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-orange-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> High
                  </span>
                  <span className="text-zinc-300 font-mono font-bold text-xs">14</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[24%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Medium
                  </span>
                  <span className="text-zinc-300 font-mono font-bold text-xs">29</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[48%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Low & Info
                  </span>
                  <span className="text-zinc-300 font-mono font-bold text-xs">18</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[30%]" />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono text-[11px]">
              <span>False Positive Rate:</span>
              <span className="text-emerald-400 font-bold">1.4% (Grounded)</span>
            </div>
          </div>

          {/* Actionable Setup & Health Card */}
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
                Automated reviews are active on 3 connected repositories. Pull request commits are checked for cryptographic fallbacks, TOCTOU race conditions, unhandled exceptions, and missing unit tests.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05]">
                  <span className="text-zinc-500 text-[11px] font-mono block mb-1">Active AI Engine</span>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Gemini / OpenAI Hybrid (Mock Mode Ready)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05]">
                  <span className="text-zinc-500 text-[11px] font-mono block mb-1">Policy Enforcement</span>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Block PR on Critical Findings (Enforced)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-mono text-[11px]">
              <span>Next scheduled quota reset: Nov 1, 2026</span>
              <Link
                href="/dashboard/repositories"
                className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Configure Policies</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Pull Requests Table */}
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

          <div className="divide-y divide-white/[0.05]">
            {livePrs.map((pr) => (
              <Link
                key={pr.id}
                href={`/dashboard/reviews/${pr.id}`}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-lg transition-colors block group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={pr.authorAvatar}
                    alt={pr.author}
                    className="w-7 h-7 rounded-full border border-white/[0.1] mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400">{pr.repo}#{pr.number}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          pr.risk === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : pr.risk === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {pr.risk}
                      </span>
                    </div>
                    <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors mt-0.5">
                      {pr.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-mono">
                      <span>@{pr.author}</span>
                      <span>•</span>
                      <span>Review in {pr.duration}</span>
                      <span>•</span>
                      <span>{pr.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    {pr.findings.critical > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                        {pr.findings.critical} Critical
                      </span>
                    )}
                    {pr.findings.high > 0 && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20 text-[11px]">
                        {pr.findings.high} High
                      </span>
                    )}
                    {pr.findings.critical === 0 && pr.findings.high === 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                        All Clean
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
