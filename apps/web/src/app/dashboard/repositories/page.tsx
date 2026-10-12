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

  const claimInstallation = useCallback(async (installationId: number, state?: string) => {
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
        body: JSON.stringify({ installationId, state }),
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
    const queryState = searchParams.get('state');
    if (queryInstallId) {
      const numericId = parseInt(queryInstallId, 10);
      if (!isNaN(numericId) && numericId > 0) {
        claimInstallation(numericId, queryState || undefined);
      }
    }
  }, [searchParams, claimInstallation]);

  // If redirected with ?picker=true and installations exist, open picker modal
  useEffect(() => {
    if (searchParams.get('picker') === 'true' && installations.length > 0) {
      openRepoPicker();
    }
  }, [searchParams, installations.length]);

  const handleConnectGitHub = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setIsClaiming(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/repositories/installations/initiate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.data?.installUrl) {
        window.location.href = json.data.installUrl;
      } else {
        window.location.href = appInfo?.installUrl || 'https://github.com/apps';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate secure GitHub App installation.');
      setIsClaiming(false);
    }
  };

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F9F8] border border-[#E4EAE6] text-[#66736D] text-[11px] font-mono">
          <Clock className="w-3 h-3 text-[#66736D]" />
          <span>Not Reviewed</span>
        </span>
      );
    }

    if (review.isOutdated) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B7791F] text-[11px] font-mono font-medium">
          <AlertTriangle className="w-3 h-3 text-[#B7791F]" />
          <span>Outdated (New Commits)</span>
        </span>
      );
    }

    switch (review.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B7791F] text-[11px] font-mono animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-[#B7791F]" />
            <span>Queued</span>
          </span>
        );
      case 'FETCHING_DIFF':
      case 'ANALYZING':
      case 'VALIDATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] text-[11px] font-mono font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-[#126B50]" />
            <span>Running ({review.status.toLowerCase()})</span>
          </span>
        );
      case 'PUBLISHING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] text-[11px] font-mono animate-pulse font-medium">
            <Sparkles className="w-3 h-3 text-[#126B50]" />
            <span>Publishing...</span>
          </span>
        );
      case 'COMPLETED': {
        const riskColors: Record<string, string> = {
          CRITICAL: 'bg-[#FDE8E8] border-[#F8B4B4] text-[#C43D4B]',
          HIGH: 'bg-[#FEF3C7] border-[#FDE68A] text-[#B7791F]',
          MEDIUM: 'bg-[#EAF5EF] border-[#C7E4D6] text-[#126B50]',
          LOW: 'bg-[#F7F9F8] border-[#E4EAE6] text-[#14211D]',
          SAFE: 'bg-[#EAF5EF] border-[#C7E4D6] text-[#126B50]',
        };
        const colorClass = riskColors[review.overallRisk] || 'bg-[#EAF5EF] border-[#C7E4D6] text-[#126B50]';
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${colorClass}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{review.overallRisk}</span>
              {review.totalFindings > 0 && <span className="opacity-80">({review.totalFindings} findings)</span>}
            </span>
          </div>
        );
      }
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-[11px] font-mono font-semibold">
            <XCircle className="w-3 h-3 text-[#C43D4B]" />
            <span>Failed</span>
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F9F8] border border-[#E4EAE6] text-[#66736D] text-[11px] font-mono">
            <Clock className="w-3 h-3" />
            <span>Superseded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F7F9F8] text-[#66736D] text-[11px] font-mono border border-[#E4EAE6]">
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
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title="Connected Repositories"
        description="Configure automated review policies, severity thresholds, and custom guidelines per repository."
        action={
          <div className="flex items-center gap-2.5">
            {installations.length > 0 && (
              <button
                onClick={openRepoPicker}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-secondary text-xs font-semibold shadow-sleek-sm"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-[#126B50]" />
                <span>Select Repositories</span>
              </button>
            )}
            <button
              onClick={handleConnectGitHub}
              disabled={isClaiming}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-semibold shadow-sleek-sm"
            >
              <Github className="w-3.5 h-3.5" />
              <span>{installations.length > 0 ? 'Add GitHub Account' : 'Connect GitHub App'}</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>
          </div>
        }
      />

      <div className="px-6 sm:px-8 pt-8 space-y-6 max-w-7xl mx-auto">
        {policySaved && (
          <div className="p-3.5 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#16835B] shrink-0" />
            <span>{policySaved}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#C43D4B] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* GitHub Installation Status Banner */}
        <div className="p-5 rounded-2xl bg-white border border-[#E4EAE6] flex flex-wrap items-center justify-between gap-4 shadow-sleek-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-center shadow-sm">
              <Github className="w-5 h-5 text-[#14211D]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-sm font-bold text-[#14211D] font-display">GitHub App Integration</h4>
                {installations.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] text-[11px] font-mono font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16835B]" /> Connected ({installations.length})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A] text-[11px] font-mono font-semibold">
                    Not Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-[#66736D] font-mono mt-1">
                {installations.length > 0
                  ? `Active account: ${installations.map((i) => i.accountLogin).join(', ')}`
                  : 'Install the ReviewFlow PR Assistant on your GitHub account or organization.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {installations.length === 0 ? (
              <button
                onClick={handleConnectGitHub}
                disabled={isClaiming}
                className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-xs font-semibold"
              >
                <Github className="w-4 h-4" />
                <span>{isClaiming ? 'Redirecting to GitHub...' : 'Connect GitHub App'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            ) : (
              <button
                onClick={openRepoPicker}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl btn-secondary text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#126B50]" />
                <span>Sync Repositories</span>
              </button>
            )}
          </div>
        </div>

        {/* Repositories Display */}
        {isLoading ? (
          <div className="py-20 text-center text-[#66736D] font-mono text-xs">Loading repositories...</div>
        ) : repositories.length === 0 ? (
          /* Honest Empty State */
          <div className="py-16 px-6 text-center border-2 border-dashed border-[#E4EAE6] rounded-2xl bg-white shadow-sleek-sm">
            <div className="w-12 h-12 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-center mx-auto mb-3.5 text-[#66736D]">
              <FolderGit2 className="w-6 h-6 text-[#126B50]" />
            </div>
            <h4 className="text-base font-bold text-[#14211D] font-display">No repositories monitored</h4>
            <p className="text-xs sm:text-sm text-[#66736D] max-w-md mx-auto mt-1 mb-6 font-mono leading-relaxed">
              {installations.length > 0
                ? 'Your GitHub App is connected! Click "Select Repositories" to choose which repositories to monitor for automated code reviews.'
                : 'Install the ReviewFlow PR Assistant on your GitHub account or organization to authorize repositories.'}
            </p>
            {installations.length > 0 ? (
              <button
                onClick={openRepoPicker}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shadow-sm"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Select Repositories to Monitor</span>
              </button>
            ) : (
              <a
                href={appInfo?.installUrl || 'https://github.com/apps'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shadow-sm"
              >
                <Github className="w-4 h-4" />
                <span>Install GitHub App</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}
          </div>
        ) : (
          /* Repositories Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {repositories.map((repo) => {
              const p = repo.policy || {};
              const isSelected = activeRepoForPrs?.id === repo.id;
              return (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepoForPrs(repo.id)}
                  className={`p-6 rounded-2xl bg-white border cursor-pointer transition-all flex flex-col justify-between shadow-sleek-sm ${
                    isSelected
                      ? 'border-[#126B50] ring-2 ring-[#126B50]/20 bg-[#EAF5EF]/15 shadow-sleek-md'
                      : 'border-[#E4EAE6] hover:border-[#C7E4D6] hover:shadow-sleek-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className={`w-4 h-4 ${isSelected ? 'text-[#126B50]' : 'text-[#66736D]'}`} />
                        <span className="text-[11px] font-mono text-[#66736D]">
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-mono font-bold">
                            Viewing PRs
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7F9F8] text-[#14211D] border border-[#E4EAE6] font-mono font-medium">
                          {repo.autoReviewEnabled ? 'Auto-Review' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#14211D] mb-0.5 font-display">{repo.name}</h3>
                    <span className="text-xs font-mono text-[#66736D] block mb-4">{repo.fullName}</span>

                    <div className="space-y-2 text-xs text-[#14211D] font-mono bg-[#F7F9F8] p-3.5 rounded-xl border border-[#E4EAE6] mb-5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#66736D]">Threshold:</span>
                        <span className="text-[#B7791F] font-bold">{p.severityThreshold || 'MEDIUM'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66736D]">Block on Critical:</span>
                        <span className="text-[#126B50] font-bold">{p.blockPrOnCritical ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#66736D]">Inline Comments:</span>
                        <span className="text-[#14211D] font-medium">{p.autoPostInlineComments ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E4EAE6] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepoForPrs(repo.id);
                      }}
                      className="text-[11px] text-[#66736D] hover:text-[#126B50] font-mono flex items-center gap-1.5 font-medium"
                    >
                      <GitPullRequest className="w-3.5 h-3.5 text-[#126B50]" />
                      <span>{repo.pullRequestsCount || 0} reviews • View PRs</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPolicyModal(repo);
                      }}
                      className="flex items-center gap-1 text-xs text-[#126B50] hover:underline font-mono font-bold"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Policy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Pull Requests Section */}
        {repositories.length > 0 && activeRepoForPrs && (
          <div className="mt-9 rounded-2xl bg-white border border-[#E4EAE6] overflow-hidden shadow-sleek-md">
            {/* Header */}
            <div className="p-6 border-b border-[#E4EAE6] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F7F9F8]">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <GitPullRequest className="w-4 h-4 text-[#126B50]" />
                  <h2 className="text-base font-bold text-[#14211D] font-display">Open Pull Requests</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-bold">
                    Live GitHub Sync
                  </span>
                </div>
                <p className="text-xs text-[#66736D] font-mono">
                  Existing and incoming pull requests for{' '}
                  <span className="text-[#14211D] font-bold">{activeRepoForPrs.fullName}</span>. Select any PR to trigger an immediate AI review.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Repository selector if multiple */}
                {repositories.length > 1 && (
                  <select
                    value={activeRepoForPrs.id}
                    onChange={(e) => setSelectedRepoForPrs(e.target.value)}
                    className="bg-white border border-[#E4EAE6] text-[#14211D] text-xs rounded-xl px-3 py-2 font-mono focus:outline-none shadow-sm"
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-secondary text-xs font-mono font-medium"
                  title="Fetch latest open pull requests from GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrs ? 'animate-spin text-[#126B50]' : ''}`} />
                  <span>{isLoadingPrs ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Notification & Alerts */}
            {prSuccessNotice && (
              <div className="mx-6 mt-5 p-3.5 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] text-xs font-mono flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{prSuccessNotice}</span>
              </div>
            )}

            {prError && (
              <div className="mx-6 mt-5 p-3.5 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{prError}</span>
                </div>
                <button
                  onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage)}
                  className="px-2.5 py-1 rounded-md bg-[#C43D4B] text-white text-[11px] font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Content states */}
            {isLoadingPrs && openPrs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="w-7 h-7 animate-spin text-[#126B50] mx-auto" />
                <p className="text-xs text-[#66736D] font-mono">
                  Fetching open pull requests directly from GitHub API...
                </p>
              </div>
            ) : openPrs.length === 0 ? (
              <div className="p-16 text-center space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-center mx-auto text-[#66736D]">
                  <GitPullRequest className="w-6 h-6 text-[#126B50]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#14211D] font-display">No Open Pull Requests Found</h3>
                  <p className="text-xs text-[#66736D] font-mono max-w-md mx-auto">
                    There are currently no open pull requests in {activeRepoForPrs.fullName}. Open a pull request on GitHub or push new commits to review them.
                  </p>
                </div>
                <a
                  href={`https://github.com/${activeRepoForPrs.fullName}/pulls`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-secondary text-xs font-mono font-medium"
                >
                  <span>View Repository on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4EAE6] bg-[#F7F9F8] text-[11px] font-mono text-[#66736D] uppercase">
                      <th className="py-3.5 px-6 font-semibold">Pull Request</th>
                      <th className="py-3.5 px-5 font-semibold">Author</th>
                      <th className="py-3.5 px-5 font-semibold">Branches & Commit</th>
                      <th className="py-3.5 px-5 font-semibold">Review Status</th>
                      <th className="py-3.5 px-6 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAE6] text-xs">
                    {openPrs.map((pr) => {
                      const isTriggering = reviewingPrs[pr.number];
                      const review = pr.latestReview;
                      const isJobActive = review && ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'].includes(review.status);
                      const isCompleted = review && review.status === 'COMPLETED';

                      const authorLogin = typeof pr.author === 'string'
                        ? pr.author
                        : (pr.author?.login || pr.authorName || 'unknown');
                      const authorAvatar = pr.authorAvatarUrl || (typeof pr.author === 'object' ? pr.author?.avatarUrl : null);

                      return (
                        <tr
                          key={pr.id || pr.number}
                          className="hover:bg-[#F7F9F8] transition-colors group"
                        >
                          {/* PR Title & Number */}
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={pr.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-[#14211D] hover:text-[#126B50] transition-colors inline-flex items-center gap-1 group-hover:underline text-xs sm:text-sm font-display"
                                >
                                  <span>{pr.title}</span>
                                  <ExternalLink className="w-3 h-3 text-[#66736D] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#66736D]">
                                <span>#{pr.number}</span>
                                <span>•</span>
                                <span>
                                  opened {new Date(pr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Author */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2.5">
                              {authorAvatar ? (
                                <img
                                  src={authorAvatar}
                                  alt={authorLogin}
                                  className="w-6 h-6 rounded-full border border-[#E4EAE6]"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#EAF5EF] text-[#126B50] flex items-center justify-center text-[10px] font-mono font-bold">
                                  {(authorLogin || 'U').substring(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-[#14211D] font-mono font-medium">
                                {authorLogin}
                              </span>
                            </div>
                          </td>

                          {/* Branches & Commit */}
                          <td className="py-4 px-5">
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-[#14211D]">
                                <GitBranch className="w-3.5 h-3.5 text-[#126B50] shrink-0" />
                                <span className="text-[#126B50] font-semibold truncate max-w-[120px]" title={pr.headRef}>
                                  {pr.headRef}
                                </span>
                                <span className="text-[#66736D]">→</span>
                                <span className="text-[#66736D] truncate max-w-[100px]" title={pr.baseRef}>
                                  {pr.baseRef}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#66736D]">
                                SHA: <span className="text-[#14211D] font-medium">{pr.headSha?.slice(0, 7)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Review Status */}
                          <td className="py-4 px-5">
                            {renderReviewStatus(pr)}
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              {isJobActive ? (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] text-xs font-mono font-semibold cursor-not-allowed opacity-90"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#126B50]" />
                                  <span>Analyzing...</span>
                                </button>
                              ) : isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/dashboard/reviews/${review.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF5EF] hover:bg-[#D5EEDB] text-[#126B50] border border-[#C7E4D6] text-xs font-mono font-bold transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Results</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    onClick={() => handleReviewPr(activeRepoForPrs.id, pr.number, true)}
                                    disabled={isTriggering}
                                    title="Rerun AI review on current commit"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl btn-secondary text-xs font-mono font-medium"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
                                    <span>Rerun</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReviewPr(activeRepoForPrs.id, pr.number, false)}
                                  disabled={isTriggering}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-semibold font-mono shadow-sleek-sm"
                                >
                                  <Sparkles className={`w-3.5 h-3.5 text-white ${isTriggering ? 'animate-spin' : ''}`} />
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
                <div className="p-4 border-t border-[#E4EAE6] bg-[#F7F9F8] flex items-center justify-between text-xs font-mono text-[#66736D]">
                  <div>
                    Page <span className="text-[#14211D] font-bold">{prPage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage - 1)}
                      disabled={prPage <= 1 || isLoadingPrs}
                      className="px-3 py-1.5 rounded-lg btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage + 1)}
                      disabled={!prHasMore || isLoadingPrs}
                      className="px-3 py-1.5 rounded-lg btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
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
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E4EAE6] p-6 shadow-sleek-lg space-y-4 max-h-[85vh] flex flex-col text-[#14211D]">
              <div className="flex items-center justify-between border-b border-[#E4EAE6] pb-3.5">
                <div>
                  <h3 className="text-base font-bold text-[#14211D] font-display">Select GitHub Repositories</h3>
                  <p className="text-xs text-[#66736D] font-mono mt-0.5">
                    Toggle which repositories ReviewFlow AI automatically reviews when pull requests are opened.
                  </p>
                </div>
                <button
                  onClick={() => setIsRepoPickerOpen(false)}
                  className="text-[#66736D] hover:text-[#14211D] text-xs font-mono font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
                {isLoadingAvailable ? (
                  <div className="py-12 text-center text-xs text-[#66736D] font-mono">
                    Querying GitHub App API for authorized repositories...
                  </div>
                ) : availableRepos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#66736D] font-mono">
                    No repositories found under this installation. Make sure you granted access in GitHub App settings.
                  </div>
                ) : (
                  availableRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-between hover:border-[#C7E4D6] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="w-4 h-4 text-[#126B50] shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#14211D] font-mono">{repo.fullName}</span>
                            <span className="text-[10px] text-[#66736D] font-mono">
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#66736D] font-mono">
                            Default branch: {repo.defaultBranch}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRepo(repo, !repo.isConnected)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          repo.isConnected
                            ? 'bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] hover:bg-[#FDE8E8] hover:border-[#F8B4B4] hover:text-[#C43D4B]'
                            : 'bg-white border border-[#E4EAE6] text-[#14211D] hover:bg-[#126B50] hover:text-white'
                        }`}
                      >
                        {repo.isConnected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#16835B]" />
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

              <div className="pt-3.5 border-t border-[#E4EAE6] flex items-center justify-between text-xs">
                <a
                  href={appInfo?.installUrl || 'https://github.com/apps'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#126B50] hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Configure Repositories on GitHub</span>
                </a>
                <button
                  onClick={() => setIsRepoPickerOpen(false)}
                  className="px-5 py-2 rounded-xl btn-primary text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Policy Configuration Modal */}
        {selectedRepo && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl border border-[#E4EAE6] p-6 sm:p-7 shadow-sleek-lg space-y-5 text-[#14211D]">
              <div className="flex items-center justify-between border-b border-[#E4EAE6] pb-3.5">
                <div>
                  <h3 className="text-base font-bold text-[#14211D] font-display">
                    Review Policy: {selectedRepo.name}
                  </h3>
                  <p className="text-xs text-[#66736D] font-mono mt-0.5">{selectedRepo.fullName}</p>
                </div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-[#66736D] hover:text-[#14211D] text-xs font-mono font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#14211D] font-semibold mb-1.5">
                    Severity Threshold (Block Pull Request)
                  </label>
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-[#F7F9F8] border border-[#E4EAE6] rounded-xl px-3.5 py-2 text-[#14211D] text-xs focus:outline-none focus:border-[#126B50] font-mono font-medium"
                  >
                    <option value="CRITICAL">CRITICAL only</option>
                    <option value="HIGH">HIGH and above</option>
                    <option value="MEDIUM">MEDIUM and above</option>
                    <option value="LOW">LOW and above</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 text-[#14211D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blockOnCritical}
                      onChange={(e) => setBlockOnCritical(e.target.checked)}
                      className="rounded border-[#E4EAE6] text-[#126B50] focus:ring-[#126B50]"
                    />
                    <span>Fail GitHub Check Run if Critical vulnerability is detected</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-[#14211D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoInline}
                      onChange={(e) => setAutoInline(e.target.checked)}
                      className="rounded border-[#E4EAE6] text-[#126B50] focus:ring-[#126B50]"
                    />
                    <span>Post inline comments directly to GitHub conversation thread</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-[#14211D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireTests}
                      onChange={(e) => setRequireTests(e.target.checked)}
                      className="rounded border-[#E4EAE6] text-[#126B50] focus:ring-[#126B50]"
                    />
                    <span>Enforce unit test coverage expectation for newly added functions</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[#14211D] font-semibold mb-1.5">
                    Custom Repository Instructions & Style Rules
                  </label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full bg-[#F7F9F8] border border-[#E4EAE6] rounded-xl p-3.5 text-[#14211D] text-xs focus:outline-none focus:border-[#126B50] font-mono leading-relaxed"
                    placeholder="e.g. Enforce strict input sanitization, check for SQL injection..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4EAE6] flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-semibold"
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
        <div className="min-h-screen bg-[#F7F9F8] p-8 text-[#66736D] font-mono text-xs flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-[#126B50] mr-2" />
          <span>Loading repository workspace...</span>
        </div>
      }
    >
      <RepositoriesPageContent />
    </Suspense>
  );
}
