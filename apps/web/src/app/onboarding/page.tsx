'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GitPullRequest,
  CheckCircle2,
  Building,
  Github,
  GitBranch,
  Play,
  ArrowRight,
  ArrowLeft,
  Zap,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api-client';

const STEPS = [
  { id: 1, title: 'Organization', desc: 'Tenant workspace' },
  { id: 2, title: 'GitHub App', desc: 'Authorize repositories' },
  { id: 3, title: 'Repositories', desc: 'Select codebases' },
  { id: 4, title: 'Pull Requests', desc: 'Review with AI' },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User & Organization state
  const [user, setUser] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');

  // GitHub Installation state
  const [installations, setInstallations] = useState<any[]>([]);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [isInitiatingInstall, setIsInitiatingInstall] = useState(false);
  const [manualInstallId, setManualInstallId] = useState('');

  // Repositories state
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  // Pull Requests state
  const [openPrs, setOpenPrs] = useState<any[]>([]);
  const [isLoadingPrs, setIsLoadingPrs] = useState(false);
  const [reviewingPrs, setReviewingPrs] = useState<Record<number, boolean>>({});

  // 1. Initial Load: Fetch User profile and Installations
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = api.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const meRes = await api.getMe();
      if (meRes.data?.user) {
        setUser(meRes.data.user);
        if (meRes.data.organization) {
          setOrgName(meRes.data.organization.name || '');
          setOrgSlug(meRes.data.organization.slug || '');
        } else {
          setOrgName('My Engineering Team');
          setOrgSlug('my-engineering-team');
        }
      }

      // Load app info and existing installations
      const [appRes, instRes] = await Promise.all([
        api.getAppInfo().catch(() => null),
        api.getInstallations().catch(() => null),
      ]);

      if (appRes?.data) setAppInfo(appRes.data);
      if (instRes?.data) {
        setInstallations(instRes.data);
        // If user already has an installation connected, move them to Step 2 or 3
        if (instRes.data.length > 0 && currentStep === 1) {
          // Keep at step 1 if they haven't reviewed org yet, but mark GitHub as connected
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load initial workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, [router, currentStep]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Handle GitHub Installation Callback (?installation_id=...&state=...)
  useEffect(() => {
    const installationIdStr = searchParams.get('installation_id');
    const stateStr = searchParams.get('state');

    if (installationIdStr) {
      const numericId = parseInt(installationIdStr, 10);
      if (!isNaN(numericId) && numericId > 0) {
        const claim = async () => {
          setActionLoading(true);
          setError(null);
          try {
            const res = await api.claimInstallation(numericId, stateStr || undefined);
            if (res.data?.installation) {
              setSuccessMessage(
                `Successfully connected GitHub account @${res.data.installation.accountLogin}!`
              );
              // Refresh installations and jump to Step 3 (Repository selection)
              const updatedInst = await api.getInstallations();
              setInstallations(updatedInst.data || []);
              setCurrentStep(3);
              loadRepositories();
              // Clean query params from URL
              router.replace('/onboarding');
            }
          } catch (err: any) {
            setError(err.message || 'Failed to claim GitHub installation callback.');
          } finally {
            setActionLoading(false);
          }
        };
        claim();
      }
    }
  }, [searchParams, router]);

  // 3. Initiate Secure GitHub Installation Flow
  const handleConnectGitHub = async () => {
    setIsInitiatingInstall(true);
    setError(null);
    try {
      const res = await api.initiateInstallation();
      if (res.data?.installUrl) {
        // Redirect to GitHub's official app installation screen
        window.location.href = res.data.installUrl;
      } else {
        // Fallback to static install URL if initiate returns nothing
        window.location.href = appInfo?.installUrl || 'https://github.com/apps';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate secure GitHub App installation.');
      setIsInitiatingInstall(false);
    }
  };

  // Manual fallback claim
  const handleManualClaim = async () => {
    const numId = parseInt(manualInstallId.trim(), 10);
    if (isNaN(numId) || numId <= 0) {
      setError('Please enter a valid numeric GitHub Installation ID.');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.claimInstallation(numId);
      if (res.data?.installation) {
        setSuccessMessage(`Connected GitHub account @${res.data.installation.accountLogin}!`);
        const updatedInst = await api.getInstallations();
        setInstallations(updatedInst.data || []);
        setCurrentStep(3);
        loadRepositories();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify installation ID.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Load Repositories from GitHub API
  const loadRepositories = async () => {
    setIsLoadingRepos(true);
    setError(null);
    try {
      const res = await api.getAvailableRepositories();
      const repos = res.data || [];
      setAvailableRepos(repos);
      const connected = repos.find((r: any) => r.isConnected);
      if (connected) {
        setSelectedRepoId(connected.existingRepositoryId || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load authorized GitHub repositories.');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Toggle repository monitoring
  const handleToggleRepo = async (repo: any, enable: boolean) => {
    setError(null);
    // Optimistic update
    setAvailableRepos((prev) =>
      prev.map((r) => (r.id === repo.id ? { ...r, isConnected: enable } : r))
    );

    try {
      const res = await api.toggleRepository({
        githubRepoId: repo.id,
        fullName: repo.fullName,
        name: repo.name,
        owner: repo.accountLogin || repo.fullName.split('/')[0],
        defaultBranch: repo.defaultBranch || 'main',
        isPrivate: repo.private,
        enabled: enable,
      });

      if (res.data?.repository) {
        setSelectedRepoId(res.data.repository.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle repository.');
      // Revert optimistic update
      setAvailableRepos((prev) =>
        prev.map((r) => (r.id === repo.id ? { ...r, isConnected: !enable } : r))
      );
    }
  };

  // 5. Load Real Open Pull Requests for Selected Repository
  const loadPullRequests = useCallback(async () => {
    if (!selectedRepoId) {
      // Find the first connected repository in DB
      try {
        const dbReposRes = await api.getRepositories();
        const firstDbRepo = (dbReposRes.data || [])[0];
        if (firstDbRepo) {
          setSelectedRepoId(firstDbRepo.id);
          fetchPrsForRepo(firstDbRepo.id);
        }
      } catch {
        // ignore
      }
      return;
    }
    fetchPrsForRepo(selectedRepoId);
  }, [selectedRepoId]);

  const fetchPrsForRepo = async (repoId: string) => {
    setIsLoadingPrs(true);
    setError(null);
    try {
      const res = await api.getRepositoryPullRequests(repoId, 'open', 1, 10);
      setOpenPrs(res.data?.pullRequests || (res as any).data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pull requests from GitHub.');
    } finally {
      setIsLoadingPrs(false);
    }
  };

  useEffect(() => {
    if (currentStep === 3 && availableRepos.length === 0) {
      loadRepositories();
    } else if (currentStep === 4) {
      loadPullRequests();
    }
  }, [currentStep, loadPullRequests]);

  // 6. Trigger Real On-Demand AI Review
  const handleReviewPr = async (prNumber: number) => {
    if (!selectedRepoId) return;
    setReviewingPrs((prev) => ({ ...prev, [prNumber]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.triggerPrReview(selectedRepoId, prNumber, true);
      if (res.data?.reviewJobId) {
        setSuccessMessage(`Review queued for PR #${prNumber}. Running real Gemini (${appInfo?.aiModel || 'gemini-3.8-flash'}) code analysis...`);
        // Poll for review completion
        setTimeout(() => {
          if (selectedRepoId) fetchPrsForRepo(selectedRepoId);
        }, 3000);
      } else if (res.data?.alreadyReviewed) {
        setSuccessMessage(`PR #${prNumber} already reviewed. Risk: ${res.data.overallRisk}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger AI review.');
    } finally {
      setReviewingPrs((prev) => ({ ...prev, [prNumber]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[#EDEDEF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading workspace onboarding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[#EDEDEF] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-[#090B0E]/80 backdrop-blur px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-semibold text-xs text-white">
            ReviewFlow AI <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.08] text-zinc-400 font-mono">Production Setup</span>
          </span>
        </Link>

        <div className="text-xs text-zinc-400 font-mono">
          Step {currentStep} of {STEPS.length}
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-2xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Progress Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col gap-1.5">
              <div
                className={`h-1 rounded-full transition-all ${
                  s.id < currentStep
                    ? 'bg-emerald-500'
                    : s.id === currentStep
                    ? 'bg-blue-500'
                    : 'bg-zinc-800'
                }`}
              />
              <span
                className={`text-[10px] font-mono hidden sm:block ${
                  s.id === currentStep ? 'text-blue-400 font-semibold' : 'text-zinc-500'
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Wizard Step Content */}
        <div className="bg-[#0B0D12] border border-white/[0.08] rounded-xl p-6 shadow-2xl">
          {/* STEP 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Step 1: Your Organization Space</h2>
                <p className="text-xs text-zinc-400">
                  Organizations isolate your connected repositories, pull request reviews, and policies securely.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 bg-[#08090C] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Tenant Workspace URL
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-zinc-900 text-zinc-500 text-xs rounded-l-md border border-r-0 border-white/[0.08] font-mono">
                      reviewflow.ai/
                    </span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-corp"
                      className="w-full px-3 py-2 bg-[#08090C] border border-white/[0.08] rounded-r-md text-xs text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {user && (
                  <div className="text-[11px] font-mono text-zinc-500 pt-1">
                    Logged in as: <span className="text-zinc-300">{user.email}</span> ({user.role})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Connect GitHub */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Step 2: Connect GitHub App</h2>
                <p className="text-xs text-zinc-400">
                  Install our single, shared GitHub App on your personal account or organization. No private keys, PATs, or API keys required.
                </p>
              </div>

              {installations.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {installations[0].avatarUrl ? (
                        <img
                          src={installations[0].avatarUrl}
                          alt={installations[0].accountLogin}
                          className="w-8 h-8 rounded-full border border-white/[0.1]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
                          <Github className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-white">
                          @{installations[0].accountLogin}
                        </h4>
                        <p className="text-[11px] text-emerald-400 font-mono">
                          Verified GitHub App Installation #{installations[0].installationId}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                      <Check className="w-3 h-3" />
                      <span>Connected</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-mono">
                    You can proceed to select repositories or click below to authorize additional GitHub organizations.
                  </p>

                  <button
                    onClick={handleConnectGitHub}
                    disabled={isInitiatingInstall}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Authorize Another Account / Org</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-[#0E1017] border border-white/[0.06] text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-300">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Official ReviewFlow AI GitHub App
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                      Click below to redirect to GitHub. Select your account or organization and grant access to the repositories you want monitored.
                    </p>
                  </div>

                  <button
                    onClick={handleConnectGitHub}
                    disabled={isInitiatingInstall || actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-xs font-medium shadow-lg hover:shadow-blue-500/20"
                  >
                    {isInitiatingInstall ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Github className="w-4 h-4" />
                    )}
                    <span>{isInitiatingInstall ? 'Generating Secure State...' : 'Connect GitHub App'}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <div className="pt-2 border-t border-white/[0.05] text-[11px] font-mono text-zinc-500">
                    <p>Permissions: Read code diffs & pull requests • Write check runs & comments</p>
                  </div>

                  {/* Manual Installation ID fallback */}
                  <details className="text-left pt-2 text-[11px] text-zinc-500">
                    <summary className="cursor-pointer hover:text-zinc-400 font-mono">
                      Already installed directly on GitHub? Enter Installation ID manually
                    </summary>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="e.g. 5282602"
                        value={manualInstallId}
                        onChange={(e) => setManualInstallId(e.target.value)}
                        className="px-2.5 py-1.5 bg-[#08090C] border border-white/[0.08] rounded text-xs text-white font-mono flex-1"
                      />
                      <button
                        onClick={handleManualClaim}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded btn-secondary text-xs font-mono"
                      >
                        Claim
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Repository Selection */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-0.5">Step 3: Select Repositories</h2>
                  <p className="text-xs text-zinc-400">
                    Enable automated AI code reviews for the repositories authorized in your GitHub App installation.
                  </p>
                </div>
                <button
                  onClick={loadRepositories}
                  disabled={isLoadingRepos}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-white/[0.08] text-[11px] font-mono text-zinc-400 hover:text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingRepos ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Fetching authorized repositories from GitHub API...</span>
                </div>
              ) : availableRepos.length === 0 ? (
                <div className="p-6 rounded-lg bg-[#0E1017] border border-white/[0.06] text-center space-y-3">
                  <GitBranch className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">No Repositories Found</h4>
                    <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-1 font-mono">
                      No repositories were granted during GitHub App installation, or permissions are pending.
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGitHub}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Configure Repositories in GitHub</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableRepos.map((repo) => {
                    const isConnected = repo.isConnected;
                    return (
                      <div
                        key={repo.id}
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                          isConnected
                            ? 'bg-[#121622] border-blue-500/50 text-white'
                            : 'bg-[#0E1017] border-white/[0.05] text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <GitBranch className={`w-3.5 h-3.5 ${isConnected ? 'text-blue-400' : 'text-zinc-600'}`} />
                          <div>
                            <div className="text-xs font-medium text-zinc-200">
                              {repo.fullName}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              Default: {repo.defaultBranch} • {repo.private ? 'Private' : 'Public'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleRepo(repo, !isConnected)}
                          className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                            isConnected
                              ? 'bg-blue-600 text-white hover:bg-blue-500'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {isConnected ? 'Monitored' : 'Enable'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Pull Requests & AI Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-0.5">Step 4: Real Open Pull Requests</h2>
                  <p className="text-xs text-zinc-400">
                    Fetched directly from GitHub. Trigger an on-demand AI review with Google Gemini ({appInfo?.aiModel || 'gemini-3.8-flash'}) to inspect live findings.
                  </p>
                </div>
                <button
                  onClick={() => selectedRepoId && fetchPrsForRepo(selectedRepoId)}
                  disabled={isLoadingPrs}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-white/[0.08] text-[11px] font-mono text-zinc-400 hover:text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingPrs ? 'animate-spin' : ''}`} />
                  <span>Refresh PRs</span>
                </button>
              </div>

              {isLoadingPrs ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Loading open pull requests from GitHub API...</span>
                </div>
              ) : openPrs.length === 0 ? (
                <div className="p-6 rounded-lg bg-[#0E1017] border border-white/[0.06] text-center space-y-3">
                  <GitPullRequest className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">No Open Pull Requests Found</h4>
                    <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-1 font-mono">
                      Your connected repository currently has no open pull requests. When you create or update a PR on GitHub, ReviewFlow will analyze it automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {openPrs.map((pr) => {
                    const isReviewing = reviewingPrs[pr.number];
                    const latestJob = pr.latestReview;

                    return (
                      <div
                        key={pr.number}
                        className="p-3.5 rounded-lg bg-[#0E1017] border border-white/[0.06] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-blue-400 font-semibold">
                              #{pr.number}
                            </span>
                            <h4 className="text-xs font-medium text-white truncate max-w-xs">
                              {pr.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mt-1">
                            <span>@{pr.author}</span>
                            <span>•</span>
                            <span>{pr.sourceBranch} → {pr.targetBranch}</span>
                            <span>•</span>
                            <span>SHA: {pr.headSha?.substring(0, 7)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {latestJob ? (
                            <span
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                latestJob.status === 'COMPLETED'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : latestJob.status === 'FAILED'
                                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                              }`}
                            >
                              {latestJob.status} ({latestJob.overallRisk || 'PENDING'})
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-500">
                              Not reviewed
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReviewPr(pr.number)}
                            disabled={isReviewing}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                          >
                            <Zap className={`w-3 h-3 ${isReviewing ? 'animate-spin' : ''}`} />
                            <span>{isReviewing ? 'Queuing...' : 'Review with AI'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-3 text-center text-[11px] text-zinc-500 font-mono">
        ReviewFlow AI • Enterprise GitHub App Connection • Zero untrusted execution guarantees
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090C] text-[#EDEDEF] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
