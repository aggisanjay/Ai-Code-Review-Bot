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
  ArrowRight,
  ArrowLeft,
  Zap,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Check,
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load initial workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
              const updatedInst = await api.getInstallations();
              setInstallations(updatedInst.data || []);
              setCurrentStep(3);
              loadRepositories();
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
        window.location.href = res.data.installUrl;
      } else {
        window.location.href = appInfo?.installUrl || 'https://github.com/apps';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate secure GitHub App installation.');
      setIsInitiatingInstall(false);
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
      setAvailableRepos((prev) =>
        prev.map((r) => (r.id === repo.id ? { ...r, isConnected: !enable } : r))
      );
    }
  };

  // 5. Load Real Open Pull Requests for Selected Repository
  const loadPullRequests = useCallback(async () => {
    if (!selectedRepoId) {
      try {
        const dbReposRes = await api.getRepositories();
        const firstDbRepo = (dbReposRes.data || [])[0];
        if (firstDbRepo) {
          setSelectedRepoId(firstDbRepo.id);
          fetchPrsForRepo(firstDbRepo.id);
        }
      } catch {}
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
        setSuccessMessage(`Review queued for PR #${prNumber}. Running real Gemini (${appInfo?.aiModel || 'gemini-3.5-flash'}) code analysis...`);
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
      <div className="min-h-screen bg-[#04070A] text-[#F3F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#34E5A5] animate-spin" />
          <span className="text-xs font-mono text-[#9AA7A1]">Loading workspace onboarding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04070A] text-[#F3F7F5] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-[rgba(255,255,255,0.09)] bg-[#04070A]/90 backdrop-blur px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] flex items-center justify-center shadow-sm">
            <GitPullRequest className="w-4 h-4 text-[#34E5A5]" />
          </div>
          <span className="font-bold text-sm text-[#F3F7F5] font-display">
            ReviewFlow AI <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-bold border border-[rgba(52,229,165,0.28)]">Production Setup</span>
          </span>
        </Link>

        <div className="text-xs text-[#9AA7A1] font-mono font-semibold">
          Step {currentStep} of {STEPS.length}
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-2xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Progress Stepper */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col gap-2">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  s.id < currentStep
                    ? 'bg-[#16835B]'
                    : s.id === currentStep
                    ? 'bg-[#126B50]'
                    : 'bg-[#E4EAE6]'
                }`}
              />
              <span
                className={`text-[11px] font-mono hidden sm:block ${
                  s.id === currentStep ? 'text-[#34E5A5] font-bold' : 'text-[#9AA7A1]'
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-[rgba(255,93,108,0.10)] border border-[rgba(255,93,108,0.32)] text-[#FF6B7A] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#FF6B7A] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#34E5A5] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Wizard Step Content */}
        <div className="bg-[#0A1115] border border-[rgba(255,255,255,0.09)] rounded-2xl p-7 sm:p-8 shadow-sleek-md">
          {/* STEP 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#F3F7F5] mb-1 font-display">Step 1: Your Organization Space</h2>
                <p className="text-xs sm:text-sm text-[#9AA7A1]">
                  Organizations isolate your connected repositories, pull request reviews, and policies securely.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#F3F7F5] mb-1.5">
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
                    className="w-full px-3.5 py-2.5 bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl text-xs sm:text-sm text-[#F3F7F5] focus:outline-none focus:border-[rgba(52,229,165,0.45)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F3F7F5] mb-1.5">
                    Tenant Workspace URL
                  </label>
                  <div className="flex items-center">
                    <span className="px-3.5 py-2.5 bg-[#04070A] text-[#9AA7A1] text-xs rounded-l-xl border border-r-0 border-[rgba(255,255,255,0.09)] font-mono">
                      reviewflow.ai/
                    </span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-corp"
                      className="w-full px-3.5 py-2.5 bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-r-xl text-xs sm:text-sm text-[#34E5A5] font-mono font-medium focus:outline-none focus:border-[rgba(52,229,165,0.45)]"
                    />
                  </div>
                </div>

                {user && (
                  <div className="text-[11px] font-mono text-[#9AA7A1] pt-1">
                    Logged in as: <strong className="text-[#F3F7F5]">{user.email}</strong> ({user.role})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Connect GitHub */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#F3F7F5] mb-1 font-display">Step 2: Connect GitHub App</h2>
                <p className="text-xs sm:text-sm text-[#9AA7A1]">
                  Install our single, shared GitHub App on your personal account or organization. No private keys, PATs, or API keys required.
                </p>
              </div>

              {installations.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {installations[0].avatarUrl ? (
                        <img
                          src={installations[0].avatarUrl}
                          alt={installations[0].accountLogin}
                          className="w-9 h-9 rounded-full border border-[rgba(255,255,255,0.09)]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] flex items-center justify-center">
                          <Github className="w-5 h-5 text-[#34E5A5]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#F3F7F5] font-display">
                          @{installations[0].accountLogin}
                        </h4>
                        <p className="text-[11px] text-[#34E5A5] font-mono font-medium">
                          Verified GitHub App Installation #{installations[0].installationId}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0A1115] text-[#34E5A5] text-[11px] font-mono font-bold border border-[rgba(52,229,165,0.28)] shadow-sm">
                      <Check className="w-3.5 h-3.5 text-[#34E5A5]" />
                      <span>Connected</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#9AA7A1] font-mono">
                    You can proceed to select repositories or click below to authorize additional GitHub organizations.
                  </p>

                  <button
                    onClick={handleConnectGitHub}
                    disabled={isInitiatingInstall}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
                  >
                    <Github className="w-4 h-4" />
                    <span>Authorize Another Account / Org</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] flex items-center justify-center mx-auto text-[#F3F7F5] shadow-sm">
                    <Github className="w-7 h-7 text-[#34E5A5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F3F7F5] font-display">
                      Official ReviewFlow AI GitHub App
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9AA7A1] max-w-md mx-auto mt-1 leading-relaxed">
                      Click below to redirect to GitHub. Select your account or organization and grant access to the repositories you want monitored.
                    </p>
                  </div>

                  <button
                    onClick={handleConnectGitHub}
                    disabled={isInitiatingInstall || actionLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-primary text-xs sm:text-sm font-semibold shadow-sleek-sm"
                  >
                    {isInitiatingInstall ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Github className="w-4 h-4" />
                    )}
                    <span>{isInitiatingInstall ? 'Generating Secure State...' : 'Connect GitHub App'}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <div className="pt-3 border-t border-[rgba(255,255,255,0.09)] text-[11px] font-mono text-[#9AA7A1]">
                    <p>Permissions: Read code diffs & pull requests • Write check runs & comments</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Repository Selection */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#F3F7F5] mb-1 font-display">Step 3: Select Repositories</h2>
                  <p className="text-xs sm:text-sm text-[#9AA7A1]">
                    Enable automated AI code reviews for the repositories authorized in your GitHub App installation.
                  </p>
                </div>
                <button
                  onClick={loadRepositories}
                  disabled={isLoadingRepos}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-[11px] font-mono"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-[#34E5A5]' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingRepos ? (
                <div className="py-10 text-center text-xs font-mono text-[#9AA7A1] flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#34E5A5]" />
                  <span>Fetching authorized repositories from GitHub API...</span>
                </div>
              ) : availableRepos.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-center space-y-3.5">
                  <GitBranch className="w-8 h-8 text-[#9AA7A1] mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F7F5]">No Repositories Found</h4>
                    <p className="text-xs text-[#9AA7A1] max-w-sm mx-auto mt-1 font-mono">
                      No repositories were granted during GitHub App installation, or permissions are pending.
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGitHub}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-xs font-semibold"
                  >
                    <Github className="w-4 h-4" />
                    <span>Configure Repositories in GitHub</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {availableRepos.map((repo) => {
                    const isConnected = repo.isConnected;
                    return (
                      <div
                        key={repo.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                          isConnected
                            ? 'bg-[rgba(52,229,165,0.10)] border-[rgba(52,229,165,0.28)] text-[#F3F7F5]'
                            : 'bg-[#04070A] border-[rgba(255,255,255,0.09)] text-[#9AA7A1]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GitBranch className={`w-4 h-4 ${isConnected ? 'text-[#34E5A5]' : 'text-[#9AA7A1]'}`} />
                          <div>
                            <div className="text-xs font-bold text-[#F3F7F5] font-mono">
                              {repo.fullName}
                            </div>
                            <div className="text-[11px] text-[#9AA7A1] font-mono">
                              Default: {repo.defaultBranch} • {repo.private ? 'Private' : 'Public'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleRepo(repo, !isConnected)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                            isConnected
                              ? 'bg-[#126B50] text-white hover:bg-[#0B523D]'
                              : 'bg-[#0A1115] border border-[rgba(255,255,255,0.09)] text-[#F3F7F5] hover:bg-[#04070A]'
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
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#F3F7F5] mb-1 font-display">Step 4: Real Open Pull Requests</h2>
                  <p className="text-xs sm:text-sm text-[#9AA7A1]">
                    Fetched directly from GitHub. Trigger an on-demand AI review with Google Gemini ({appInfo?.aiModel || 'gemini-3.5-flash'}) to inspect live findings.
                  </p>
                </div>
                <button
                  onClick={() => selectedRepoId && fetchPrsForRepo(selectedRepoId)}
                  disabled={isLoadingPrs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-secondary text-[11px] font-mono"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrs ? 'animate-spin text-[#34E5A5]' : ''}`} />
                  <span>Refresh PRs</span>
                </button>
              </div>

              {isLoadingPrs ? (
                <div className="py-10 text-center text-xs font-mono text-[#9AA7A1] flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#34E5A5]" />
                  <span>Loading open pull requests from GitHub API...</span>
                </div>
              ) : openPrs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-center space-y-3.5">
                  <GitPullRequest className="w-8 h-8 text-[#9AA7A1] mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F7F5]">No Open Pull Requests Found</h4>
                    <p className="text-xs text-[#9AA7A1] max-w-sm mx-auto mt-1 font-mono">
                      Your connected repository currently has no open pull requests. When you create or update a PR on GitHub, ReviewFlow will analyze it automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {openPrs.map((pr) => {
                    const isReviewing = reviewingPrs[pr.number];
                    const latestJob = pr.latestReview;

                    return (
                      <div
                        key={pr.number}
                        className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[#34E5A5] font-bold">
                              #{pr.number}
                            </span>
                            <h4 className="text-xs font-bold text-[#F3F7F5] truncate max-w-xs font-display">
                              {pr.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#9AA7A1] mt-1">
                            <span>@{pr.author}</span>
                            <span>•</span>
                            <span>{pr.sourceBranch} → {pr.targetBranch}</span>
                            <span>•</span>
                            <span>SHA: {pr.headSha?.substring(0, 7)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {latestJob ? (
                            <span
                              className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                                latestJob.status === 'COMPLETED'
                                  ? 'bg-[rgba(52,229,165,0.10)] border-[rgba(52,229,165,0.28)] text-[#34E5A5]'
                                  : latestJob.status === 'FAILED'
                                  ? 'bg-[rgba(255,93,108,0.10)] border-[rgba(255,93,108,0.32)] text-[#FF6B7A]'
                                  : 'bg-[rgba(255,180,84,0.10)] border-[rgba(255,180,84,0.32)] text-[#FFB454]'
                              }`}
                            >
                              {latestJob.status} ({latestJob.overallRisk || 'PENDING'})
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-[#9AA7A1]">
                              Not reviewed
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReviewPr(pr.number)}
                            disabled={isReviewing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-primary text-xs font-semibold"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isReviewing ? 'animate-spin' : ''}`} />
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
          <div className="mt-8 pt-5 border-t border-[rgba(255,255,255,0.09)] flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-secondary text-xs font-semibold"
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shadow-sleek-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shadow-sleek-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#9AA7A1] font-mono">
        ReviewFlow AI • Enterprise GitHub App Connection • Zero untrusted execution guarantees
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#04070A] text-[#F3F7F5] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#34E5A5] animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
