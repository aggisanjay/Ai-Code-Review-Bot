'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  Bug,
  ShieldAlert,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Activity,
  Layers,
  Coins,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  GitPullRequest,
  Cpu,
  RefreshCw,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';
import { api } from '../../../lib/api-client';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    api.getAnalyticsOverview()
      .then((res) => {
        if (res?.data) setData(res.data);
      })
      .catch((err) => {
        console.warn('Failed to load observability telemetry:', err);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  // Review & Quality Metrics
  const totalReviews = data?.totalReviews || 0;
  const totalFindings = data?.totalFindings || 0;
  const criticalBlocked = data?.criticalIssuesPrevented || 0;
  const avgReviewDuration = data?.averageReviewDurationSeconds
    ? `${data.averageReviewDurationSeconds}s`
    : '0.0s';
  const timeSavedHours = data?.timeSavedHours ? `${data.timeSavedHours} hrs` : '0.0 hrs';

  // AI Metering, Cost & Token Observability
  const totalTokensUsed = data?.totalTokensUsed || 0;
  const reviewsTokensUsed = data?.reviewsTokensUsed || 0;
  const qnATokensUsed = data?.qnATokensUsed || 0;

  const totalCostUsd = typeof data?.totalEstimatedCostUsd === 'number' ? data.totalEstimatedCostUsd : 0;
  const reviewsCostUsd = typeof data?.reviewsCostUsd === 'number' ? data.reviewsCostUsd : 0;
  const qnACostUsd = typeof data?.qnACostUsd === 'number' ? data.qnACostUsd : 0;

  // Codebase Q&A Latency & Fidelity Metrics
  const totalQnAQueries = data?.totalQnAQueries || 0;
  const avgQnALatency = data?.averageQnALatencyMs || 0;
  const avgRetrievalLatency = data?.averageQnARetrievalLatencyMs || 0;
  const avgGenLatency = data?.averageQnAGenerationLatencyMs || 0;
  const avgGroundingScore = data?.averageGroundingScore || 100;
  const totalCitationsCount = data?.totalCitationsCount || 0;

  // Model & Execution Transparency
  const modelBreakdown = data?.modelBreakdown || { gemini: 0, openai: 0, mock: 0 };
  const directExecutionCount = data?.directExecutionCount || 0;
  const fallbackExecutionCount = data?.fallbackExecutionCount || 0;

  // Recent Operations Feed
  const recentOperations = data?.recentOperations || [];

  // Trend Data for Charts
  const trendData = (data?.reviewsTrend || []).map((t: any) => ({
    date: t.date,
    reviews: t.reviewsCount || 0,
    qna: t.qnaCount || 0,
    findings: t.findingsCount || 0,
  }));

  const severity = data?.severityDistribution || {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  const severityData = [
    { name: 'Critical', value: severity.CRITICAL || 0, color: '#DC2626' },
    { name: 'High', value: severity.HIGH || 0, color: '#D97706' },
    { name: 'Medium', value: severity.MEDIUM || 0, color: '#063B2C' },
    { name: 'Low / Info', value: (severity.LOW || 0) + (severity.INFO || 0), color: '#52635B' },
  ];

  const categories = data?.categoryDistribution || {};
  const categoryData = [
    { category: 'Security', count: categories.SECURITY || 0 },
    { category: 'Correctness', count: categories.CORRECTNESS || 0 },
    { category: 'Performance', count: categories.PERFORMANCE || 0 },
    { category: 'Testing', count: categories.TESTING || 0 },
    { category: 'Maintainability', count: categories.MAINTAINABILITY || 0 },
  ];

  return (
    <div className="flex-1 pb-16 bg-[#F7F9F8] min-h-screen">
      <Header
        title="AI Observability & Cost Intelligence"
        description="Comprehensive telemetry, real-time token metering, latency breakdowns, and model observability across Code Reviews and Codebase Q&A."
      />

      <div className="px-6 sm:px-8 pt-8 space-y-6 max-w-7xl mx-auto">
        {/* Row 1: AI Metering & Cost Observability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Metered Cost */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#B2E0C7] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#52635B]">
                  Total Metered AI Cost
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center border border-black/5">
                  <Coins className="w-4 h-4 text-[#B7791F]" />
                </div>
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-[#111C18]">
                ${totalCostUsd.toFixed(4)}
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono text-[#52635B]">
              <span>PR Reviews: <strong>${reviewsCostUsd.toFixed(4)}</strong></span>
              <span>Q&A: <strong>${qnACostUsd.toFixed(4)}</strong></span>
            </div>
          </div>

          {/* Card 2: Total Tokens Consumed */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#B2E0C7] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#52635B]">
                  Total Tokens Consumed
                </span>
                <div className="w-8 h-8 rounded-full bg-[#EBF7F0] flex items-center justify-center border border-black/5">
                  <Layers className="w-4 h-4 text-[#063B2C]" />
                </div>
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-[#111C18]">
                {totalTokensUsed.toLocaleString()}
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono text-[#52635B]">
              <span>Reviews: <strong>{reviewsTokensUsed.toLocaleString()}</strong></span>
              <span>Q&A: <strong>{qnATokensUsed.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Card 3: Codebase Q&A Latency */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#B2E0C7] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#52635B]">
                  Q&A End-to-End Latency
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FFFBEB] flex items-center justify-center border border-black/5">
                  <Zap className="w-4 h-4 text-[#D97706]" />
                </div>
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-[#111C18]">
                {avgQnALatency}ms
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono text-[#52635B]">
              <span>Retr: <strong>{avgRetrievalLatency}ms</strong></span>
              <span>Gen: <strong>{avgGenLatency}ms</strong></span>
            </div>
          </div>

          {/* Card 4: Evidence Grounding Fidelity */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#B2E0C7] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#52635B]">
                  Grounding & Citation Rate
                </span>
                <div className="w-8 h-8 rounded-full bg-[#EAF5EF] flex items-center justify-center border border-black/5">
                  <ShieldCheck className="w-4 h-4 text-[#16835B]" />
                </div>
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-[#111C18]">
                {avgGroundingScore}%
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-mono text-[#52635B]">
              <span><strong>{totalCitationsCount}</strong> citations</span>
              <span><strong>{totalQnAQueries}</strong> queries</span>
            </div>
          </div>
        </div>

        {/* Row 2: AI Execution & Fallback Transparency Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EF] text-[#126B50] border border-[#C7E4D6] font-semibold text-xs">
              <Cpu className="w-3.5 h-3.5 text-[#16835B]" />
              <span>Provider Observability</span>
            </span>
            <span className="text-[#52635B]">
              Gemini Calls: <strong className="text-[#14211D]">{modelBreakdown.gemini}</strong>
            </span>
            <span className="text-[#52635B]">
              OpenAI Calls: <strong className="text-[#14211D]">{modelBreakdown.openai}</strong>
            </span>
            <span className="text-[#52635B]">
              Direct Hits: <strong className="text-[#16835B]">{directExecutionCount}</strong>
            </span>
            <span className="text-[#52635B]">
              Fallback Hits: <strong className="text-[#D97706]">{fallbackExecutionCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-[#16835B] font-semibold bg-[#EAF5EF] px-2.5 py-0.5 rounded-full border border-[#C7E4D6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16835B] animate-pulse" />
              <span>100% Operational Health</span>
            </span>
          </div>
        </div>

        {/* Row 3: Live AI Operations Audit Stream */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F2]">
            <div>
              <h3 className="text-sm font-bold text-[#111C18] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#126B50]" />
                <span>Live AI Operations Audit Stream</span>
              </h3>
              <p className="text-xs text-[#52635B] mt-0.5">
                Real-time chronological telemetry for PR reviews and repository Q&A queries.
              </p>
            </div>
            <span className="text-xs font-mono text-[#52635B] bg-[#F8FCFA] px-2.5 py-1 rounded-xl border border-[#E2EDE6]">
              {recentOperations.length} recent operations
            </span>
          </div>

          {recentOperations.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[#66736D]">
              No AI operations recorded yet. Trigger a PR review or ask a question in Codebase Q&A to view live telemetry.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#E4EAE6] text-[#7A8C84] uppercase text-[10px]">
                    <th className="pb-2.5 font-bold">Operation Type</th>
                    <th className="pb-2.5 font-bold">Context / Target</th>
                    <th className="pb-2.5 font-bold">Repository</th>
                    <th className="pb-2.5 font-bold">Tokens</th>
                    <th className="pb-2.5 font-bold">Metered Cost</th>
                    <th className="pb-2.5 font-bold">Turnaround</th>
                    <th className="pb-2.5 font-bold">Model Used</th>
                    <th className="pb-2.5 font-bold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F5F2]">
                  {recentOperations.map((op: any) => (
                    <tr key={op.id} className="hover:bg-[#F8FCFA] transition-colors">
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            op.operationType === 'PULL_REQUEST_REVIEW'
                              ? 'bg-[#EBF7F0] text-[#063B2C] border border-[#C3EBD7]'
                              : 'bg-[#F0F4FF] text-[#1E40AF] border border-[#DBEAFE]'
                          }`}
                        >
                          {op.operationType === 'PULL_REQUEST_REVIEW' ? (
                            <>
                              <GitPullRequest className="w-3 h-3 text-[#063B2C]" />
                              <span>PR REVIEW</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-[#1E40AF]" />
                              <span>CODEBASE Q&A</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 font-sans text-xs text-[#14211D] max-w-[220px] truncate" title={op.label}>
                        {op.label}
                      </td>

                      <td className="py-3 text-[#52635B] max-w-[150px] truncate" title={op.repoName}>
                        {op.repoName}
                      </td>

                      <td className="py-3 text-[#14211D] font-bold">
                        {op.tokensUsed.toLocaleString()}
                      </td>

                      <td className="py-3 text-[#126B50] font-bold">
                        ${op.costUsd.toFixed(5)}
                      </td>

                      <td className="py-3 text-[#D97706] font-semibold">
                        {op.durationText}
                      </td>

                      <td className="py-3 text-[#52635B]">
                        <span className="bg-white border border-[#E2EDE6] px-1.5 py-0.5 rounded text-[11px]">
                          {op.modelUsed}
                        </span>
                      </td>

                      <td className="py-3 text-[#7A8C84] text-right text-[11px]">
                        {new Date(op.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row 4: Quality & Defect Prevention Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Review & Q&A Trend Chart */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#111C18]">
                  AI Operations Activity Trend
                </h3>
                <p className="text-xs text-[#52635B] mt-0.5">PR reviews and codebase Q&A queries (Past 7 Days)</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF7F0] text-[#063B2C] border border-[#C3EBD7] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#063B2C]" /> Reviews
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0F4FF] text-[#1E40AF] border border-[#DBEAFE] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#1E40AF]" /> Q&A Queries
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F5F2" />
                  <XAxis dataKey="date" stroke="#7A8C84" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2EDE6' }} />
                  <YAxis stroke="#7A8C84" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#E2EDE6' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2EDE6',
                      borderRadius: '14px',
                      fontSize: '11px',
                      color: '#111C18',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Line type="monotone" dataKey="reviews" stroke="#063B2C" strokeWidth={2.5} dot={{ r: 4, fill: '#063B2C' }} />
                  <Line type="monotone" dataKey="qna" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Breakdown Pie Chart */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-[#111C18]">
                  Severity Breakdown
                </h3>
                <span className="text-[11px] font-medium text-[#52635B] bg-[#F7FAF8] px-2 py-0.5 rounded-full border border-[#E2EDE6]">
                  Live
                </span>
              </div>
              <p className="text-xs text-[#52635B] mb-4">Distribution across all findings</p>

              <div className="h-44 w-full relative flex items-center justify-center">
                {totalFindings === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#52635B]">
                    Zero findings recorded
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={4}>
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E2EDE6',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: '#111C18',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold font-mono text-[#111C18]">{totalFindings}</span>
                      <span className="text-[10px] text-[#7A8C84] uppercase font-semibold">Total</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-[#F0F5F2]">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAFDFB] border border-[#E2EDE6]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[#52635B] text-[11px] font-medium">{s.name}</span>
                  </div>
                  <span className="text-[#111C18] font-bold text-[11px] font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 5: Findings by Engineering Category */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-[#111C18]">
              Findings by Engineering Category
            </h3>
            <span className="text-[11px] font-medium text-[#52635B] bg-[#F7FAF8] px-2 py-0.5 rounded-full border border-[#E2EDE6]">
              Static & AI Combined
            </span>
          </div>
          <p className="text-xs text-[#52635B] mb-5">Security, correctness, performance, testing, and maintainability</p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F5F2" />
                <XAxis dataKey="category" stroke="#7A8C84" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2EDE6' }} />
                <YAxis stroke="#7A8C84" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#E2EDE6' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2EDE6',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#111C18',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="count" fill="#063B2C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
