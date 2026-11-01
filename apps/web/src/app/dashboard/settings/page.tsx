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
  const [upgradingTier, setUpgradingTier] = useState<'PRO' | 'TEAM' | null>(null);

  // AI Settings
  const [appInfo, setAppInfo] = useState<any>(null);

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

    // Fetch system app & AI model info
    fetch(`${API_URL}/repositories/app-info`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setAppInfo(json.data);
      })
      .catch(() => {});
  }, [router]);

  const handleUpgradePlan = async (planTier: 'PRO' | 'TEAM') => {
    setUpgradingTier(planTier);
    setError(null);
    setFeedback(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) {
      setUpgradingTier(null);
      return;
    }

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
        setUpgradingTier(null);
        return;
      }

      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setFeedback(`Plan upgrade checkout session generated: ${json.data?.sessionId || 'Ready'}`);
        setUpgradingTier(null);
      }
    } catch (err: any) {
      setError(`Billing request failed: ${err.message}`);
      setUpgradingTier(null);
    }
  };

  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleOpenCustomerPortal = async () => {
    setIsOpeningPortal(true);
    setError(null);
    setFeedback(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || 'Failed to open Stripe Customer Portal.');
        setIsOpeningPortal(false);
        return;
      }

      if (json.data?.portalUrl) {
        window.location.href = json.data.portalUrl;
      } else {
        setError('No customer portal URL returned by billing server.');
        setIsOpeningPortal(false);
      }
    } catch (err: any) {
      setError(`Customer portal request failed: ${err.message}`);
      setIsOpeningPortal(false);
    }
  };

  const currentPlan = billing?.plan || org?.plan || 'FREE';

  return (
    <div className="flex-1 pb-16 bg-[#04070A]">
      <Header
        title="Settings & Policies"
        description="Manage organization preferences, AI review engine providers, team members, and billing quotas."
      />

      <div className="px-6 sm:px-8 pt-8 space-y-6 max-w-5xl mx-auto">
        {feedback && (
          <div className="p-3.5 rounded-xl bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] text-[#34E5A5] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#34E5A5] shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[rgba(255,93,108,0.10)] border border-[rgba(255,93,108,0.32)] text-[#FF6B7A] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#FF6B7A] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.09)] pb-3 overflow-x-auto">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] border border-[rgba(52,229,165,0.28)] shadow-sm'
                    : 'text-[#9AA7A1] hover:text-[#F3F7F5] hover:bg-[#0A1115]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#34E5A5]' : 'text-[#9AA7A1]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Organization & Team */}
        {activeTab === 'org' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] shadow-sleek-sm space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#F3F7F5]">
                Organization Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#9AA7A1] font-semibold block mb-1.5">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl p-3 text-[#F3F7F5] font-medium focus:outline-none focus:border-[rgba(52,229,165,0.45)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#9AA7A1] font-semibold block mb-1.5">Slug Identifier</label>
                  <input
                    type="text"
                    disabled
                    value={org?.slug || 'workspace'}
                    className="w-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] rounded-xl p-3 text-[#9AA7A1] font-mono opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="p-6 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] shadow-sleek-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#F3F7F5]">
                    Team Members ({members.length})
                  </h3>
                  <p className="text-xs text-[#9AA7A1] mt-0.5">Authorized members with access to tenant repositories.</p>
                </div>
              </div>

              <div className="divide-y divide-[rgba(255,255,255,0.09)] text-xs">
                {members.map((m) => {
                  const initial = (m.user?.name || m.user?.email || 'U').substring(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] flex items-center justify-center font-bold text-[#34E5A5] font-mono text-[11px] shadow-sm">
                          {initial}
                        </div>
                        <div>
                          <span className="font-semibold text-[#F3F7F5] block text-xs sm:text-sm font-display">{m.user?.name}</span>
                          <span className="text-[11px] text-[#9AA7A1] font-mono">{m.user?.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#04070A] border border-[rgba(255,255,255,0.09)] text-[#F3F7F5] font-mono font-bold">
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
          <div className="p-6 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] shadow-sleek-sm space-y-5">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#F3F7F5]">
                AI Provider Architecture & Model Selection
              </h3>
              <p className="text-xs text-[#9AA7A1] mt-0.5">
                Worker executes reviews through Google Gemini or OpenAI with structured JSON schemas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl border-2 border-[rgba(52,229,165,0.45)] bg-[rgba(52,229,165,0.10)]/20 shadow-sleek-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#F3F7F5] text-sm font-display">
                    {appInfo?.aiModel ? `Google Gemini (${appInfo.aiModel})` : 'Google Gemini 3.5 Flash (gemini-3.5-flash)'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-bold border border-[rgba(52,229,165,0.28)]">
                    Active Model
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A1] leading-relaxed">
                  Active production LLM model. Uses Google Gemini 3.5 Flash with structured JSON schemas to evaluate repository pull request diffs with high-speed senior engineering precision.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[rgba(255,255,255,0.09)] bg-[#04070A]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#F3F7F5] text-sm font-display">Deterministic AST Scanner</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A1115] text-[#34E5A5] font-mono font-bold border border-[rgba(255,255,255,0.09)]">
                    Zero-latency
                  </span>
                </div>
                <p className="text-xs text-[#9AA7A1] leading-relaxed">
                  Pre-flight Abstract Syntax Tree checks for hardcoded cryptographic secrets, unsafe code execution, and prompt-injection defense.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] font-mono text-xs text-[#9AA7A1] space-y-1.5">
              <div>Active Model: <strong className="text-[#F3F7F5]">{appInfo?.aiModel || 'gemini-3.5-flash'}</strong></div>
              <div>AI Provider: <strong className="text-[#F3F7F5]">{appInfo?.aiProvider ? appInfo.aiProvider.toUpperCase() : 'GEMINI'}</strong></div>
              <div>Worker Execution Path: Durable BullMQ + Background Processor</div>
            </div>
          </div>
        )}

        {/* Tab 3: Billing & Subscription */}
        {activeTab === 'billing' && (() => {
          const reviewsUsed = billing?.usage?.reviewsUsed ?? billing?.reviewsUsed ?? 0;
          const reviewsLimit = billing?.usage?.reviewsLimit ?? billing?.reviewsLimit ?? (currentPlan === 'PRO' ? 500 : currentPlan === 'TEAM' ? 2500 : 25);
          const reviewsRemaining = billing?.usage?.reviewsRemaining ?? billing?.reviewsRemaining ?? Math.max(0, reviewsLimit - reviewsUsed);
          const qnaUsed = billing?.usage?.qnaUsed ?? billing?.qnaUsed ?? 0;
          const qnaLimit = billing?.usage?.qnaLimit ?? billing?.qnaLimit ?? (currentPlan === 'PRO' ? 2500 : currentPlan === 'TEAM' ? 10000 : 100);
          const qnaRemaining = billing?.usage?.qnaRemaining ?? billing?.qnaRemaining ?? Math.max(0, qnaLimit - qnaUsed);
          const reposUsed = billing?.usage?.repositoriesUsed ?? billing?.reposUsed ?? (billing ? 1 : 0);
          const reposLimit = billing?.usage?.repositoriesLimit ?? billing?.reposLimit ?? (currentPlan === 'PRO' ? 15 : currentPlan === 'TEAM' ? 50 : 3);

          return (
            <div className="p-6 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] shadow-sleek-sm space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#F3F7F5]">
                  Subscription Tier, PR Reviews & Codebase Q&A Quotas
                </h3>
                <p className="text-xs text-[#9AA7A1] mt-0.5">
                  Current active subscription plan and real-time monthly usage for {org?.name || 'your workspace'}.
                </p>
              </div>

              {/* Real DB Quota Status Panel */}
              <div className="p-5 rounded-2xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-[#9AA7A1] text-[11px] uppercase font-semibold">Monthly Reviews</span>
                  <div className="text-2xl font-bold text-[#F3F7F5]">
                    {reviewsUsed} / {reviewsLimit}
                  </div>
                  <div className="text-[11px] text-[#34E5A5] font-semibold">
                    {reviewsRemaining} reviews remaining
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#9AA7A1] text-[11px] uppercase font-semibold">Codebase Q&A Queries</span>
                  <div className="text-2xl font-bold text-[#F3F7F5]">
                    {qnaUsed} / {qnaLimit}
                  </div>
                  <div className="text-[11px] text-[#34E5A5] font-semibold">
                    {qnaRemaining} queries remaining
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#9AA7A1] text-[11px] uppercase font-semibold">Monthly Reset Date</span>
                  <div className="text-sm font-bold text-[#F3F7F5] mt-1">
                    {billing?.resetDate ? new Date(billing.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next calendar month'}
                  </div>
                  <div className="text-[11px] text-[#9AA7A1]">
                    Resets 1st of each calendar month UTC
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#9AA7A1] text-[11px] uppercase font-semibold">Connected Repositories</span>
                  <div className="text-sm font-bold text-[#F3F7F5] mt-1">
                    {reposUsed} / {reposLimit} allowed
                  </div>
                  <div className="text-[11px] text-[#9AA7A1]">
                    Current plan: <strong className="text-[#F3F7F5]">{currentPlan}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {(['FREE', 'PRO', 'TEAM'] as const).map((tier) => (
                  <div
                    key={tier}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                      currentPlan === tier
                        ? 'bg-[#0A1115] border-2 border-[rgba(52,229,165,0.45)] shadow-sleek-md'
                        : 'bg-[#0A1115] border-[rgba(255,255,255,0.09)] shadow-sleek-sm'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#F3F7F5] font-mono">{tier} TIER</span>
                        {currentPlan === tier && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-bold border border-[rgba(52,229,165,0.28)]">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-[#F3F7F5] font-mono my-2.5">
                        {tier === 'FREE' ? '$0' : tier === 'PRO' ? '$29/mo' : '$99/mo'}
                      </div>
                      <p className="text-xs text-[#9AA7A1] leading-relaxed">
                        {tier === 'FREE'
                          ? '25 reviews • 100 Q&A queries / mo • 3 repos'
                          : tier === 'PRO'
                          ? '500 reviews • 2,500 Q&A queries / mo • 15 repos'
                          : '2,500 reviews • 10,000 Q&A queries / mo • 50 repos'}
                      </p>
                    </div>

                    {currentPlan !== tier && tier !== 'FREE' ? (
                      <button
                        onClick={() => handleUpgradePlan(tier as any)}
                        disabled={Boolean(upgradingTier)}
                        className="mt-5 w-full py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                      >
                        <span>{upgradingTier === tier ? 'Redirecting to Stripe...' : `Upgrade to ${tier}`}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </button>
                    ) : currentPlan === tier ? (
                      <div className="mt-5 text-[11px] text-[#34E5A5] font-mono font-bold text-center">Active Plan</div>
                    ) : (
                      <div className="mt-5 text-[11px] text-[#9AA7A1] font-mono text-center">Base Tier</div>
                    )}
                  </div>
                ))}
              </div>

            {/* Customer Portal Action */}
            <div className="p-5 rounded-2xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#F3F7F5]">Stripe Customer Billing Portal</h4>
                <p className="text-xs text-[#9AA7A1] mt-0.5">
                  Update payment methods, view past invoices, or manage subscription tier and cancellations.
                </p>
              </div>
              <button
                onClick={handleOpenCustomerPortal}
                disabled={isOpeningPortal}
                className="px-4 py-2 rounded-xl btn-secondary text-xs font-semibold flex items-center gap-1.5"
              >
                <span>{isOpeningPortal ? 'Connecting to Stripe...' : 'Manage Stripe Invoices & Portal'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

        {/* Tab 4: Security & Webhooks */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-2xl bg-[#0A1115] border border-[rgba(255,255,255,0.09)] shadow-sleek-sm space-y-4 text-xs">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#F3F7F5]">
                GitHub App Cryptographic Verification & Multi-Tenancy
              </h3>
              <p className="text-xs text-[#9AA7A1] mt-0.5">
                Security baseline, webhook verification, and tenant quarantine guarantees.
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-between">
                <span className="text-[#F3F7F5]">Webhook Signature Verification (HMAC-SHA256)</span>
                <span className="text-[#34E5A5] font-bold">Active & Enforced</span>
              </div>
              <div className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-between">
                <span className="text-[#F3F7F5]">Tenant Isolation on Webhook Ingestion</span>
                <span className="text-[#34E5A5] font-bold">Enforced via InstallationId</span>
              </div>
              <div className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-between">
                <span className="text-[#F3F7F5]">Server-Enforced Database Sessions</span>
                <span className="text-[#34E5A5] font-bold">Active</span>
              </div>
              <div className="p-4 rounded-xl bg-[#04070A] border border-[rgba(255,255,255,0.09)] flex items-center justify-between">
                <span className="text-[#F3F7F5]">Webhook Delivery Deduplication</span>
                <span className="text-[#34E5A5] font-bold">Unique Constraint Enforced</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
