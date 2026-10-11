'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitPullRequest,
  CheckCircle2,
  Building,
  Github,
  GitBranch,
  Sliders,
  Play,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Zap,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Organization', desc: 'Define your team space' },
  { id: 2, title: 'GitHub App', desc: 'Connect permissions' },
  { id: 3, title: 'Repositories', desc: 'Select codebases' },
  { id: 4, title: 'Review Rules', desc: 'Configure policies' },
  { id: 5, title: 'Sample Review', desc: 'Verify AI engine' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [orgName, setOrgName] = useState('Acme Cloud Technologies');
  const [orgSlug, setOrgSlug] = useState('acme-cloud');
  const [isGitHubConnected, setIsGitHubConnected] = useState(true);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([
    'api-gateway',
    'auth-service',
  ]);
  const [severityThreshold, setSeverityThreshold] = useState('MEDIUM');
  const [blockPrOnCritical, setBlockPrOnCritical] = useState(true);
  const [autoPostInline, setAutoPostInline] = useState(true);
  const [isRunningSample, setIsRunningSample] = useState(false);
  const [sampleComplete, setSampleComplete] = useState(false);

  const toggleRepo = (repo: string) => {
    if (selectedRepos.includes(repo)) {
      setSelectedRepos(selectedRepos.filter((r) => r !== repo));
    } else {
      setSelectedRepos([...selectedRepos, repo]);
    }
  };

  const handleRunSample = () => {
    setIsRunningSample(true);
    setTimeout(() => {
      setIsRunningSample(false);
      setSampleComplete(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GitPullRequest className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-slate-100 text-sm">
            ReviewFlow <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">Setup</span>
          </span>
        </Link>

        <div className="text-xs text-slate-400 font-mono">
          Step {currentStep} of {STEPS.length}
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-3xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        {/* Progress Stepper */}
        <div className="grid grid-cols-5 gap-2 mb-10">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  s.id < currentStep
                    ? 'bg-emerald-500'
                    : s.id === currentStep
                    ? 'bg-indigo-500'
                    : 'bg-slate-800'
                }`}
              />
              <span
                className={`text-[11px] font-medium hidden sm:block ${
                  s.id === currentStep ? 'text-indigo-400 font-bold' : 'text-slate-500'
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Wizard Step Content */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Create or Join an Organization</h2>
                <p className="text-xs text-slate-400">
                  Organizations serve as your team security boundary. Repositories, audit logs, and billing are isolated to this tenant.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Organization Display Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tenant Slug Identifier
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-800 text-slate-500 text-xs rounded-l-xl border border-r-0 border-slate-800 font-mono">
                      reviewflow.ai/org/
                    </span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-r-xl text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GitHub App Installation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Install ReviewFlow GitHub App</h2>
                <p className="text-xs text-slate-400">
                  We request minimal repository read and check-run permissions. We never ask for personal access tokens or full write access.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Github className="w-5 h-5 text-slate-200" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">GitHub App: ReviewFlow AI</h4>
                    <p className="text-[11px] text-slate-400">Status: Installed & Verified for Acme Cloud</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-400 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-indigo-400">✔</span> Read access to pull requests & code diffs
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-indigo-400">✔</span> Write access to GitHub Check Runs & inline review comments
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-indigo-400">✔</span> Webhook notifications for PR opened, reopened & synchronize
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Repository Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Select Repositories to Monitor</h2>
                <p className="text-xs text-slate-400">
                  Choose which repositories should receive automated AI reviews upon pull request creation.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'api-gateway', desc: 'Core routing and authentication reverse proxy', lang: 'TypeScript' },
                  { name: 'auth-service', desc: 'OAuth2 and session token issuing service', lang: 'TypeScript' },
                  { name: 'checkout-frontend', desc: 'Customer billing and shopping cart application', lang: 'React' },
                  { name: 'infrastructure-terraform', desc: 'AWS ECS cluster and RDS configurations', lang: 'HCL' },
                ].map((repo) => {
                  const isSelected = selectedRepos.includes(repo.name);
                  return (
                    <div
                      key={repo.name}
                      onClick={() => toggleRepo(repo.name)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/20 border-indigo-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            acme-cloud/{repo.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{repo.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {repo.lang}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Configure Review Preferences */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Set Review Policies & Strictness</h2>
                <p className="text-xs text-slate-400">
                  Tune threshold sensitivities to prevent comment fatigue while blocking high-risk defects.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Minimum Severity Threshold for Pull Request Comments
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverityThreshold(lvl)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold border transition-all ${
                          severityThreshold === lvl
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-glow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Block Pull Request Merges on Critical Security Findings
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Marks the GitHub Check Run conclusion as Failure when vulnerabilities are detected.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={blockPrOnCritical}
                      onChange={(e) => setBlockPrOnCritical(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Automatically Post Line-Specific GitHub Comments
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Publishes inline review annotations directly on changed lines in the GitHub PR diff.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostInline}
                      onChange={(e) => setAutoPostInline(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Run Sample Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Verify ReviewFlow Engine</h2>
                <p className="text-xs text-slate-400">
                  Run a simulated end-to-end review on a sample pull request (JWT Token Rotation) to inspect inline findings.
                </p>
              </div>

              {!sampleComplete ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sample Pull Request #142 Ready</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                      Contains 3 modified authentication files with simulated vulnerabilities (cryptographic fallback and race conditions).
                    </p>
                  </div>
                  <button
                    onClick={handleRunSample}
                    disabled={isRunningSample}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold shadow-glow hover:from-indigo-500 hover:to-indigo-400 transition-all"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isRunningSample ? 'animate-spin' : ''}`} />
                    <span>{isRunningSample ? 'Running Pipeline...' : 'Run Verification Review'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Analysis Complete in 1.4s — 3 Findings Identified</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Detected 1 CRITICAL hardcoded JWT fallback secret in <code className="text-cyan-300">token.service.ts:42</code>, 1 HIGH severity race condition in session revocation, and verified test coverage deficits.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] text-emerald-400 font-mono">
                      ✔ GitHub Check Run & Inline Annotations Grounded Correctly
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold transition-colors"
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
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-glow"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all shadow-glow"
              >
                <span>Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-500">
        ReviewFlow AI • Enterprise Setup Wizard • Zero untrusted execution guarantees
      </footer>
    </div>
  );
}
