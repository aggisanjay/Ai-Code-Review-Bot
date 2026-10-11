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
  const [loading, setLoading] = useState<boolean>(false);

  const stats = [
    {
      title: 'Total Reviews',
      value: '38',
      change: '+14% this month',
      icon: GitPullRequest,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      title: 'Critical Issues Prevented',
      value: '7',
      change: '100% blocked pre-merge',
      icon: ShieldAlert,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      title: 'Avg Turnaround',
      value: '8.4s',
      change: 'Sub-minute review cycle',
      icon: Clock,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      title: 'Time Saved',
      value: '38.5 hrs',
      change: 'Calculated engineering time',
      icon: Zap,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
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
        description="Live code quality, pull request analytics, and security posture."
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className={isLiveConnected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {isLiveConnected ? `Live Sync (${lastSyncTime})` : 'Offline / Standalone Ready'}
            </span>
          </div>
        }
      />

      <div className="px-8 pt-8 space-y-8 max-w-7xl">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">{stat.title}</span>
                  <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.borderColor} border`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100 font-mono">{stat.value}</div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Severity Distribution & Activity Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Finding Breakdown Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
              <span>Findings by Severity</span>
              <span className="text-xs text-slate-400 font-normal">Past 30 Days</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> Critical
                  </span>
                  <span className="text-slate-300 font-mono font-bold">7</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full w-[12%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-orange-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" /> High
                  </span>
                  <span className="text-slate-300 font-mono font-bold">14</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[24%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Medium
                  </span>
                  <span className="text-slate-300 font-mono font-bold">29</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[48%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> Low & Info
                  </span>
                  <span className="text-slate-300 font-mono font-bold">18</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full w-[30%]" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>False Positive Feedback:</span>
              <span className="text-emerald-400 font-mono font-bold">1.4% (Ultra-Low)</span>
            </div>
          </div>

          {/* Actionable Setup & Health Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Review Engine Status & Insights
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Engine Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Automated reviews are active on 3 connected repositories. Pull request commits are checked for cryptographic fallbacks, TOCTOU race conditions, unhandled exceptions, and missing unit tests.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1">Active AI Provider</span>
                  <div className="flex items-center gap-2 text-slate-200 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Gemini / OpenAI Hybrid (Mock Mode Ready)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1">Policy Enforcement</span>
                  <div className="flex items-center gap-2 text-slate-200 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Block PR on Critical Findings (Active)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Next scheduled quota reset: Nov 1, 2026</span>
              <Link
                href="/dashboard/repositories"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>Configure Policies</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Pull Requests Table */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Recent Pull Requests</h3>
              <p className="text-xs text-slate-400">Latest code review events and automated finding summaries.</p>
            </div>
            <Link
              href="/dashboard/pull-requests"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All PRs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-x-auto">
            {livePrs.map((pr) => (
              <Link
                key={pr.id}
                href={`/dashboard/reviews/${pr.id}`}
                className="py-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-xl transition-colors block group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={pr.authorAvatar}
                    alt={pr.author}
                    className="w-8 h-8 rounded-full border border-slate-700 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{pr.repo}#{pr.number}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          pr.risk === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : pr.risk === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {pr.risk}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {pr.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                      <span>by @{pr.author}</span>
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
                      <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300">
                        {pr.findings.critical} Critical
                      </span>
                    )}
                    {pr.findings.high > 0 && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300">
                        {pr.findings.high} High
                      </span>
                    )}
                    {pr.findings.critical === 0 && pr.findings.high === 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        All Clean
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
