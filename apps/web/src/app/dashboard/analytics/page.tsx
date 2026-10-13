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
} from 'lucide-react';
import { Header } from '../../../components/dashboard/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

    fetch(`${API_URL}/analytics/overview`, {
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
        if (json?.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [router]);

  const totalReviews = data?.totalReviews || 0;
  const totalFindings = data?.totalFindings || 0;
  const criticalBlocked = data?.criticalIssuesPrevented || 0;
  const avgProcessingTime = data?.averageReviewDurationSeconds
    ? `${data.averageReviewDurationSeconds}s`
    : '0.0s';
  const timeSavedHours = data?.timeSavedHours ? `${data.timeSavedHours} hrs` : '0.0 hrs';

  const trendData = (data?.reviewsTrend || []).map((t: any) => ({
    date: t.date,
    reviews: t.reviewsCount || 0,
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

  const statCards = [
    {
      title: 'Total Defect Catches',
      value: `${totalFindings} Issues`,
      sub: totalReviews > 0 ? 'Persisted review telemetry' : 'No review events yet',
      icon: Bug,
      iconColor: 'text-[#063B2C]',
      iconBg: 'bg-[#EBF7F0]',
    },
    {
      title: 'Critical Defects Blocked',
      value: `${criticalBlocked} Prevented`,
      sub: 'Pre-merge branch enforcement',
      icon: ShieldAlert,
      iconColor: 'text-[#DC2626]',
      iconBg: 'bg-red-50',
      danger: true,
    },
    {
      title: 'Avg Processing Time',
      value: avgProcessingTime,
      sub: 'Real execution latency',
      icon: Clock,
      iconColor: 'text-[#063B2C]',
      iconBg: 'bg-[#EBF7F0]',
    },
    {
      title: 'Engineering Hours Saved',
      value: timeSavedHours,
      sub: 'Calculated from review volume',
      icon: Zap,
      iconColor: 'text-[#B7791F]',
      iconBg: 'bg-[#FEF3C7]',
    },
  ];

  return (
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title="Code Quality & Telemetry Analytics"
        description="Review throughput, defect prevention metrics, and review turnaround times."
      />

      <div className="px-6 sm:px-8 pt-8 space-y-6 max-w-7xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#B2E0C7] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#52635B]">
                      {card.title}
                    </span>
                    <div className={`w-8 h-8 rounded-full ${card.iconBg} flex items-center justify-center border border-black/5`}>
                      <Icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                  </div>
                  <div className={`text-3xl font-bold font-mono tracking-tight ${card.danger ? 'text-[#DC2626]' : 'text-[#111C18]'}`}>
                    {card.value}
                  </div>
                </div>
                <div className="mt-3.5 pt-3 border-t border-[#F0F5F2] flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#10B981] bg-[#EBF7F0] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    <span>{card.sub}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Review Trend Chart */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#111C18]">
                  Review Volume & Findings Trend
                </h3>
                <p className="text-xs text-[#52635B] mt-0.5">Pull requests analyzed vs findings generated (Past 7 Days)</p>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF7F0] text-[#063B2C] border border-[#C3EBD7] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#063B2C]" /> Reviews
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0FAF4] text-[#10B981] border border-[#C3EBD7] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Findings
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
                  <Line type="monotone" dataKey="findings" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Distribution Pie Chart */}
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

        {/* Category Breakdown Bar Chart */}
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
