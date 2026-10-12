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
} from 'recharts';
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
    ? `${data.averageReviewDurationSeconds} Seconds`
    : '0.0 Seconds';
  const timeSavedHours = data?.timeSavedHours ? `${data.timeSavedHours} hrs` : '0 hrs';

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
    { name: 'Critical', value: severity.CRITICAL || 0, color: '#F43F5E' },
    { name: 'High', value: severity.HIGH || 0, color: '#F97316' },
    { name: 'Medium', value: severity.MEDIUM || 0, color: '#F59E0B' },
    { name: 'Low / Info', value: (severity.LOW || 0) + (severity.INFO || 0), color: '#3B82F6' },
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
    <div className="flex-1 pb-16">
      <Header
        title="Code Quality & Telemetry Analytics"
        description="Review throughput, defect prevention metrics, and review turnaround times."
      />

      <div className="px-6 pt-6 space-y-5 max-w-7xl">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Total Defect Catches</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">{totalFindings} Issues</div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
              {totalReviews > 0 ? 'Persisted review telemetry' : 'No review events yet'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Critical Blocked</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{criticalBlocked} Prevented</div>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Pre-merge branch enforcement</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Avg Processing Time</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">{avgProcessingTime}</div>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Real execution latency</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Engineering Hours Saved</span>
            <div className="text-2xl font-bold text-blue-400 font-mono mt-1">{timeSavedHours}</div>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Calculated from review volume</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily Review Trend Chart */}
          <div className="lg:col-span-8 p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                  Review Volume & Findings Trend
                </h3>
                <p className="text-xs text-zinc-400">Pull requests analyzed vs findings generated (Past 7 Days)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Reviews
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Findings
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={11} />
                  <YAxis stroke="#4B5563" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0D12',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#EDEDEF',
                    }}
                  />
                  <Line type="monotone" dataKey="reviews" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="findings" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Distribution Pie Chart */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300 mb-1">
                Severity Breakdown
              </h3>
              <p className="text-xs text-zinc-400 mb-3">Distribution across all findings</p>

              <div className="h-44 w-full">
                {totalFindings === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                    Zero findings recorded
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={66} paddingAngle={3}>
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B0D12',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#EDEDEF',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-white/[0.06]">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-zinc-400 text-[11px]">{s.name}:</span>
                  <span className="text-zinc-200 font-bold text-[11px]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-5 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300 mb-1">
            Findings by Engineering Category
          </h3>
          <p className="text-xs text-zinc-400 mb-4">Security, correctness, and performance distribution</p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="category" stroke="#4B5563" fontSize={11} />
                <YAxis stroke="#4B5563" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0D12',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#EDEDEF',
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
