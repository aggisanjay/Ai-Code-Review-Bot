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
  Play,
  ArrowRight,
  ArrowLeft,
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
    <div className="min-h-screen bg-[#08090C] text-[#EDEDEF] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-[#090B0E]/80 backdrop-blur px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-semibold text-xs text-white">
            ReviewFlow <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.08] text-zinc-400 font-mono">Setup</span>
          </span>
        </Link>

        <div className="text-xs text-zinc-400 font-mono">
          Step {currentStep} of {STEPS.length}
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-2xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Progress Stepper */}
        <div className="grid grid-cols-5 gap-2 mb-8">
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

        {/* Wizard Step Content */}
        <div className="bg-[#0B0D12] border border-white/[0.08] rounded-xl p-6 shadow-2xl">
          {/* STEP 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Create or Join an Organization</h2>
                <p className="text-xs text-zinc-400">
                  Organizations serve as your tenant boundary. Repositories, audit logs, and billing are isolated to this tenant.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Organization Display Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    className="w-full px-3 py-2 bg-[#08090C] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Tenant Slug Identifier
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-zinc-900 text-zinc-500 text-xs rounded-l-md border border-r-0 border-white/[0.08] font-mono">
                      reviewflow.ai/org/
                    </span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-[#08090C] border border-white/[0.08] rounded-r-md text-xs text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GitHub App Installation */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Install ReviewFlow GitHub App</h2>
                <p className="text-xs text-zinc-400">
                  We request minimal repository read and check-run permissions. We never ask for personal access tokens.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0E1017] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
                    <Github className="w-4 h-4 text-zinc-200" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white">GitHub App: ReviewFlow AI</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">Status: Installed & Verified for Acme Cloud</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Connected</span>
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400 bg-[#08090C] p-3.5 rounded-lg border border-white/[0.05] font-mono text-[11px]">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-blue-400">✔</span> Read access to pull requests & code diffs
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-blue-400">✔</span> Write access to GitHub Check Runs & inline review comments
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-blue-400">✔</span> Webhook notifications for PR opened, reopened & synchronize
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Repository Selection */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Select Repositories to Monitor</h2>
                <p className="text-xs text-zinc-400">
                  Choose which repositories should receive automated AI reviews upon pull request creation.
                </p>
              </div>

              <div className="space-y-2">
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
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#121622] border-blue-500/50 text-white'
                          : 'bg-[#0E1017] border-white/[0.05] hover:border-white/[0.1] text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GitBranch className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-zinc-600'}`} />
                        <div>
                          <div className="text-xs font-medium text-zinc-200">
                            acme-cloud/{repo.name}
                          </div>
                          <div className="text-[11px] text-zinc-500">{repo.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {repo.lang}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded bg-zinc-900 border-white/[0.1] text-blue-600"
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
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Set Review Policies & Strictness</h2>
                <p className="text-xs text-zinc-400">
                  Tune threshold sensitivities to prevent comment fatigue while blocking high-risk defects.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Minimum Severity Threshold for Pull Request Comments
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverityThreshold(lvl)}
                        className={`py-1.5 px-2.5 rounded-md text-xs font-mono font-medium border transition-all ${
                          severityThreshold === lvl
                            ? 'bg-zinc-800 text-white border-white/[0.15]'
                            : 'bg-[#08090C] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center justify-between p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-zinc-200 block">
                        Block Pull Request Merges on Critical Security Findings
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Marks GitHub Check Run as Failure when vulnerabilities are detected.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={blockPrOnCritical}
                      onChange={(e) => setBlockPrOnCritical(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-zinc-900 border-white/[0.1] text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-zinc-200 block">
                        Automatically Post Line-Specific GitHub Comments
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Publishes inline review annotations directly on changed lines in the diff.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostInline}
                      onChange={(e) => setAutoPostInline(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-zinc-900 border-white/[0.1] text-blue-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Run Sample Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5">Verify ReviewFlow Engine</h2>
                <p className="text-xs text-zinc-400">
                  Run a simulated end-to-end review on a sample pull request (JWT Token Rotation) to inspect inline findings.
                </p>
              </div>

              {!sampleComplete ? (
                <div className="p-5 rounded-lg bg-[#0E1017] border border-white/[0.05] text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/[0.08] text-blue-400 flex items-center justify-center mx-auto">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white">Sample Pull Request #142 Ready</h4>
                    <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-0.5 font-mono">
                      Contains 3 modified authentication files with simulated vulnerabilities.
                    </p>
                  </div>
                  <button
                    onClick={handleRunSample}
                    disabled={isRunningSample}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isRunningSample ? 'animate-spin' : ''}`} />
                    <span>{isRunningSample ? 'Running Pipeline...' : 'Run Verification Review'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Analysis Complete in 1.4s — 3 Findings Identified</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Detected 1 CRITICAL hardcoded JWT fallback secret in <code className="text-emerald-300 font-mono text-[11px]">token.service.ts:42</code>, 1 HIGH severity race condition in session revocation, and verified test coverage deficits.
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] text-emerald-400 font-mono">
                      ✔ GitHub Check Run & Inline Annotations Grounded Correctly
                    </span>
                  </div>
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
                <span>Enter Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-3 text-center text-[11px] text-zinc-500 font-mono">
        ReviewFlow AI • Enterprise Setup Wizard • Zero untrusted execution guarantees
      </footer>
    </div>
  );
}
