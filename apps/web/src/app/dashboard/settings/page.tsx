'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  CreditCard,
  Brain,
  Shield,
  CheckCircle2,
  Save,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'org' | 'ai' | 'billing' | 'security'>('org');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile & Org
  const [org, setOrg] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  // Billing
  const [billing, setBilling] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // AI Settings
  const [aiProvider, setAiProvider] = useState('gemini');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user and organization
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('reviewflow_token');
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json?.data?.activeOrganization) {
          const activeOrg = json.data.activeOrganization;
          setOrg(activeOrg);
          setOrgName(activeOrg.name);

          // Fetch members
          fetch(`${API_URL}/organizations/${activeOrg.id}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((mRes) => (mRes.ok ? mRes.json() : null))
            .then((mJson) => {
              if (mJson?.data) setMembers(mJson.data);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Fetch subscription details
    fetch(`${API_URL}/billing/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setBilling(json.data);
      })
      .catch(() => {});
  }, [router]);

  const handleUpgradePlan = async (planTier: 'PRO' | 'TEAM') => {
    setIsUpgrading(true);
    setError(null);
    setFeedback(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planTier }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message || 'Failed to initiate billing checkout.');
        setIsUpgrading(false);
        return;
      }

      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setFeedback(`Plan upgrade checkout session generated: ${json.data?.sessionId || 'Ready'}`);
        setIsUpgrading(false);
      }
    } catch (err: any) {
      setError(`Billing request failed: ${err.message}`);
      setIsUpgrading(false);
    }
  };

  const currentPlan = billing?.plan || org?.plan || 'FREE';

  return (
    <div className="flex-1 pb-16">
      <Header
        title="Settings & Policies"
        description="Manage organization preferences, AI review engine providers, team members, and billing quotas."
      />

      <div className="px-6 pt-6 space-y-5 max-w-5xl">
        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
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
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                Organization Profile
              </h3>
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
                    value={org?.slug || 'workspace'}
                    className="w-full bg-[#08090C] border border-white/[0.05] rounded-md p-2 text-zinc-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                    Team Members ({members.length})
                  </h3>
                  <p className="text-xs text-zinc-400">Authorized members with access to tenant repositories.</p>
                </div>
              </div>

              <div className="divide-y divide-white/[0.04] text-xs">
                {members.map((m) => {
                  const initial = (m.user?.name || m.user?.email || 'U').substring(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-bold text-zinc-300 font-mono text-[10px]">
                          {initial}
                        </div>
                        <div>
                          <span className="font-medium text-zinc-200 block text-xs">{m.user?.name}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">{m.user?.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-white/[0.06] text-zinc-400 font-mono">
                        {m.role}
                      </span>
                    </div>
                  );
                })}
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
                Worker executes reviews through Google Gemini or OpenAI with structured JSON schemas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-lg border bg-[#121622] border-blue-500/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-200">Google Gemini 1.5 Pro</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono">
                    2M Context
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Default production LLM engine. Uses structured output mode to analyze large repository pull request diffs.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-[#0E1017] border-white/[0.05]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-200">Deterministic Static Rules</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    Zero-latency
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pre-flight AST checks for cryptographic secret fallbacks, eval execution, and prompt injection defense.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#08090C] border border-white/[0.06] font-mono text-xs text-zinc-400 space-y-1">
              <div>Provider Status: Configured via environment variables</div>
              <div>Worker Execution Path: Durable BullMQ + Background Processor</div>
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
                Current active subscription plan for {org?.name || 'your workspace'}.
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

                  {currentPlan !== tier && tier !== 'FREE' ? (
                    <button
                      onClick={() => handleUpgradePlan(tier as any)}
                      disabled={isUpgrading}
                      className="mt-4 w-full py-1.5 rounded-md btn-secondary text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>{isUpgrading ? 'Redirecting...' : `Upgrade to ${tier}`}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : currentPlan === tier ? (
                    <div className="mt-4 text-[11px] text-blue-400 font-mono text-center">Active Plan</div>
                  ) : (
                    <div className="mt-4 text-[11px] text-zinc-500 font-mono text-center">Base Tier</div>
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
                GitHub App Cryptographic Verification & Multi-Tenancy
              </h3>
              <p className="text-xs text-zinc-400">
                Security baseline, webhook verification, and tenant quarantine guarantees.
              </p>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Webhook Signature Verification (HMAC-SHA256)</span>
                <span className="text-emerald-400 font-semibold">Active & Enforced</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Tenant Isolation on Webhook Ingestion</span>
                <span className="text-emerald-400 font-semibold">Enforced via InstallationId</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Server-Enforced Database Sessions</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1017] border border-white/[0.05] flex items-center justify-between">
                <span>Webhook Delivery Deduplication</span>
                <span className="text-emerald-400 font-semibold">Unique Constraint Enforced</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
