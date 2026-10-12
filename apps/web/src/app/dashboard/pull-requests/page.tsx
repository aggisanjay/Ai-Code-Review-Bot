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
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title="Pull Requests"
        description="Monitor automated reviews, risk assessments, and line-level findings across all repositories."
        isConnected={isLiveConnected}
      />

      <div className="px-6 sm:px-8 pt-8 space-y-5 max-w-7xl mx-auto">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-[#66736D] shrink-0" />
            <input
              type="text"
              placeholder="Search pull requests by title, repository, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm text-[#14211D] placeholder-[#66736D] focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#66736D] text-[11px] mr-1 font-semibold">Risk:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'SAFE'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-1 rounded-lg text-[11px] transition-all border font-semibold ${
                    selectedSeverity === sev
                      ? 'bg-[#EAF5EF] text-[#126B50] border-[#C7E4D6] shadow-sm'
                      : 'bg-white text-[#66736D] border-[#E4EAE6] hover:bg-[#F7F9F8] hover:text-[#14211D]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PR Table Card */}
        <div className="rounded-2xl bg-white border border-[#E4EAE6] overflow-hidden shadow-sleek-sm">
          <div className="p-5 border-b border-[#E4EAE6] flex items-center justify-between bg-[#F7F9F8]">
            <span className="text-xs font-mono text-[#14211D] font-bold uppercase tracking-wider">
              {filtered.length} Pull Requests Evaluated
            </span>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#66736D]">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-[#16835B] animate-pulse' : 'bg-zinc-400'}`} />
              <span className="font-medium">{isLiveConnected ? 'Live GitHub Sync' : 'Connecting...'}</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            /* Honest Empty State */
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-center mx-auto mb-3.5 text-[#66736D]">
                <FolderGit2 className="w-6 h-6 text-[#126B50]" />
              </div>
              <h4 className="text-base font-bold text-[#14211D] font-display">No pull requests found</h4>
              <p className="text-xs sm:text-sm text-[#66736D] max-w-md mx-auto mt-1 mb-5 font-mono leading-relaxed">
                {search
                  ? 'No pull requests match your search criteria.'
                  : 'Open a pull request in one of your connected repositories to trigger an automated AI review.'}
              </p>
              <Link
                href="/dashboard/repositories"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Repositories</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E4EAE6]">
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
                    className="p-5 flex items-center justify-between gap-4 hover:bg-[#F7F9F8] transition-colors block group"
                  >
                    <div className="flex items-start gap-4">
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[#66736D] font-medium">
                            {pr.repoFullName || pr.repoName}#{pr.number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                              risk === 'CRITICAL'
                                ? 'bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4]'
                                : risk === 'HIGH'
                                ? 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]'
                                : 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6]'
                            }`}
                          >
                            {risk}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[#14211D] group-hover:text-[#126B50] transition-colors font-display">
                          {pr.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-[#66736D] mt-1.5 font-mono">
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

                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-[11px] text-[#66736D] font-medium">{totalFindings} findings</span>
                        {criticalCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FDE8E8] text-[#C43D4B] border border-[#F8B4B4] text-[10px] font-bold">
                            {criticalCount} CRITICAL
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
