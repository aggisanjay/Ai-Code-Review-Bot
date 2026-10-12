'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FolderGit2,
  CheckCircle2,
  Sliders,
  Plus,
  Save,
  AlertCircle,
  Github,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  GitPullRequest,
  Sparkles,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Play,
  Eye,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function RepositoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [repositories, setRepositories] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [appInfo, setAppInfo] = useState<any>(null);

  // Open Pull Requests state
  const [selectedRepoForPrs, setSelectedRepoForPrs] = useState<string | null>(null);
  const [openPrs, setOpenPrs] = useState<any[]>([]);
  const [isLoadingPrs, setIsLoadingPrs] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [prPage, setPrPage] = useState(1);
  const [prHasMore, setPrHasMore] = useState(false);
  const [reviewingPrs, setReviewingPrs] = useState<Record<number, boolean>>({});
  const [prSuccessNotice, setPrSuccessNotice] = useState<string | null>(null);

  const activeRepoForPrs = repositories.find((r) => r.id === selectedRepoForPrs) || repositories[0];

  // Modals & Panels
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [isRepoPickerOpen, setIsRepoPickerOpen] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  // States
  const [policySaved, setPolicySaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualInstallId, setManualInstallId] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Policy form state
  const [threshold, setThreshold] = useState('MEDIUM');
  const [blockOnCritical, setBlockOnCritical] = useState(true);
  const [autoInline, setAutoInline] = useState(true);
  const [requireTests, setRequireTests] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null);

  const fetchRepositories = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/repositories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('reviewflow_token');
        router.push('/login');
        return;
      }

      if (res.ok) {
        const json = await res.json();
        const repos = json.data || [];
        setRepositories(repos);
        setSelectedRepoForPrs((curr) => curr || (repos.length > 0 ? repos[0].id : null));
      }
    } catch {
      setError('Failed to reach API server.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const fetchOpenPrs = useCallback(async (repoId: string, page = 1) => {
    const token = getToken();
    if (!token || !repoId) return;

    setIsLoadingPrs(true);
    setPrError(null);

    try {
      const res = await fetch(`${API_URL}/repositories/${repoId}/pull-requests?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setOpenPrs(json.data || []);
        setPrPage(page);
        setPrHasMore(Boolean(json.pagination?.hasMore));
      } else {
        const errJson = await res.json();
        setPrError(errJson.error?.message || 'Failed to fetch pull requests from GitHub.');
      }
    } catch (err: any) {
      setPrError(`Network error while fetching pull requests: ${err.message}`);
    } finally {
      setIsLoadingPrs(false);
    }
  }, []);

  const handleReviewPr = async (repoId: string, prNumber: number, forceRerun = false) => {
    const token = getToken();
    if (!token) return;

    setReviewingPrs((prev) => ({ ...prev, [prNumber]: true }));
    setPrError(null);

    try {
      const res = await fetch(`${API_URL}/repositories/${repoId}/pull-requests/${prNumber}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ forceRerun }),
      });

      const json = await res.json();
      if (res.status === 202) {
        setPrSuccessNotice(`Review job queued for PR #${prNumber}. Running analysis...`);
        setTimeout(() => setPrSuccessNotice(null), 5000);
        await fetchOpenPrs(repoId, prPage);
      } else if (res.status === 200 && json.data?.alreadyReviewed) {
        setPrSuccessNotice(`PR #${prNumber} is already reviewed. Use "Rerun Review" to analyze again.`);
        setTimeout(() => setPrSuccessNotice(null), 5000);
      } else {
        setPrError(json.error?.message || 'Failed to trigger review.');
      }
    } catch (err: any) {
      setPrError(`Failed to trigger review: ${err.message}`);
    } finally {
      setReviewingPrs((prev) => ({ ...prev, [prNumber]: false }));
    }
  };

  const fetchInstallations = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/repositories/installations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setInstallations(json.data || []);
      }
    } catch {}
  }, []);

  const fetchAppInfo = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/repositories/app-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAppInfo(json.data);
      }
    } catch {}
  }, []);

  const claimInstallation = useCallback(async (installationId: number) => {
    const token = getToken();
    if (!token) return;

    setIsClaiming(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/repositories/installations/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ installationId }),
      });

      const json = await res.json();
      if (res.ok) {
        setPolicySaved(`Successfully connected GitHub installation for ${json.data?.installation?.accountLogin || 'account'}!`);
        setTimeout(() => setPolicySaved(null), 4000);
        await fetchInstallations();
        await fetchRepositories();
        router.replace('/dashboard/repositories');
      } else {
        setError(json.error?.message || 'Failed to claim installation.');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsClaiming(false);
    }
  }, [fetchInstallations, fetchRepositories, router]);

  // Handle URL callback param from GitHub installation redirect
  useEffect(() => {
    const queryInstallId = searchParams.get('installation_id');
    if (queryInstallId) {
      const numericId = parseInt(queryInstallId, 10);
      if (!isNaN(numericId) && numericId > 0) {
        claimInstallation(numericId);
      }
    }
  }, [searchParams, claimInstallation]);

  useEffect(() => {
    fetchRepositories();
    fetchInstallations();
    fetchAppInfo();
  }, [fetchRepositories, fetchInstallations, fetchAppInfo]);

  useEffect(() => {
    if (selectedRepoForPrs) {
      fetchOpenPrs(selectedRepoForPrs, 1);
    }
  }, [selectedRepoForPrs, fetchOpenPrs]);

  // Dynamic status progression polling (Queued -> Running -> Publishing -> Completed)
  useEffect(() => {
    if (!selectedRepoForPrs) return;

    const hasActiveJob = openPrs.some((pr) =>
      ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'].includes(pr.latestReview?.status)
    );

    if (!hasActiveJob) return;

    const interval = setInterval(() => {
      fetchOpenPrs(selectedRepoForPrs, prPage);
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedRepoForPrs, openPrs, prPage, fetchOpenPrs]);

  const renderReviewStatus = (pr: any) => {
    const review = pr.latestReview;
    if (!review) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-850 border border-white/[0.06] text-zinc-400 text-[11px] font-mono">
          <Clock className="w-3 h-3 text-zinc-500" />
          <span>Not Reviewed</span>
        </span>
      );
    }

    if (review.isOutdated) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Outdated (New Commits)</span>
        </span>
      );
    }

    switch (review.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>Queued</span>
          </span>
        );
      case 'FETCHING_DIFF':
      case 'ANALYZING':
      case 'VALIDATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-mono">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
            <span>Running ({review.status.toLowerCase()})</span>
          </span>
        );
      case 'PUBLISHING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-mono animate-pulse">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Publishing...</span>
          </span>
        );
      case 'COMPLETED': {
        const riskColors: Record<string, string> = {
          CRITICAL: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          HIGH: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
          MEDIUM: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          LOW: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
          SAFE: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        };
        const colorClass = riskColors[review.overallRisk] || 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${colorClass}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{review.overallRisk}</span>
              {review.totalFindings > 0 && <span className="opacity-75">({review.totalFindings} findings)</span>}
            </span>
          </div>
        );
      }
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 border border-white/[0.08] text-zinc-400 text-[11px] font-mono">
            <Clock className="w-3 h-3" />
            <span>Superseded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono">
            {review.status}
          </span>
        );
    }
  };

  const openRepoPicker = async () => {
    setIsRepoPickerOpen(true);
    setIsLoadingAvailable(true);
    setError(null);

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/repositories/github-available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAvailableRepos(json.data || []);
      } else {
        const errJson = await res.json();
        setError(errJson.error?.message || 'Failed to load GitHub repositories.');
      }
    } catch (err: any) {
      setError(`Error fetching available repos: ${err.message}`);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleToggleRepo = async (repo: any, targetEnabled: boolean) => {
    const token = getToken();
    if (!token) return;

    // Optimistic update in available list
    setAvailableRepos((prev) =>
      prev.map((r) => (r.id === repo.id ? { ...r, isConnected: targetEnabled } : r))
    );

    try {
      const res = await fetch(`${API_URL}/repositories/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          githubRepoId: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.fullName.split('/')[0],
          defaultBranch: repo.defaultBranch,
          isPrivate: repo.private,
          enabled: targetEnabled,
        }),
      });

      if (res.ok) {
        await fetchRepositories();
      } else {
        const json = await res.json();
        setError(json.error?.message || 'Failed to update repository status.');
        // Revert optimistic update
        setAvailableRepos((prev) =>
          prev.map((r) => (r.id === repo.id ? { ...r, isConnected: !targetEnabled } : r))
        );
      }
    } catch (err: any) {
      setError(`Error updating repository: ${err.message}`);
    }
  };

  const openPolicyModal = (repo: any) => {
    setSelectedRepo(repo);
    const p = repo.policy || {};
    setThreshold(p.severityThreshold || 'MEDIUM');
    setBlockOnCritical(p.blockPrOnCritical ?? true);
    setAutoInline(p.autoPostInlineComments ?? true);
    setRequireTests(p.requireTestsForNewCode ?? true);
    setCustomInstructions(p.customInstructions || '');
  };

  const handleSavePolicy = async () => {
    if (!selectedRepo) return;
    setIsSaving(true);
    setError(null);

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/repositories/${selectedRepo.id}/policy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          severityThreshold: threshold,
          blockPrOnCritical: blockOnCritical,
          autoPostInlineComments: autoInline,
          requireTestsForNewCode: requireTests,
          customInstructions,
        }),
      });

      if (res.ok) {
        setPolicySaved('Review policy persisted and active for incoming pull requests.');
        setTimeout(() => setPolicySaved(null), 3000);
        setSelectedRepo(null);
        await fetchRepositories();
      } else {
        const errJson = await res.json();
        setError(errJson.error?.message || 'Failed to update policy.');
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Connected Repositories"
        description="Configure automated review policies, severity thresholds, and custom guidelines per repository."
        action={
          <div className="flex items-center gap-2">
            {installations.length > 0 && (
              <button
                onClick={openRepoPicker}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs font-medium"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Select Repositories</span>
              </button>
            )}
            <a
              href={appInfo?.installUrl || 'https://github.com/apps'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium"
            >
              <Github className="w-3.5 h-3.5" />
              <span>{installations.length > 0 ? 'Add GitHub Account' : 'Install GitHub App'}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        }
      />

      <div className="px-6 pt-6 space-y-5 max-w-7xl">
        {policySaved && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{policySaved}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* GitHub Installation Status Banner */}
        <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
              <Github className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-white">GitHub App Integration</h4>
                {installations.length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Connected ({installations.length})
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                    Not Linked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {installations.length > 0
                  ? `Active account: ${installations.map((i) => i.accountLogin).join(', ')}`
                  : 'Install the ReviewFlow PR Assistant on your GitHub account or organization.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {installations.length === 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {appInfo?.availableInstallations?.length > 0 && (
                  <button
                    onClick={() => claimInstallation(appInfo.availableInstallations[0].id)}
                    disabled={isClaiming}
                    className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-mono font-medium transition-colors"
                  >
                    {isClaiming ? 'Linking...' : `Auto-Link (${appInfo.availableInstallations[0].id})`}
                  </button>
                )}
                <input
                  type="text"
                  placeholder={appInfo?.availableInstallations?.[0]?.id ? String(appInfo.availableInstallations[0].id) : "Installation ID"}
                  value={manualInstallId}
                  onChange={(e) => setManualInstallId(e.target.value)}
                  className="bg-[#08090C] border border-white/[0.08] rounded-md px-2.5 py-1 text-zinc-200 text-xs font-mono w-44 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const id = parseInt(manualInstallId, 10);
                    if (!isNaN(id) && id > 0) claimInstallation(id);
                  }}
                  disabled={isClaiming || !manualInstallId}
                  className="px-2.5 py-1 rounded-md btn-secondary text-xs font-mono"
                >
                  {isClaiming ? 'Claiming...' : 'Link ID'}
                </button>
              </div>
            ) : (
              <button
                onClick={openRepoPicker}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-secondary text-xs"
              >
                <RefreshCw className="w-3 h-3 text-blue-400" />
                <span>Sync Repositories</span>
              </button>
            )}
          </div>
        </div>

        {/* Repositories Display */}
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs">Loading repositories...</div>
        ) : repositories.length === 0 ? (
          /* Honest Empty State */
          <div className="py-16 px-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-[#0B0D12]">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <FolderGit2 className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-white">No repositories monitored</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-5 font-mono">
              {installations.length > 0
                ? 'Your GitHub App is connected! Click "Select Repositories" to choose which repositories to monitor for automated code reviews.'
                : 'Install the ReviewFlow PR Assistant on your GitHub account or organization to authorize repositories.'}
            </p>
            {installations.length > 0 ? (
              <button
                onClick={openRepoPicker}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Select Repositories to Monitor</span>
              </button>
            ) : (
              <a
                href={appInfo?.installUrl || 'https://github.com/apps'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Install GitHub App</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
          </div>
        ) : (
          /* Repositories Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {repositories.map((repo) => {
              const p = repo.policy || {};
              const isSelected = activeRepoForPrs?.id === repo.id;
              return (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepoForPrs(repo.id)}
                  className={`p-5 rounded-xl bg-[#0B0D12] border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500/60 ring-1 ring-blue-500/30 bg-[#0E121D]'
                      : 'border-white/[0.07] hover:border-white/[0.15]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <span className="text-[11px] font-mono text-zinc-500">
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-medium">
                            Viewing PRs
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {repo.autoReviewEnabled ? 'Auto-Review Active' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-0.5">{repo.name}</h3>
                    <span className="text-xs font-mono text-zinc-500 block mb-3">{repo.fullName}</span>

                    <div className="space-y-1.5 text-xs text-zinc-300 font-mono bg-[#0E1017] p-3 rounded-lg border border-white/[0.05] mb-4 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Threshold:</span>
                        <span className="text-amber-400 font-medium">{p.severityThreshold || 'MEDIUM'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Block on Critical:</span>
                        <span className="text-emerald-400">{p.blockPrOnCritical ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Inline Comments:</span>
                        <span className="text-zinc-300">{p.autoPostInlineComments ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepoForPrs(repo.id);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white font-mono flex items-center gap-1.5"
                    >
                      <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
                      <span>{repo.pullRequestsCount || 0} reviews • View PRs</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPolicyModal(repo);
                      }}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:underline font-mono font-medium"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Configure Policy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Pull Requests Section */}
        {repositories.length > 0 && activeRepoForPrs && (
          <div className="mt-8 rounded-xl bg-[#0B0D12] border border-white/[0.07] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GitPullRequest className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">Open Pull Requests</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live GitHub Sync
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Existing and incoming pull requests for{' '}
                  <span className="text-white font-medium">{activeRepoForPrs.fullName}</span>. Select any PR to trigger an immediate AI review.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Repository selector if multiple */}
                {repositories.length > 1 && (
                  <select
                    value={activeRepoForPrs.id}
                    onChange={(e) => setSelectedRepoForPrs(e.target.value)}
                    className="bg-[#08090C] border border-white/[0.08] text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                  >
                    {repositories.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage)}
                  disabled={isLoadingPrs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs font-mono text-zinc-300 hover:text-white"
                  title="Fetch latest open pull requests from GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrs ? 'animate-spin text-blue-400' : ''}`} />
                  <span>{isLoadingPrs ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Notification & Alerts */}
            {prSuccessNotice && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{prSuccessNotice}</span>
              </div>
            )}

            {prError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{prError}</span>
                </div>
                <button
                  onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage)}
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Content states */}
            {isLoadingPrs && openPrs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">
                  Fetching open pull requests directly from GitHub API...
                </p>
              </div>
            ) : openPrs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center mx-auto text-zinc-400">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-300">No Open Pull Requests Found</h3>
                  <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
                    There are currently no open pull requests in {activeRepoForPrs.fullName}. Open a pull request on GitHub or push new commits to review them.
                  </p>
                </div>
                <a
                  href={`https://github.com/${activeRepoForPrs.fullName}/pulls`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs font-mono"
                >
                  <span>View Repository on GitHub</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-[#0E1017]/60 text-[11px] font-mono text-zinc-400">
                      <th className="py-3 px-5 font-medium">Pull Request</th>
                      <th className="py-3 px-4 font-medium">Author</th>
                      <th className="py-3 px-4 font-medium">Branches & Commit</th>
                      <th className="py-3 px-4 font-medium">Review Status</th>
                      <th className="py-3 px-5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {openPrs.map((pr) => {
                      const isTriggering = reviewingPrs[pr.number];
                      const review = pr.latestReview;
                      const isJobActive = review && ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'].includes(review.status);
                      const isCompleted = review && review.status === 'COMPLETED';

                      return (
                        <tr
                          key={pr.id || pr.number}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* PR Title & Number */}
                          <td className="py-4 px-5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <a
                                  href={pr.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1 group-hover:underline"
                                >
                                  <span>{pr.title}</span>
                                  <ExternalLink className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                                <span>#{pr.number}</span>
                                <span>•</span>
                                <span>
                                  opened {new Date(pr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Author */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {pr.author?.avatarUrl ? (
                                <img
                                  src={pr.author.avatarUrl}
                                  alt={pr.author.login}
                                  className="w-5 h-5 rounded-full border border-white/[0.1]"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px]">
                                  {pr.author?.login?.[0] || 'U'}
                                </div>
                              )}
                              <span className="text-xs text-zinc-300 font-mono">
                                {pr.author?.login || 'unknown'}
                              </span>
                            </div>
                          </td>

                          {/* Branches & Commit */}
                          <td className="py-4 px-4">
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-zinc-300">
                                <GitBranch className="w-3 h-3 text-blue-400 shrink-0" />
                                <span className="text-blue-300 font-medium truncate max-w-[120px]" title={pr.headRef}>
                                  {pr.headRef}
                                </span>
                                <span className="text-zinc-600">→</span>
                                <span className="text-zinc-400 truncate max-w-[100px]" title={pr.baseRef}>
                                  {pr.baseRef}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                SHA: <span className="text-zinc-400">{pr.headSha?.slice(0, 7)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Review Status */}
                          <td className="py-4 px-4">
                            {renderReviewStatus(pr)}
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isJobActive ? (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono cursor-not-allowed opacity-90"
                                >
                                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                                  <span>Analyzing...</span>
                                </button>
                              ) : isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/dashboard/reviews/${review.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Results</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                  <button
                                    onClick={() => handleReviewPr(activeRepoForPrs.id, pr.number, true)}
                                    disabled={isTriggering}
                                    title="Rerun AI review on current commit"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg btn-secondary text-xs font-mono text-zinc-300 hover:text-white"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${isTriggering ? 'animate-spin' : ''}`} />
                                    <span>Rerun</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReviewPr(activeRepoForPrs.id, pr.number, false)}
                                  disabled={isTriggering}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-primary text-xs font-medium font-mono group/btn shadow-sm"
                                >
                                  <Sparkles className={`w-3.5 h-3.5 text-blue-300 ${isTriggering ? 'animate-spin' : 'group-hover/btn:scale-110'} transition-transform`} />
                                  <span>{isTriggering ? 'Starting...' : 'Review with AI'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 border-t border-white/[0.06] bg-[#0E1017]/30 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <div>
                    Page <span className="text-white font-medium">{prPage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage - 1)}
                      disabled={prPage <= 1 || isLoadingPrs}
                      className="px-2.5 py-1 rounded-md btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage + 1)}
                      disabled={!prHasMore || isLoadingPrs}
                      className="px-2.5 py-1 rounded-md btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Repository Picker Modal */}
        {isRepoPickerOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0C0E14] rounded-xl border border-white/[0.1] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Select GitHub Repositories</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Toggle which repositories ReviewFlow AI automatically reviews when pull requests are opened.
                  </p>
                </div>
                <button
                  onClick={() => setIsRepoPickerOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {isLoadingAvailable ? (
                  <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                    Querying GitHub App API for authorized repositories...
                  </div>
                ) : availableRepos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                    No repositories found under this installation. Make sure you granted access in GitHub App settings.
                  </div>
                ) : (
                  availableRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-3.5 rounded-lg bg-[#08090C] border border-white/[0.06] flex items-center justify-between hover:border-white/[0.1] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white font-mono">{repo.fullName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Default branch: {repo.defaultBranch}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRepo(repo, !repo.isConnected)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                          repo.isConnected
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300'
                            : 'bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {repo.isConnected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Monitored</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Enable Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <a
                  href={appInfo?.installUrl || 'https://github.com/apps'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Configure Repositories on GitHub</span>
                </a>
                <button
                  onClick={() => setIsRepoPickerOpen(false)}
                  className="px-4 py-1.5 rounded-lg btn-primary text-xs font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Policy Configuration Modal */}
        {selectedRepo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-[#0C0E14] rounded-xl border border-white/[0.1] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Review Policy: {selectedRepo.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">{selectedRepo.fullName}</p>
                </div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-zinc-500 hover:text-white text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Severity Threshold (Block Pull Request)
                  </label>
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-[#08090C] border border-white/[0.08] rounded-md px-3 py-2 text-zinc-200 text-xs focus:outline-none font-mono"
                  >
                    <option value="CRITICAL">CRITICAL only</option>
                    <option value="HIGH">HIGH and above</option>
                    <option value="MEDIUM">MEDIUM and above</option>
                    <option value="LOW">LOW and above</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blockOnCritical}
                      onChange={(e) => setBlockOnCritical(e.target.checked)}
                      className="rounded bg-zinc-900 border-white/[0.1] text-blue-500"
                    />
                    <span>Fail GitHub Check Run if Critical vulnerability is detected</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoInline}
                      onChange={(e) => setAutoInline(e.target.checked)}
                      className="rounded bg-zinc-900 border-white/[0.1] text-blue-500"
                    />
                    <span>Post inline comments directly to GitHub conversation thread</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireTests}
                      onChange={(e) => setRequireTests(e.target.checked)}
                      className="rounded bg-zinc-900 border-white/[0.1] text-blue-500"
                    />
                    <span>Enforce unit test coverage expectation for newly added functions</span>
                  </label>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Custom Repository Instructions & Style Rules
                  </label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full bg-[#08090C] border border-white/[0.08] rounded-md p-3 text-zinc-200 text-xs focus:outline-none font-mono leading-relaxed"
                    placeholder="e.g. Enforce strict input sanitization, check for SQL injection..."
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="px-3 py-1.5 rounded-lg btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-primary text-xs font-medium"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Policy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RepositoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] p-8 text-zinc-400 font-mono text-xs flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
          <span>Loading repository workspace...</span>
        </div>
      }
    >
      <RepositoriesPageContent />
    </Suspense>
  );
}

