'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  CheckCircle2,
  Sliders,
  Plus,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function RepositoriesPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [policySaved, setPolicySaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Policy form state
  const [threshold, setThreshold] = useState('MEDIUM');
  const [blockOnCritical, setBlockOnCritical] = useState(true);
  const [autoInline, setAutoInline] = useState(true);
  const [requireTests, setRequireTests] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  const fetchRepositories = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
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
        setRepositories(json.data || []);
      }
    } catch {
      setError('Failed to reach API server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

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

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
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
        setPolicySaved(true);
        setTimeout(() => setPolicySaved(false), 3000);
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
          <button
            onClick={() => {
              alert('Install the ReviewFlow GitHub App to add or authorize additional repositories.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>
        }
      />

      <div className="px-6 pt-6 space-y-5 max-w-7xl">
        {policySaved && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Review policy successfully persisted to database and active for incoming pull requests.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {repositories.length === 0 ? (
          /* Honest Empty State */
          <div className="py-16 px-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-[#0B0D12]">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <FolderGit2 className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-white">No repositories connected</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-5 font-mono">
              Install the ReviewFlow GitHub App on your organization or personal account to authorize repositories for automated pull request reviews.
            </p>
            <a
              href="https://github.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Install GitHub App</span>
            </a>
          </div>
        ) : (
          /* Repositories Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {repositories.map((repo) => {
              const p = repo.policy || {};
              return (
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
                        {repo.autoReviewEnabled ? 'Auto-Review Active' : 'Paused'}
                      </span>
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
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {repo.pullRequestsCount || 0} PRs reviewed
                    </span>
                    <button
                      onClick={() => openPolicyModal(repo)}
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
