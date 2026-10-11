'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Brain,
  Key,
  Shield,
  CheckCircle2,
  Save,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'org' | 'ai' | 'billing' | 'security'>('org');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Form states
  const [orgName, setOrgName] = useState('Acme Cloud Technologies');
  const [aiProvider, setAiProvider] = useState('mock'); // 'gemini' | 'openai' | 'mock'
  const [geminiKey, setGeminiKey] = useState('AIzaSyD-••••••••••••••••••••••••');
  const [openaiKey, setOpenaiKey] = useState('sk-proj-••••••••••••••••••••••••');
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'PRO' | 'TEAM'>('PRO');

  const members = [
    { name: 'Alex Chen', email: 'alex@reviewflow.ai', role: 'OWNER', avatar: 'AC' },
    { name: 'Sarah Lin', email: 'sarah@acmecloud.io', role: 'ADMIN', avatar: 'SL' },
    { name: 'David Kim', email: 'david@acmecloud.io', role: 'MEMBER', avatar: 'DK' },
  ];

  const handleSave = (section: string) => {
    setSaveFeedback(`${section} settings saved successfully.`);
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleUpgradePlan = (newPlan: 'FREE' | 'PRO' | 'TEAM') => {
    setCurrentPlan(newPlan);
    setSaveFeedback(`Organization plan successfully updated to ${newPlan}.`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Settings & Policies"
        description="Manage organization preferences, AI review engine providers, team members, and billing quotas."
      />

      <div className="px-6 pt-6 space-y-5 max-w-5xl">
        {saveFeedback && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2">
          {[
            { id: 'org', label: 'Organization & Team', icon: Building2 },
            { id: 'ai', label: 'AI Review Providers', icon: Brain },
            { id: 'billing', label: 'Subscription & Quotas', icon: CreditCard },
            { id: 'security', label: 'GitHub App & Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-800 text-white border border-white/[0.12] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Organization & Team */}
        {activeTab === 'org' && (
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-3.5">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">Organization Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-[#08090C] border border-white/[0.08] rounded-md p-2 text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    disabled
                    value="acme-cloud"
                    className="w-full bg-[#08090C] border border-white/[0.05] rounded-md p-2 text-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleSave('Organization')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Organization</span>
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">Team Members ({members.length})</h3>
                  <p className="text-xs text-zinc-400">Users who have access to pull request review findings.</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg btn-secondary text-xs font-medium">
                  Invite Member
                </button>
              </div>

              <div className="divide-y divide-white/[0.04] text-xs">
                {members.map((m) => (
                  <div key={m.email} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-bold text-zinc-300 font-mono text-[10px]">
                        {m.avatar}
                      </div>
                      <div>
                        <span className="font-medium text-zinc-200 block text-xs">{m.name}</span>
                        <span className="text-[11px] text-zinc-500 font-mono">{m.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-white/[0.06] text-zinc-400 font-mono">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Review Engine */}
        {activeTab === 'ai' && (
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                AI Provider Architecture & Model Selection
              </h3>
              <p className="text-xs text-zinc-400">
                Configure which language model provider powers deep cross-file review analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label
                onClick={() => setAiProvider('mock')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  aiProvider === 'mock'
                    ? 'bg-[#121622] border-blue-500/50'
                    : 'bg-[#0E1017] border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-200">Mock Fixture Mode</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">Zero Keys</span>
                </div>
                <p className="text-[11px] text-zinc-400">Fast, local mock reviews without API key quota requirements.</p>
              </label>

              <label
                onClick={() => setAiProvider('gemini')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  aiProvider === 'gemini'
                    ? 'bg-[#121622] border-blue-500/50'
                    : 'bg-[#0E1017] border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-200">Google Gemini 1.5</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono">2M Context</span>
                </div>
                <p className="text-[11px] text-zinc-400">Gemini 1.5 Pro with large context window for massive monorepo diffs.</p>
              </label>

              <label
                onClick={() => setAiProvider('openai')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  aiProvider === 'openai'
                    ? 'bg-[#121622] border-blue-500/50'
                    : 'bg-[#0E1017] border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-200">OpenAI GPT-4o</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-mono">Structured</span>
                </div>
                <p className="text-[11px] text-zinc-400">Native JSON schema validation with high reasoning benchmark accuracy.</p>
              </label>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Gemini API Key (Optional Override)</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-[#08090C] border border-white/[0.08] rounded-md p-2 text-zinc-200 font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">OpenAI API Key (Optional Override)</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-[#08090C] border border-white/[0.08] rounded-md p-2 text-zinc-200 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave('AI Provider')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Provider Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Billing & Subscription */}
        {activeTab === 'billing' && (
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                Subscription Tier & Review Quotas
              </h3>
              <p className="text-xs text-zinc-400">
                Current active subscription plan for Acme Cloud Technologies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {(['FREE', 'PRO', 'TEAM'] as const).map((tier) => (
                <div
                  key={tier}
                  className={`p-4 rounded-lg border flex flex-col justify-between ${
                    currentPlan === tier
                      ? 'bg-[#121622] border-blue-500/50 shadow-sm'
                      : 'bg-[#0E1017] border-white/[0.05]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-zinc-200 font-mono">{tier} TIER</span>
                      {currentPlan === tier && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-white font-mono my-2">
                      {tier === 'FREE' ? '$0' : tier === 'PRO' ? '$29/mo' : '$99/mo'}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {tier === 'FREE'
                        ? '50 reviews / month • 3 repos'
                        : tier === 'PRO'
                        ? '500 reviews / month • 15 repos'
                        : '2,500 reviews / month • 50 repos'}
                    </p>
                  </div>

                  {currentPlan !== tier ? (
                    <button
                      onClick={() => handleUpgradePlan(tier)}
                      className="mt-4 w-full py-1.5 rounded-md btn-secondary text-xs"
                    >
                      Switch to {tier}
                    </button>
                  ) : (
                    <div className="mt-4 text-[11px] text-blue-400 font-mono text-center">Active Plan</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Security & Webhooks */}
        {activeTab === 'security' && (
          <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] space-y-4 text-xs">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                GitHub App Cryptographic Verification
              </h3>
              <p className="text-xs text-zinc-400">
                Security baseline and webhook signature verification status.
              </p>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Webhook Signature Verification (HMAC-SHA256)</span>
                <span className="text-emerald-400 font-semibold">Active & Enforced</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Untrusted Diff Boundary Quarantining</span>
                <span className="text-emerald-400 font-semibold">Enforced</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Code Execution Sandbox Isolation</span>
                <span className="text-emerald-400 font-semibold">Read-Only Static</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
