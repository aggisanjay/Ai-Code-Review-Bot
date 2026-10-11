'use client';

import React, { useState } from 'react';
import {
  FolderGit2,
  Settings,
  Shield,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Plus,
  Save,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

export default function RepositoriesPage() {
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [policySaved, setPolicySaved] = useState<boolean>(false);

  const [repositories, setRepositories] = useState([
    {
      id: 'repo-1',
      fullName: 'acme-cloud/auth-service',
      name: 'auth-service',
      owner: 'acme-cloud',
      defaultBranch: 'main',
      isPrivate: true,
      autoReviewEnabled: true,
      lastReviewAt: '20 minutes ago',
      pullRequestsCount: 8,
      policy: {
        severityThreshold: 'MEDIUM',
        blockPrOnCritical: true,
        autoPostInlineComments: true,
        requireTestsForNewCode: true,
        customInstructions:
          'Enforce strict input sanitization, check for SQL/NoSQL injection, flag any missing try/catch in async endpoints, and verify unit tests cover edge cases.',
      },
    },
    {
      id: 'repo-2',
      fullName: 'acme-cloud/api-gateway',
      name: 'api-gateway',
      owner: 'acme-cloud',
      defaultBranch: 'main',
      isPrivate: true,
      autoReviewEnabled: true,
      lastReviewAt: '2 hours ago',
      pullRequestsCount: 14,
      policy: {
        severityThreshold: 'HIGH',
        blockPrOnCritical: true,
        autoPostInlineComments: true,
        requireTestsForNewCode: true,
        customInstructions: 'Verify reverse-proxy headers and ensure CORS origin validation.',
      },
    },
    {
      id: 'repo-3',
      fullName: 'acme-cloud/checkout-frontend',
      name: 'checkout-frontend',
      owner: 'acme-cloud',
      defaultBranch: 'main',
      isPrivate: false,
      autoReviewEnabled: true,
      lastReviewAt: '5 hours ago',
      pullRequestsCount: 22,
      policy: {
        severityThreshold: 'MEDIUM',
        blockPrOnCritical: false,
        autoPostInlineComments: true,
        requireTestsForNewCode: false,
        customInstructions: 'Check for hydration mismatches and bundle size regressions.',
      },
    },
  ]);

  const handleSavePolicy = () => {
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2500);
    setSelectedRepo(null);
  };

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Connected Repositories"
        description="Configure automated review policies, severity thresholds, and custom guidelines per repository."
        action={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all shadow-glow">
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>
        }
      />

      <div className="px-8 pt-8 space-y-6 max-w-7xl">
        {policySaved && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Review policy successfully updated and active for incoming pull requests.</span>
          </div>
        )}

        {/* Repositories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono text-slate-400">
                      {repo.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Auto-Review Active
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-1">{repo.name}</h3>
                <span className="text-xs font-mono text-slate-400 block mb-4">{repo.fullName}</span>

                <div className="space-y-2 text-xs text-slate-300 font-mono bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Threshold:</span>
                    <span className="text-amber-400 font-bold">{repo.policy.severityThreshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Block on Critical:</span>
                    <span className="text-emerald-400">{repo.policy.blockPrOnCritical ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Review:</span>
                    <span className="text-slate-300">{repo.lastReviewAt}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {repo.pullRequestsCount} Reviews run
                </span>
                <button
                  onClick={() => setSelectedRepo(repo)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Policy</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Policy Configuration Modal/Drawer */}
        {selectedRepo && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Review Policy: {selectedRepo.name}
                  </h3>
                  <p className="text-xs text-slate-400">Custom rules for {selectedRepo.fullName}</p>
                </div>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Minimum Severity Threshold to Flag:
                  </label>
                  <select
                    defaultValue={selectedRepo.policy.severityThreshold}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">CRITICAL Only</option>
                    <option value="HIGH">HIGH and Above</option>
                    <option value="MEDIUM">MEDIUM and Above (Recommended)</option>
                    <option value="LOW">All Findings (Including Low & Info)</option>
                  </select>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRepo.policy.blockPrOnCritical}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-300">
                      Block Pull Request (set Check Run failure) when CRITICAL findings are identified
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRepo.policy.autoPostInlineComments}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-300">
                      Automatically post line-level review comments with suggested patches on GitHub
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRepo.policy.requireTestsForNewCode}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-300">
                      Flag missing unit or integration tests for new business logic
                    </span>
                  </label>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Custom Review Guidelines & Instructions (Untrusted Sandbox):
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={selectedRepo.policy.customInstructions}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    placeholder="e.g. Always check for unescaped user inputs, enforce strict TypeScript, check Redis TTLs..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Policy Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
