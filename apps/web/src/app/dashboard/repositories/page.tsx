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
  ShieldAlert,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Eye,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode2,
  CheckSquare,
  Key,
  Lock,
  MessageSquareQuote,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';
import { api } from '../../../lib/api-client';

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

  // Indexing states
  const [repoIndexStatuses, setRepoIndexStatuses] = useState<Record<string, any>>({});
  const [indexingRepos, setIndexingRepos] = useState<Record<string, boolean>>({});

  // Test generation modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRepo, setTestRepo] = useState<any | null>(null);
  const [testTargetFile, setTestTargetFile] = useState('src/index.ts');
  const [testFramework, setTestFramework] = useState('Jest');
  const [testSnippet, setTestSnippet] = useState('');
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<any | null>(null);
  const [testActionNotice, setTestActionNotice] = useState<string | null>(null);

  // Approval requests drawer state
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);
  const [approvalsRepo, setApprovalsRepo] = useState<any | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [executingApproval, setExecutingApproval] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null);

  const fetchIndexStatus = useCallback(async (repoId: string) => {
    try {
      const res = await api.getIndexingStatus(repoId);
      if (res?.data) {
        setRepoIndexStatuses((prev) => ({ ...prev, [repoId]: res.data }));
      }
    } catch {}
  }, []);

  const handleTriggerIndexing = async (repoId: string) => {
    setIndexingRepos((prev) => ({ ...prev, [repoId]: true }));
    try {
      await api.triggerIndexing(repoId);
      setPolicySaved('Indexing job enqueued. Language-aware chunking and vector embeddings started...');
      setTimeout(() => setPolicySaved(null), 4000);
      await fetchIndexStatus(repoId);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger indexing.');
    } finally {
      setIndexingRepos((prev) => ({ ...prev, [repoId]: false }));
    }
  };

  const handleOpenTestModal = (repo: any) => {
    setTestRepo(repo);
    setGeneratedTest(null);
    setTestActionNotice(null);
    setIsTestModalOpen(true);
  };

  const handleGenerateTest = async () => {
    if (!testRepo) return;
    setIsGeneratingTest(true);
    setTestActionNotice(null);
    try {
      const res = await api.generateTestSuggestion(testRepo.id, {
        targetFile: testTargetFile,
        testFramework,
        diffSnippet: testSnippet || undefined,
      });
      if (res?.data) {
        setGeneratedTest(res.data);
      }
    } catch (err: any) {
      setTestActionNotice(`Failed to generate test: ${err.message}`);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleRequestApprovalForTest = async () => {
    if (!testRepo || !generatedTest) return;
    try {
      const res = await api.requestApproval(testRepo.id, {
        actionType: 'CREATE_PULL_REQUEST',
        targetBranch: testRepo.defaultBranch || 'main',
        title: `Add automated tests for ${generatedTest.functionOrComponent || testTargetFile}`,
        description: `Generated ${testFramework} test suite covering: ${generatedTest.behaviorTested}`,
        payload: {
          files: [
            {
              path: generatedTest.testFilePath || `tests/${testTargetFile.replace(/\.[^/.]+$/, '')}.test.ts`,
              content: generatedTest.proposedTestCode,
            },
          ],
        },
      });
      if (res?.data) {
        setTestActionNotice(`Write approval request submitted with nonce ${res.data.nonce.slice(0, 8)}... Awaiting developer approval.`);
      }
    } catch (err: any) {
      setTestActionNotice(`Failed to request approval: ${err.message}`);
    }
  };

  const handleOpenApprovals = async (repo: any) => {
    setApprovalsRepo(repo);
    setIsApprovalsModalOpen(true);
    setIsLoadingApprovals(true);
    setApprovalNotice(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/repositories/${repo.id}/approvals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPendingApprovals(json.data || []);
      }
    } catch {} finally {
      setIsLoadingApprovals(false);
    }
  };

  const handleExecuteApproval = async (approval: any, approve: boolean) => {
    if (!approvalsRepo) return;
    setExecutingApproval(approval.id);
    try {
      const res = await api.executeApproval(approvalsRepo.id, approval.id, {
        nonce: approval.nonce,
        approve,
        rejectionReason: approve ? undefined : 'Rejected by reviewer in dashboard',
      });
      if (res?.data?.success) {
        setApprovalNotice(res.data.message || (approve ? 'Successfully approved and executed!' : 'Rejected.'));
        setPendingApprovals((prev) => prev.filter((a) => a.id !== approval.id));
      } else {
        setApprovalNotice(res?.error?.message || 'Operation executed.');
      }
    } catch (err: any) {
      setApprovalNotice(`Execution failed: ${err.message}`);
    } finally {
      setExecutingApproval(null);
    }
  };

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
        repos.forEach((r: any) => fetchIndexStatus(r.id));
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-[#9AA7A1] text-[11px] font-mono">
          <Clock className="w-3 h-3 text-[#9AA7A1]" />
          <span>Not Reviewed</span>
        </span>
      );
    }

    if (review.isOutdated) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(255,180,84,0.10)] border border-[rgba(255,180,84,0.32)] text-[#FFB454] text-[11px] font-mono font-medium">
          <AlertTriangle className="w-3 h-3 text-[#FFB454]" />
          <span>Outdated (New Commits)</span>
        </span>
      );
    }

    switch (review.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(255,180,84,0.10)] border border-[rgba(255,180,84,0.32)] text-[#FFB454] text-[11px] font-mono animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-[#FFB454]" />
            <span>Queued</span>
          </span>
        );
      case 'FETCHING_DIFF':
      case 'ANALYZING':
      case 'VALIDATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-[11px] font-mono font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-[#34E5A5]" />
            <span>Running ({review.status.toLowerCase()})</span>
          </span>
        );
      case 'PUBLISHING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-[11px] font-mono animate-pulse font-medium">
            <Sparkles className="w-3 h-3 text-[#34E5A5]" />
            <span>Publishing...</span>
          </span>
        );
      case 'COMPLETED': {
        const isCritical = review.overallRisk === 'CRITICAL';
        const isHigh = review.overallRisk === 'HIGH';
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap shadow-sm ${
                isCritical
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : isHigh
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-[rgba(52,229,165,0.10)] border-[rgba(52,229,165,0.28)] text-[#34E5A5]'
              }`}
            >
              {isCritical || isHigh ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              )}
              <span>{review.overallRisk}</span>
              {review.totalFindings > 0 && (
                <span className="font-normal opacity-85">({review.totalFindings} findings)</span>
              )}
            </span>
          </div>
        );
      }
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(255,93,108,0.10)] border border-[rgba(255,93,108,0.32)] text-[#FF6B7A] text-[11px] font-mono font-semibold">
            <XCircle className="w-3 h-3 text-[#FF6B7A]" />
            <span>Failed</span>
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-[#9AA7A1] text-[11px] font-mono">
            <Clock className="w-3 h-3" />
            <span>Superseded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#04070A] text-[#9AA7A1] text-[11px] font-mono border border-[rgba(255,255,255,0.09)]">
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
    <div className="flex-1 pb-16 bg-[#04070A]">
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
                <FolderGit2 className="w-3.5 h-3.5 text-[#34E5A5]" />
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
          <div className="p-3.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#34E5A5] shrink-0" />
            <span>{policySaved}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[rgba(255,93,108,0.10)] border border-[rgba(255,93,108,0.32)] text-[#FF6B7A] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#FF6B7A] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* GitHub Installation Status Banner */}
        <div className="p-5 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] flex flex-wrap items-center justify-between gap-4 shadow-sleek-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-center shadow-sm">
              <Github className="w-5 h-5 text-[#F3F7F5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-sm font-bold text-[#F3F7F5] font-display">GitHub App Integration</h4>
                {installations.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] text-[11px] font-mono font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#34E5A5]" /> Connected ({installations.length})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(255,180,84,0.10)] text-[#FFB454] border border-[rgba(255,180,84,0.32)] text-[11px] font-mono font-semibold">
                    Not Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9AA7A1] font-mono mt-1">
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
                <RefreshCw className="w-3.5 h-3.5 text-[#34E5A5]" />
                <span>Sync Repositories</span>
              </button>
            )}
          </div>
        </div>

        {/* Repositories Display */}
        {isLoading ? (
          <div className="py-20 text-center text-[#9AA7A1] font-mono text-xs">Loading repositories...</div>
        ) : repositories.length === 0 ? (
          /* Honest Empty State */
          <div className="py-16 px-6 text-center border-2 border-dashed border-[rgba(255,255,255,0.09)] rounded-2xl bg-[#0A1115] shadow-sleek-sm">
            <div className="w-12 h-12 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-center mx-auto mb-3.5 text-[#9AA7A1]">
              <FolderGit2 className="w-6 h-6 text-[#34E5A5]" />
            </div>
            <h4 className="text-base font-bold text-[#F3F7F5] font-display">No repositories monitored</h4>
            <p className="text-xs sm:text-sm text-[#9AA7A1] max-w-md mx-auto mt-1 mb-6 font-mono leading-relaxed">
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
                  className={`p-6 rounded-2xl bg-[#0A1115] border cursor-pointer transition-all flex flex-col justify-between shadow-sleek-sm ${
                    isSelected
                      ? 'border-[rgba(52,229,165,0.45)] ring-2 ring-[rgba(52,229,165,0.45)]/20 bg-[rgba(52,229,165,0.10)]/15 shadow-sleek-md'
                      : 'border-[rgba(255,255,255,0.09)] hover:border-[rgba(52,229,165,0.28)] hover:shadow-sleek-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className={`w-4 h-4 ${isSelected ? 'text-[#34E5A5]' : 'text-[#9AA7A1]'}`} />
                        <span className="text-[11px] font-mono text-[#9AA7A1]">
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] font-mono font-bold">
                            Viewing PRs
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#04070A] text-[#F3F7F5] border border-[rgba(255,255,255,0.09)] font-mono font-medium">
                          {repo.autoReviewEnabled ? 'Auto-Review' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#F3F7F5] mb-0.5 font-display">{repo.name}</h3>
                    <span className="text-xs font-mono text-[#B4C0BB] block mb-4">{repo.fullName}</span>

                    <div className="space-y-2.5 text-xs bg-[rgba(255,255,255,0.035)] p-3.5 rounded-xl border border-[rgba(255,255,255,0.09)] mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#B4C0BB] font-medium text-[11px]">Threshold:</span>
                        <span className="text-[#FFB454] font-bold bg-[rgba(255,180,84,0.10)] px-2 py-0.5 rounded-full text-[10px] font-mono border border-[rgba(255,180,84,0.32)]">
                          {p.severityThreshold || 'MEDIUM'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#B4C0BB] font-medium text-[11px]">Block on Critical:</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] font-mono ${p.blockPrOnCritical ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)]' : 'bg-gray-100 text-gray-600'}`}>
                          {p.blockPrOnCritical ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#B4C0BB] font-medium text-[11px]">Inline Comments:</span>
                        <span className="text-[#F3F7F5] font-semibold text-[11px] font-mono">
                          {p.autoPostInlineComments ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Codebase Indexing Status & Action */}
                    <div className="mb-4 p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] text-xs font-mono">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[#B4C0BB] font-medium flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-[#34E5A5]" />
                          <span>Codebase Index</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerIndexing(repo.id);
                          }}
                          disabled={indexingRepos[repo.id]}
                          className="px-2.5 py-1 rounded-lg bg-[#126B50] hover:bg-[#0E523D] text-white text-[10px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${indexingRepos[repo.id] ? 'animate-spin' : ''}`} />
                          <span>{indexingRepos[repo.id] ? 'Indexing...' : 'Index Codebase'}</span>
                        </button>
                      </div>
                      <div className="text-[11px]">
                        {repoIndexStatuses[repo.id]?.lastIndexedAt ? (
                          <span className="text-[#34E5A5] font-semibold">
                            ✓ {repoIndexStatuses[repo.id].indexedFilesCount} files ({repoIndexStatuses[repo.id].totalChunksCount} chunks)
                          </span>
                        ) : (
                          <span className="text-[#98A2B3]">Not yet indexed for semantic search</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[rgba(255,255,255,0.09)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRepoForPrs(repo.id);
                        }}
                        className="text-[11px] text-[#9AA7A1] hover:text-[#34E5A5] font-mono flex items-center gap-1.5 font-medium"
                      >
                        <GitPullRequest className="w-3.5 h-3.5 text-[#34E5A5]" />
                        <span>{repo.pullRequestsCount || 0} reviews • View PRs</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPolicyModal(repo);
                        }}
                        className="flex items-center gap-1 text-xs text-[#34E5A5] hover:underline font-mono font-bold"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Policy</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/dashboard/qna?repoId=${repo.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[rgba(52,229,165,0.10)] hover:bg-[#D5EADF] text-[#34E5A5] text-[11px] font-mono font-semibold transition-all"
                      >
                        <MessageSquareQuote className="w-3 h-3" />
                        <span>Ask Q&A</span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTestModal(repo);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#0A1115] border border-[rgba(255,255,255,0.09)] hover:border-[rgba(52,229,165,0.28)] text-[#F3F7F5] text-[11px] font-mono font-semibold transition-all"
                      >
                        <FileCode2 className="w-3 h-3 text-[#34E5A5]" />
                        <span>Suggest Tests</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenApprovals(repo);
                        }}
                        className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#0A1115] border border-[rgba(255,255,255,0.09)] hover:border-[rgba(52,229,165,0.28)] text-[#F3F7F5] text-[11px] font-mono font-semibold transition-all"
                        title="View Pending Write Approvals"
                      >
                        <Lock className="w-3 h-3 text-[#FFB454]" />
                        <span>Approvals</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Pull Requests Section */}
        {repositories.length > 0 && activeRepoForPrs && (
          <div className="mt-9 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] overflow-hidden shadow-sleek-md">
            {/* Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.09)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#04070A]">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <GitPullRequest className="w-4 h-4 text-[#34E5A5]" />
                  <h2 className="text-base font-bold text-[#F3F7F5] font-display">Open Pull Requests</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] font-bold">
                    Live GitHub Sync
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A1] font-mono">
                  Existing and incoming pull requests for{' '}
                  <span className="text-[#F3F7F5] font-bold">{activeRepoForPrs.fullName}</span>. Select any PR to trigger an immediate AI review.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Repository selector if multiple */}
                {repositories.length > 1 && (
                  <select
                    value={activeRepoForPrs.id}
                    onChange={(e) => setSelectedRepoForPrs(e.target.value)}
                    className="bg-[#0A1115] border border-[rgba(255,255,255,0.09)] text-[#F3F7F5] text-xs rounded-xl px-3 py-2 font-mono focus:outline-none shadow-sm"
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
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrs ? 'animate-spin text-[#34E5A5]' : ''}`} />
                  <span>{isLoadingPrs ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Notification & Alerts */}
            {prSuccessNotice && (
              <div className="mx-6 mt-5 p-3.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-xs font-mono flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{prSuccessNotice}</span>
              </div>
            )}

            {prError && (
              <div className="mx-6 mt-5 p-3.5 rounded-xl bg-[rgba(255,93,108,0.10)] border border-[rgba(255,93,108,0.32)] text-[#FF6B7A] text-xs font-mono flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{prError}</span>
                </div>
                <button
                  onClick={() => fetchOpenPrs(activeRepoForPrs.id, prPage)}
                  className="px-2.5 py-1 rounded-md bg-[#FF5D6C] text-white text-[11px] font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Content states */}
            {isLoadingPrs && openPrs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="w-7 h-7 animate-spin text-[#34E5A5] mx-auto" />
                <p className="text-xs text-[#9AA7A1] font-mono">
                  Fetching open pull requests directly from GitHub API...
                </p>
              </div>
            ) : openPrs.length === 0 ? (
              <div className="p-16 text-center space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-center mx-auto text-[#9AA7A1]">
                  <GitPullRequest className="w-6 h-6 text-[#34E5A5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F3F7F5] font-display">No Open Pull Requests Found</h3>
                  <p className="text-xs text-[#9AA7A1] font-mono max-w-md mx-auto">
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
                    <tr className="border-b border-[rgba(255,255,255,0.09)] bg-[#04070A] text-[11px] font-mono text-[#9AA7A1] uppercase">
                      <th className="py-3.5 px-6 font-semibold">Pull Request</th>
                      <th className="py-3.5 px-5 font-semibold">Author</th>
                      <th className="py-3.5 px-5 font-semibold">Branches & Commit</th>
                      <th className="py-3.5 px-5 font-semibold">Review Status</th>
                      <th className="py-3.5 px-6 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.09)] text-xs">
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
                          className="hover:bg-[#04070A] transition-colors group"
                        >
                          {/* PR Title & Number */}
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={pr.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-[#F3F7F5] hover:text-[#34E5A5] transition-colors inline-flex items-center gap-1 group-hover:underline text-xs sm:text-sm font-display"
                                >
                                  <span>{pr.title}</span>
                                  <ExternalLink className="w-3 h-3 text-[#9AA7A1] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#9AA7A1]">
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
                                  className="w-6 h-6 rounded-full border border-[rgba(255,255,255,0.09)]"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] flex items-center justify-center text-[10px] font-mono font-bold">
                                  {(authorLogin || 'U').substring(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-[#F3F7F5] font-mono font-medium">
                                {authorLogin}
                              </span>
                            </div>
                          </td>

                          {/* Branches & Commit */}
                          <td className="py-4 px-5">
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex items-center gap-1.5 text-[#F3F7F5]">
                                <GitBranch className="w-3.5 h-3.5 text-[#34E5A5] shrink-0" />
                                <span className="text-[#34E5A5] font-semibold truncate max-w-[120px]" title={pr.headRef}>
                                  {pr.headRef}
                                </span>
                                <span className="text-[#9AA7A1]">→</span>
                                <span className="text-[#9AA7A1] truncate max-w-[100px]" title={pr.baseRef}>
                                  {pr.baseRef}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#9AA7A1]">
                                SHA: <span className="text-[#F3F7F5] font-medium">{pr.headSha?.slice(0, 7)}</span>
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] text-xs font-mono font-semibold cursor-not-allowed opacity-90"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#34E5A5]" />
                                  <span>Analyzing...</span>
                                </button>
                              ) : isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/dashboard/reviews/${review.id}`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#126B50] hover:bg-[#0A4D3A] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] whitespace-nowrap"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Results</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    onClick={() => handleReviewPr(activeRepoForPrs.id, pr.number, true)}
                                    disabled={isTriggering}
                                    title="Rerun AI review on current commit"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.09)] bg-[#0A1115] hover:bg-[#F7FAF8] text-[#B4C0BB] hover:text-[#F3F7F5] text-xs font-medium transition-colors shadow-sm"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin text-[#34E5A5]' : ''}`} />
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
                <div className="p-4 border-t border-[rgba(255,255,255,0.09)] bg-[#04070A] flex items-center justify-between text-xs font-mono text-[#9AA7A1]">
                  <div>
                    Page <span className="text-[#F3F7F5] font-bold">{prPage}</span>
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
            <div className="w-full max-w-2xl bg-[#0A1115] rounded-2xl border border-[rgba(255,255,255,0.09)] p-6 shadow-sleek-lg space-y-4 max-h-[85vh] flex flex-col text-[#F3F7F5]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.09)] pb-3.5">
                <div>
                  <h3 className="text-base font-bold text-[#F3F7F5] font-display">Select GitHub Repositories</h3>
                  <p className="text-xs text-[#9AA7A1] font-mono mt-0.5">
                    Toggle which repositories ReviewFlow AI automatically reviews when pull requests are opened.
                  </p>
                </div>
                <button
                  onClick={() => setIsRepoPickerOpen(false)}
                  className="text-[#9AA7A1] hover:text-[#F3F7F5] text-xs font-mono font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
                {isLoadingAvailable ? (
                  <div className="py-12 text-center text-xs text-[#9AA7A1] font-mono">
                    Querying GitHub App API for authorized repositories...
                  </div>
                ) : availableRepos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#9AA7A1] font-mono">
                    No repositories found under this installation. Make sure you granted access in GitHub App settings.
                  </div>
                ) : (
                  availableRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-between hover:border-[rgba(52,229,165,0.28)] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="w-4 h-4 text-[#34E5A5] shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#F3F7F5] font-mono">{repo.fullName}</span>
                            <span className="text-[10px] text-[#9AA7A1] font-mono">
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#9AA7A1] font-mono">
                            Default branch: {repo.defaultBranch}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRepo(repo, !repo.isConnected)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          repo.isConnected
                            ? 'bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] hover:bg-[rgba(255,93,108,0.10)] hover:border-[rgba(255,93,108,0.32)] hover:text-[#FF6B7A]'
                            : 'bg-[#0A1115] border border-[rgba(255,255,255,0.09)] text-[#F3F7F5] hover:bg-[#126B50] hover:text-white'
                        }`}
                      >
                        {repo.isConnected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#34E5A5]" />
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

              <div className="pt-3.5 border-t border-[rgba(255,255,255,0.09)] flex items-center justify-between text-xs">
                <a
                  href={appInfo?.installUrl || 'https://github.com/apps'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#34E5A5] hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold"
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
            <div className="w-full max-w-xl bg-[#0A1115] rounded-2xl border border-[rgba(255,255,255,0.09)] p-6 sm:p-7 shadow-sleek-lg space-y-5 text-[#F3F7F5]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.09)] pb-3.5">
                <div>
                  <h3 className="text-base font-bold text-[#F3F7F5] font-display">
                    Review Policy: {selectedRepo.name}
                  </h3>
                  <p className="text-xs text-[#9AA7A1] font-mono mt-0.5">{selectedRepo.fullName}</p>
                </div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-[#9AA7A1] hover:text-[#F3F7F5] text-xs font-mono font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F3F7F5] font-semibold mb-1.5">
                    Severity Threshold (Block Pull Request)
                  </label>
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl px-3.5 py-2 text-[#F3F7F5] text-xs focus:outline-none focus:border-[rgba(52,229,165,0.45)] font-mono font-medium"
                  >
                    <option value="CRITICAL">CRITICAL only</option>
                    <option value="HIGH">HIGH and above</option>
                    <option value="MEDIUM">MEDIUM and above</option>
                    <option value="LOW">LOW and above</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 text-[#F3F7F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blockOnCritical}
                      onChange={(e) => setBlockOnCritical(e.target.checked)}
                      className="rounded border-[rgba(255,255,255,0.09)] text-[#34E5A5] focus:ring-[rgba(52,229,165,0.45)]"
                    />
                    <span>Fail GitHub Check Run if Critical vulnerability is detected</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-[#F3F7F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoInline}
                      onChange={(e) => setAutoInline(e.target.checked)}
                      className="rounded border-[rgba(255,255,255,0.09)] text-[#34E5A5] focus:ring-[rgba(52,229,165,0.45)]"
                    />
                    <span>Post inline comments directly to GitHub conversation thread</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-[#F3F7F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireTests}
                      onChange={(e) => setRequireTests(e.target.checked)}
                      className="rounded border-[rgba(255,255,255,0.09)] text-[#34E5A5] focus:ring-[rgba(52,229,165,0.45)]"
                    />
                    <span>Enforce unit test coverage expectation for newly added functions</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[#F3F7F5] font-semibold mb-1.5">
                    Custom Repository Instructions & Style Rules
                  </label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl p-3.5 text-[#F3F7F5] text-xs focus:outline-none focus:border-[rgba(52,229,165,0.45)] font-mono leading-relaxed"
                    placeholder="e.g. Enforce strict input sanitization, check for SQL injection..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(255,255,255,0.09)] flex items-center justify-end gap-3">
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

        {/* AI Test Suggestion Modal (Section 7) */}
        {isTestModalOpen && testRepo && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0A1115] rounded-2xl border border-[rgba(255,255,255,0.09)] p-6 shadow-sleek-lg space-y-4 max-h-[90vh] flex flex-col text-[#F3F7F5]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.09)] pb-3">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#34E5A5]" />
                  <h3 className="text-base font-bold text-[#F3F7F5] font-display">
                    Generate Unit Tests: {testRepo.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTestModalOpen(false)}
                  className="text-[#9AA7A1] hover:text-[#F3F7F5] text-xs font-mono font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {testActionNotice && (
                  <div className="p-3 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] font-mono text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#34E5A5] shrink-0" />
                    <span>{testActionNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block text-[#F3F7F5] font-semibold mb-1">Target Source File</label>
                    <input
                      type="text"
                      value={testTargetFile}
                      onChange={(e) => setTestTargetFile(e.target.value)}
                      placeholder="e.g. src/auth/service.ts"
                      className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl px-3 py-2 text-[#F3F7F5] text-xs focus:outline-none focus:border-[rgba(52,229,165,0.45)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#F3F7F5] font-semibold mb-1">Test Framework</label>
                    <select
                      value={testFramework}
                      onChange={(e) => setTestFramework(e.target.value)}
                      className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl px-3 py-2 text-[#F3F7F5] text-xs focus:outline-none focus:border-[rgba(52,229,165,0.45)]"
                    >
                      <option value="Jest">Jest / Vitest</option>
                      <option value="Mocha">Mocha / Chai</option>
                      <option value="Pytest">Pytest (Python)</option>
                      <option value="Go testing">Go testing package</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#F3F7F5] font-semibold mb-1 font-mono">
                    Code Snippet or Function Scope (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={testSnippet}
                    onChange={(e) => setTestSnippet(e.target.value)}
                    placeholder="Optional snippet or function name to target specifically..."
                    className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl p-3 text-[#F3F7F5] text-xs focus:outline-none focus:border-[rgba(52,229,165,0.45)] font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateTest}
                    disabled={isGeneratingTest}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-semibold"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTest ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingTest ? 'Generating Test Suite...' : 'Generate Test Proposal'}</span>
                  </button>
                </div>

                {generatedTest && (
                  <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.09)]">
                    <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F7F5] font-display">
                          {generatedTest.behaviorTested}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-bold">
                          {generatedTest.framework}
                        </span>
                      </div>
                      <p className="text-[#B4C0BB] text-xs">{generatedTest.whyItMatters}</p>

                      {generatedTest.potentialEdgeCases?.length > 0 && (
                        <div className="text-[11px] font-mono pt-1">
                          <span className="font-semibold text-[#F3F7F5] block mb-1">Edge Cases Handled:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[#B4C0BB]">
                            {generatedTest.potentialEdgeCases.map((ec: string, i: number) => (
                              <li key={i}>{ec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                        <span className="text-[#9AA7A1] font-semibold">
                          Proposed File: <strong className="text-[#F3F7F5]">{generatedTest.testFilePath}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedTest.proposedTestCode)}
                          className="text-[#34E5A5] hover:underline flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Copy Code</span>
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#126B50] text-[#F3F7F5] font-mono text-[11px] overflow-x-auto max-h-64 whitespace-pre">
                        {generatedTest.proposedTestCode}
                      </pre>
                    </div>

                    {/* Section 7 Human-in-the-Loop Safe Approval */}
                    <div className="p-3.5 rounded-xl bg-[rgba(255,180,84,0.10)]/40 border border-[rgba(255,180,84,0.32)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-[#FFB454] block">Safe Two-Phase Write Control</span>
                        <span className="text-[11px] text-[#9AA7A1]">
                          No write is executed automatically. Requesting approval binds this patch to a 64-character cryptographic nonce.
                        </span>
                      </div>
                      <button
                        onClick={handleRequestApprovalForTest}
                        className="px-3.5 py-2 rounded-xl bg-[#126B50] hover:bg-[#0E523D] text-white font-semibold whitespace-nowrap text-xs shadow-sm flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Request PR Approval</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Write Approvals Drawer (Section 7) */}
        {isApprovalsModalOpen && approvalsRepo && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0A1115] rounded-2xl border border-[rgba(255,255,255,0.09)] p-6 shadow-sleek-lg space-y-4 max-h-[85vh] flex flex-col text-[#F3F7F5]">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.09)] pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#FFB454]" />
                  <h3 className="text-base font-bold text-[#F3F7F5] font-display">
                    Pending Write Approvals: {approvalsRepo.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsApprovalsModalOpen(false)}
                  className="text-[#9AA7A1] hover:text-[#F3F7F5] text-xs font-mono font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              {approvalNotice && (
                <div className="p-3 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34E5A5] shrink-0" />
                  <span>{approvalNotice}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
                {isLoadingApprovals ? (
                  <div className="py-12 text-center text-[#9AA7A1]">Loading pending approval requests...</div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="py-12 text-center text-[#9AA7A1]">
                    No pending approval requests. Write actions require explicit developer proposal before execution.
                  </div>
                ) : (
                  pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F7F5] text-sm font-display">
                          {approval.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[rgba(255,180,84,0.10)] text-[#FFB454] border border-[rgba(255,180,84,0.32)] text-[10px] font-bold">
                          {approval.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#B4C0BB]">{approval.description}</p>

                      <div className="text-[11px] text-[#9AA7A1] space-y-1 bg-[#0A1115] p-2.5 rounded-lg border border-[rgba(255,255,255,0.09)]">
                        <div>Target Branch: <strong className="text-[#F3F7F5]">{approval.targetBranch}</strong></div>
                        <div>Target SHA: <strong className="text-[#F3F7F5]">{approval.targetCommitSha || 'HEAD'}</strong></div>
                        <div>Nonce: <code className="text-[#34E5A5]">{approval.nonce.slice(0, 16)}...</code></div>
                        <div>Expires: {new Date(approval.expiresAt).toLocaleString()}</div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.09)]">
                        <button
                          onClick={() => handleExecuteApproval(approval, false)}
                          disabled={Boolean(executingApproval)}
                          className="px-3 py-1.5 rounded-lg border border-[rgba(255,93,108,0.32)] text-[#FF6B7A] hover:bg-[rgba(255,93,108,0.10)] text-xs font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleExecuteApproval(approval, true)}
                          disabled={Boolean(executingApproval)}
                          className="px-4 py-1.5 rounded-lg bg-[#126B50] hover:bg-[#0E523D] text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{executingApproval === approval.id ? 'Executing via GitHub...' : 'Approve & Execute via GitHub'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
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
        <div className="min-h-screen bg-[#04070A] p-8 text-[#9AA7A1] font-mono text-xs flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-[#34E5A5] mr-2" />
          <span>Loading repository workspace...</span>
        </div>
      }
    >
      <RepositoriesPageContent />
    </Suspense>
  );
}
