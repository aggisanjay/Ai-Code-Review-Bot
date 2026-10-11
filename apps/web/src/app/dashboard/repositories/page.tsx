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
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium">
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>
        }
      />

      <div className="px-6 pt-6 space-y-5 max-w-7xl">
        {policySaved && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Review policy successfully updated and active for incoming pull requests.</span>
          </div>
        )}

        {/* Repositories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] flex flex-col justify-between hover:border-white/[0.12] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] font-mono text-zinc-500">
                      {repo.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Auto-Review Active
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-0.5">{repo.name}</h3>
                <span className="text-xs font-mono text-zinc-500 block mb-3">{repo.fullName}</span>

                <div className="space-y-1.5 text-xs text-zinc-300 font-mono bg-[#0E1017] p-3 rounded-lg border border-white/[0.05] mb-4 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Threshold:</span>
                    <span className="text-amber-400 font-medium">{repo.policy.severityThreshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Block on Critical:</span>
                    <span className="text-emerald-400">{repo.policy.blockPrOnCritical ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Last Review:</span>
                    <span className="text-zinc-300">{repo.lastReviewAt}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  {repo.pullRequestsCount} Reviews run
                </span>
                <button
                  onClick={() => setSelectedRepo(repo)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:underline font-mono font-medium"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configure Policy</span>
                </button>
              </div>
            </div>
          ))}
        </div>

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
                    defaultValue={selectedRepo.policy.severityThreshold}
                    className="w-full bg-[#08090C] border border-white/[0.08] rounded-md px-3 py-2 text-zinc-200 text-xs focus:outline-none font-mono"
                  >
                    <option value="CRITICAL">CRITICAL only</option>
                    <option value="HIGH">HIGH and above</option>
                    <option value="MEDIUM">MEDIUM and above</option>
                    <option value="ALL">ALL findings</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRepo.policy.blockPrOnCritical}
                      className="rounded bg-zinc-900 border-white/[0.1] text-blue-500"
                    />
                    <span>Fail GitHub Check Run if Critical vulnerability is detected</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRepo.policy.autoPostInlineComments}
                      className="rounded bg-zinc-900 border-white/[0.1] text-blue-500"
                    />
                    <span>Post inline comments directly to GitHub conversation thread</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={selectedRepo.policy.requireTestsForNewCode}
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
                    defaultValue={selectedRepo.policy.customInstructions}
                    className="w-full bg-[#08090C] border border-white/[0.08] rounded-md p-3 text-zinc-200 text-xs focus:outline-none font-mono leading-relaxed"
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-primary text-xs font-medium"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Policy</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
