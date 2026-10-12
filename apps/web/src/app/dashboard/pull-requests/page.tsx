'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  FolderGit2,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function PullRequestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'SAFE'>('ALL');
  const [pullRequests, setPullRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchPrs = async () => {
      try {
        const res = await fetch(`${API_URL}/pull-requests?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('reviewflow_token');
          router.push('/login');
          return;
        }

        if (res.ok && isMounted) {
          const json = await res.json();
          setPullRequests(json.data || []);
          setIsLiveConnected(true);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLiveConnected(false);
          setIsLoading(false);
        }
      }
    };

    fetchPrs();
    const interval = setInterval(fetchPrs, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router]);

  const filtered = pullRequests.filter((pr) => {
    const risk = pr.latestReview?.overallRisk || 'SAFE';
    if (selectedSeverity !== 'ALL' && risk !== selectedSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = (pr.title || '').toLowerCase();
      const repo = (pr.repoFullName || pr.repoName || '').toLowerCase();
      const author = (pr.author || '').toLowerCase();
      return title.includes(q) || repo.includes(q) || author.includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Pull Requests"
        description="Monitor automated reviews, risk assessments, and line-level findings across all repositories."
        isConnected={isLiveConnected}
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
              <span>{isLiveConnected ? 'Live GitHub Sync' : 'Connecting...'}</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            /* Honest Empty State */
            <div className="py-14 px-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <FolderGit2 className="w-5 h-5 text-zinc-400" />
              </div>
              <h4 className="text-sm font-medium text-zinc-200">No pull requests found</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4 font-mono">
                {search
                  ? 'No pull requests match your search criteria.'
                  : 'Open a pull request in one of your connected repositories to trigger an automated AI review.'}
              </p>
              <Link
                href="/dashboard/repositories"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Repositories</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((pr) => {
                const latestJob = pr.latestReview;
                const risk = latestJob?.overallRisk || 'SAFE';
                const totalFindings = latestJob?.totalFindings || 0;
                const criticalCount = latestJob?.findingCounts?.CRITICAL || 0;
                const duration = latestJob?.durationSeconds ? `${latestJob.durationSeconds}s` : '—';

                return (
                  <Link
                    key={pr.id}
                    href={`/dashboard/reviews/${latestJob?.id || pr.id}`}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors block group"
                  >
                    <div className="flex items-start gap-3">
                      {pr.authorAvatarUrl ? (
                        <img
                          src={pr.authorAvatarUrl}
                          alt={pr.author}
                          className="w-7 h-7 rounded-full border border-white/[0.08] mt-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.08] mt-0.5 flex items-center justify-center text-[10px] font-mono text-zinc-300">
                          {pr.author.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
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
                        <h3 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {pr.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-mono">
                          <span>@{pr.author}</span>
                          <span>•</span>
                          <span>Branch: {pr.headBranch}</span>
                          <span>•</span>
                          <span>SHA: {pr.headSha?.substring(0, 7) || 'HEAD'}</span>
                          <span>•</span>
                          <span>Review: {duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-[11px] text-zinc-400">{totalFindings} findings</span>
                        {criticalCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                            {criticalCount} CRITICAL
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
