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
  const [isUpgrading, setIsUpgrading] = useState(false);

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
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title="Settings & Policies"
        description="Manage organization preferences, AI review engine providers, team members, and billing quotas."
      />

      <div className="px-6 sm:px-8 pt-8 space-y-6 max-w-5xl mx-auto">
        {feedback && (
          <div className="p-3.5 rounded-xl bg-[#EAF5EF] border border-[#C7E4D6] text-[#126B50] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#16835B] shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-xs flex items-center gap-2.5 font-mono font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#C43D4B] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E4EAE6] pb-3 overflow-x-auto">
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
                    ? 'bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] shadow-sm'
                    : 'text-[#66736D] hover:text-[#14211D] hover:bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#126B50]' : 'text-[#66736D]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Organization & Team */}
        {activeTab === 'org' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
                Organization Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#66736D] font-semibold block mb-1.5">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-[#F7F9F8] border border-[#E4EAE6] rounded-xl p-3 text-[#14211D] font-medium focus:outline-none focus:border-[#126B50] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#66736D] font-semibold block mb-1.5">Slug Identifier</label>
                  <input
                    type="text"
                    disabled
                    value={org?.slug || 'workspace'}
                    className="w-full bg-[#F7F9F8] border border-[#E4EAE6] rounded-xl p-3 text-[#66736D] font-mono opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
                    Team Members ({members.length})
                  </h3>
                  <p className="text-xs text-[#66736D] mt-0.5">Authorized members with access to tenant repositories.</p>
                </div>
              </div>

              <div className="divide-y divide-[#E4EAE6] text-xs">
                {members.map((m) => {
                  const initial = (m.user?.name || m.user?.email || 'U').substring(0, 2).toUpperCase();
                  return (
                    <div key={m.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center font-bold text-[#126B50] font-mono text-[11px] shadow-sm">
                          {initial}
                        </div>
                        <div>
                          <span className="font-semibold text-[#14211D] block text-xs sm:text-sm font-display">{m.user?.name}</span>
                          <span className="text-[11px] text-[#66736D] font-mono">{m.user?.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F7F9F8] border border-[#E4EAE6] text-[#14211D] font-mono font-bold">
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
          <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm space-y-5">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
                AI Provider Architecture & Model Selection
              </h3>
              <p className="text-xs text-[#66736D] mt-0.5">
                Worker executes reviews through Google Gemini or OpenAI with structured JSON schemas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl border-2 border-[#126B50] bg-[#EAF5EF]/20 shadow-sleek-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#14211D] text-sm font-display">
                    {appInfo?.aiModel ? `Google Gemini (${appInfo.aiModel})` : 'Google Gemini (gemini-3.8-flash)'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono font-bold border border-[#C7E4D6]">
                    Active Model
                  </span>
                </div>
                <p className="text-xs text-[#66736D] leading-relaxed">
                  Active production LLM model. Uses structured JSON schema output to evaluate repository pull request diffs with senior engineering precision.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-[#E4EAE6] bg-[#F7F9F8]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#14211D] text-sm font-display">Deterministic AST Scanner</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#16835B] font-mono font-bold border border-[#E4EAE6]">
                    Zero-latency
                  </span>
                </div>
                <p className="text-xs text-[#66736D] leading-relaxed">
                  Pre-flight Abstract Syntax Tree checks for hardcoded cryptographic secrets, unsafe code execution, and prompt-injection defense.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] font-mono text-xs text-[#66736D] space-y-1.5">
              <div>Active Model: <strong className="text-[#14211D]">{appInfo?.aiModel || 'gemini-3.8-flash'}</strong></div>
              <div>AI Provider: <strong className="text-[#14211D]">{appInfo?.aiProvider ? appInfo.aiProvider.toUpperCase() : 'GEMINI'}</strong></div>
              <div>Worker Execution Path: Durable BullMQ + Background Processor</div>
            </div>
          </div>
        )}

        {/* Tab 3: Billing & Subscription */}
        {activeTab === 'billing' && (
          <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
                Subscription Tier & Review Quotas
              </h3>
              <p className="text-xs text-[#66736D] mt-0.5">
                Current active subscription plan and real-time monthly usage for {org?.name || 'your workspace'}.
              </p>
            </div>

            {/* Real DB Quota Status Panel */}
            <div className="p-5 rounded-2xl bg-[#F7F9F8] border border-[#E4EAE6] grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[#66736D] text-[11px] uppercase font-semibold">Monthly Reviews</span>
                <div className="text-2xl font-bold text-[#14211D]">
                  {billing?.reviewsUsed ?? 0} / {billing?.reviewsLimit ?? 25}
                </div>
                <div className="text-[11px] text-[#126B50] font-semibold">
                  {billing?.reviewsRemaining ?? 25} reviews remaining
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[#66736D] text-[11px] uppercase font-semibold">Monthly Reset Date</span>
                <div className="text-sm font-bold text-[#14211D] mt-1">
                  {billing?.resetDate ? new Date(billing.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next calendar month'}
                </div>
                <div className="text-[11px] text-[#66736D]">
                  Resets 1st of each calendar month UTC
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[#66736D] text-[11px] uppercase font-semibold">Connected Repositories</span>
                <div className="text-sm font-bold text-[#14211D] mt-1">
                  {billing?.reposUsed ?? 0} / {billing?.reposLimit ?? 3} allowed
                </div>
                <div className="text-[11px] text-[#66736D]">
                  Current plan: <strong className="text-[#14211D]">{currentPlan}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {(['FREE', 'PRO', 'TEAM'] as const).map((tier) => (
                <div
                  key={tier}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    currentPlan === tier
                      ? 'bg-white border-2 border-[#126B50] shadow-sleek-md'
                      : 'bg-white border-[#E4EAE6] shadow-sleek-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#14211D] font-mono">{tier} TIER</span>
                      {currentPlan === tier && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono font-bold border border-[#C7E4D6]">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-[#14211D] font-mono my-2.5">
                      {tier === 'FREE' ? '$0' : tier === 'PRO' ? '$29/mo' : '$99/mo'}
                    </div>
                    <p className="text-xs text-[#66736D] leading-relaxed">
                      {tier === 'FREE'
                        ? '25 reviews / month • 3 repos'
                        : tier === 'PRO'
                        ? '500 reviews / month • 15 repos'
                        : '2,500 reviews / month • 50 repos'}
                    </p>
                  </div>

                  {currentPlan !== tier && tier !== 'FREE' ? (
                    <button
                      onClick={() => handleUpgradePlan(tier as any)}
                      disabled={isUpgrading}
                      className="mt-5 w-full py-2.5 rounded-xl btn-primary text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <span>{isUpgrading ? 'Redirecting...' : `Upgrade to ${tier}`}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  ) : currentPlan === tier ? (
                    <div className="mt-5 text-[11px] text-[#126B50] font-mono font-bold text-center">Active Plan</div>
                  ) : (
                    <div className="mt-5 text-[11px] text-[#66736D] font-mono text-center">Base Tier</div>
                  )}
                </div>
              ))}
            </div>

            {/* Customer Portal Action */}
            <div className="p-5 rounded-2xl bg-[#F7F9F8] border border-[#E4EAE6] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#14211D]">Stripe Customer Billing Portal</h4>
                <p className="text-xs text-[#66736D] mt-0.5">
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
        )}

        {/* Tab 4: Security & Webhooks */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm space-y-4 text-xs">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
                GitHub App Cryptographic Verification & Multi-Tenancy
              </h3>
              <p className="text-xs text-[#66736D] mt-0.5">
                Security baseline, webhook verification, and tenant quarantine guarantees.
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-between">
                <span className="text-[#14211D]">Webhook Signature Verification (HMAC-SHA256)</span>
                <span className="text-[#126B50] font-bold">Active & Enforced</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-between">
                <span className="text-[#14211D]">Tenant Isolation on Webhook Ingestion</span>
                <span className="text-[#126B50] font-bold">Enforced via InstallationId</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-between">
                <span className="text-[#14211D]">Server-Enforced Database Sessions</span>
                <span className="text-[#126B50] font-bold">Active</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-between">
                <span className="text-[#14211D]">Webhook Delivery Deduplication</span>
                <span className="text-[#126B50] font-bold">Unique Constraint Enforced</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
