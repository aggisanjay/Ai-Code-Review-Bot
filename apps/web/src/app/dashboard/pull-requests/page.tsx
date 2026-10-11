'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  GitPullRequest,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

export default function PullRequestsPage() {
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<'ALL' | 'OPEN' | 'MERGED'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'SAFE'>('ALL');

  const pullRequests = [
    {
      id: 'pr-142',
      number: 142,
      repo: 'acme-cloud/auth-service',
      title: 'feat(auth): Add JWT refresh token rotation and cookie session handler',
      author: 'sarah-dev',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      state: 'OPEN',
      headBranch: 'feat/refresh-tokens',
      commitSha: '8f7a1c3',
      risk: 'CRITICAL',
      findingsCount: 4,
      criticalCount: 1,
      duration: '11.4s',
      updatedAt: '20m ago',
    },
    {
      id: 'pr-156',
      number: 156,
      repo: 'acme-cloud/api-gateway',
      title: 'fix(billing): Update Stripe webhook idempotency check & subscription sync',
      author: 'david-k',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      state: 'OPEN',
      headBranch: 'fix/stripe-idempotency',
      commitSha: 'c4e2a8b',
      risk: 'HIGH',
      findingsCount: 2,
      criticalCount: 0,
      duration: '8.7s',
      updatedAt: '2h ago',
    },
    {
      id: 'pr-168',
      number: 168,
      repo: 'acme-cloud/checkout-frontend',
      title: 'refactor(ui): Optimize bundle size with dynamic imports and lazy hydration',
      author: 'elena-ui',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      state: 'OPEN',
      headBranch: 'perf/dynamic-imports',
      commitSha: 'e9a1b2c',
      risk: 'SAFE',
      findingsCount: 1,
      criticalCount: 0,
      duration: '6.2s',
      updatedAt: '5h ago',
    },
  ];

  const [livePrs, setLivePrs] = useState(pullRequests);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  React.useEffect(() => {
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
                state: pr.state || 'OPEN',
                headBranch: pr.headBranch || 'main',
                commitSha: pr.headSha ? pr.headSha.substring(0, 7) : '8f7a1c3',
                risk: pr.reviewJobs?.[0]?.result?.overallRisk || 'CRITICAL',
                findingsCount: pr.reviewJobs?.[0]?.result?.findings?.length || 3,
                criticalCount: pr.reviewJobs?.[0]?.result?.overallRisk === 'CRITICAL' ? 1 : 0,
                duration: pr.reviewJobs?.[0]?.durationSeconds
                  ? `${pr.reviewJobs[0].durationSeconds}s`
                  : '8.4s',
                updatedAt: 'Live',
              }))
            );
            setIsLiveConnected(true);
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

  const filtered = livePrs.filter((pr) => {
    if (selectedState !== 'ALL' && pr.state !== selectedState) return false;
    if (selectedSeverity !== 'ALL' && pr.risk !== selectedSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        pr.title.toLowerCase().includes(q) ||
        pr.repo.toLowerCase().includes(q) ||
        pr.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Pull Requests"
        description="Monitor automated reviews, risk assessments, and line-level findings across all repositories."
      />

      <div className="px-6 pt-6 space-y-4 max-w-7xl">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Search pull requests by title, repository, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-zinc-500 text-[11px] mr-1">Risk:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'SAFE'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-all border ${
                    selectedSeverity === sev
                      ? 'bg-zinc-800 text-white border-white/[0.15] font-semibold'
                      : 'bg-transparent text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PR Table Card */}
        <div className="rounded-xl bg-[#0B0D12] border border-white/[0.07] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              {filtered.length} Pull Requests Evaluated
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span>{isLiveConnected ? 'Live GitHub Sync' : 'Static Seed'}</span>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {filtered.map((pr) => (
              <Link
                key={pr.id}
                href={`/dashboard/reviews/${pr.id}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors block group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={pr.authorAvatar}
                    alt={pr.author}
                    className="w-7 h-7 rounded-full border border-white/[0.08] mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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
                    <h3 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {pr.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-mono">
                      <span>@{pr.author}</span>
                      <span>•</span>
                      <span>{pr.headBranch}</span>
                      <span>•</span>
                      <span>SHA: {pr.commitSha}</span>
                      <span>•</span>
                      <span>{pr.updatedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-[11px] text-zinc-400">{pr.findingsCount} findings</span>
                    {pr.criticalCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                        {pr.criticalCount} CRITICAL
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
