'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
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

  const filtered = pullRequests.filter((pr) => {
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

      <div className="px-8 pt-8 space-y-6 max-w-7xl">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search pull requests by title, repository, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-500 text-[11px] mr-1">Risk:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'SAFE'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-all border ${
                    selectedSeverity === sev
                      ? 'bg-slate-800 text-slate-100 border-indigo-500 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PR Table List */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800/80">
            {filtered.map((pr) => (
              <Link
                key={pr.id}
                href={`/dashboard/reviews/${pr.id}`}
                className="p-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors block group"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={pr.authorAvatar}
                    alt={pr.author}
                    className="w-9 h-9 rounded-full border border-slate-700 shrink-0 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
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
                      <span className="text-[11px] font-mono text-slate-500">commit {pr.commitSha}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {pr.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                      <span>branch: {pr.headBranch}</span>
                      <span>•</span>
                      <span>by @{pr.author}</span>
                      <span>•</span>
                      <span>Reviewed in {pr.duration}</span>
                      <span>•</span>
                      <span>Updated {pr.updatedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {pr.findingsCount} findings
                    </span>
                    {pr.criticalCount > 0 ? (
                      <span className="text-[11px] text-red-400 font-mono">
                        {pr.criticalCount} Critical Blocker
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono">Check Run: Passed</span>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}

            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                No pull requests match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
