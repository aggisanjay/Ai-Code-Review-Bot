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

      <div className="px-8 pt-8 space-y-6 max-w-5xl">
        {saveFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Organization & Team */}
        {activeTab === 'org' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100">Organization Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    disabled
                    value="acme-cloud"
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSave('Organization')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Organization</span>
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Team Members ({members.length})</h3>
                  <p className="text-xs text-slate-400">Users who have access to pull request review findings.</p>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold border border-slate-700">
                  Invite Member
                </button>
              </div>

              <div className="divide-y divide-slate-800/80 text-xs">
                {members.map((m) => (
                  <div key={m.email} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {m.avatar}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 block">{m.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{m.email}</span>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Review Providers */}
        {activeTab === 'ai' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">AI Review Engine Configuration</h3>
              <p className="text-xs text-slate-400">
                Choose your LLM provider. ReviewFlow AI formats prompts with strict prompt-injection defenses and validates all outputs against schema contracts.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-2">Active LLM Provider:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'mock', name: 'Local Mock Adapter', badge: 'Recommended for Demo & Tests' },
                    { id: 'gemini', name: 'Google Gemini', badge: 'Gemini 1.5 Pro' },
                    { id: 'openai', name: 'OpenAI', badge: 'GPT-4o' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAiProvider(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        aiProvider === p.id
                          ? 'bg-slate-800 border-indigo-500 text-slate-100 shadow-glow'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <span className="font-bold text-slate-200 block mb-1">{p.name}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">{p.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {aiProvider === 'gemini' && (
                <div className="space-y-2 pt-2">
                  <label className="text-slate-300 font-semibold block">Gemini API Key:</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-xs"
                    placeholder="Enter GEMINI_API_KEY"
                  />
                  <p className="text-[11px] text-slate-500">
                    Keys are encrypted server-side and never exposed in client bundles.
                  </p>
                </div>
              )}

              {aiProvider === 'openai' && (
                <div className="space-y-2 pt-2">
                  <label className="text-slate-300 font-semibold block">OpenAI API Key:</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-xs"
                    placeholder="Enter OPENAI_API_KEY"
                  />
                  <p className="text-[11px] text-slate-500">
                    Encrypted with AES-256 before storage.
                  </p>
                </div>
              )}

              {aiProvider === 'mock' && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-xs">
                  <strong>Local Mock Mode Enabled:</strong> The review pipeline will run deterministic static checks and evaluate pull requests using local sample diff fixtures. No third-party LLM API keys are required.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => handleSave('AI Provider')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Provider Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Subscription & Quotas */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400">Current Subscription</span>
                  <h3 className="text-xl font-bold text-slate-100">{currentPlan} Plan</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Active (Stripe Test Mode)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6">
                <div>
                  <span className="text-slate-500 block">Monthly Reviews:</span>
                  <span className="text-slate-200 font-bold text-sm">38 / 500</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Connected Repos:</span>
                  <span className="text-slate-200 font-bold text-sm">3 / 15</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Team Members:</span>
                  <span className="text-slate-200 font-bold text-sm">3 / 10</span>
                </div>
              </div>

              {/* Upgrade/Change Plan Simulation */}
              <div className="space-y-3">
                <span className="text-xs text-slate-400 font-semibold block">Change Plan Tier:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['FREE', 'PRO', 'TEAM'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => handleUpgradePlan(tier)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        currentPlan === tier
                          ? 'bg-slate-800 border-indigo-500 text-slate-100 shadow-glow'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{tier}</span>
                        {currentPlan === tier && <span className="text-[10px] text-indigo-400 font-mono">Current</span>}
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">
                        {tier === 'FREE' ? '$0/mo' : tier === 'PRO' ? '$29/mo' : '$99/mo'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: GitHub App & Security */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">GitHub App Integration & Webhooks</h3>
              <p className="text-xs text-slate-400">
                Webhook delivery endpoint and cryptographic signature verification status.
              </p>
            </div>

            <div className="space-y-3 text-xs font-mono bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">GitHub Installation ID:</span>
                <span className="text-slate-300">4892019 (acme-cloud)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Webhook Receiver URL:</span>
                <span className="text-indigo-400">https://api.reviewflow.ai/api/v1/webhooks/github</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">HMAC-SHA256 Signature Verification:</span>
                <span className="text-emerald-400">Active (Constant-Time Verification)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Execution Sandbox:</span>
                <span className="text-emerald-400">Zero-Execution (AST & Token Static Only)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
