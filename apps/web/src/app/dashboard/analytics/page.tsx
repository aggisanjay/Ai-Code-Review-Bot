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
    { name: 'Critical', value: severity.CRITICAL || 0, color: '#C43D4B' },
    { name: 'High', value: severity.HIGH || 0, color: '#B7791F' },
    { name: 'Medium', value: severity.MEDIUM || 0, color: '#126B50' },
    { name: 'Low / Info', value: (severity.LOW || 0) + (severity.INFO || 0), color: '#66736D' },
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
    <div className="flex-1 pb-16 bg-[#F7F9F8]">
      <Header
        title="Code Quality & Telemetry Analytics"
        description="Review throughput, defect prevention metrics, and review turnaround times."
      />

      <div className="px-6 sm:px-8 pt-8 space-y-6 max-w-7xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
            <span className="text-[11px] font-mono text-[#66736D] uppercase tracking-wider font-semibold">Total Defect Catches</span>
            <div className="text-3xl font-bold text-[#14211D] font-mono mt-1.5">{totalFindings} Issues</div>
            <span className="text-[11px] text-[#126B50] font-mono font-medium mt-1.5 block">
              {totalReviews > 0 ? 'Persisted review telemetry' : 'No review events yet'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
            <span className="text-[11px] font-mono text-[#66736D] uppercase tracking-wider font-semibold">Critical Blocked</span>
            <div className="text-3xl font-bold text-[#C43D4B] font-mono mt-1.5">{criticalBlocked} Prevented</div>
            <span className="text-[11px] text-[#66736D] font-mono mt-1.5 block">Pre-merge branch enforcement</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
            <span className="text-[11px] font-mono text-[#66736D] uppercase tracking-wider font-semibold">Avg Processing Time</span>
            <div className="text-3xl font-bold text-[#14211D] font-mono mt-1.5">{avgProcessingTime}</div>
            <span className="text-[11px] text-[#66736D] font-mono mt-1.5 block">Real execution latency</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
            <span className="text-[11px] font-mono text-[#66736D] uppercase tracking-wider font-semibold">Engineering Hours Saved</span>
            <div className="text-3xl font-bold text-[#126B50] font-mono mt-1.5">{timeSavedHours}</div>
            <span className="text-[11px] text-[#66736D] font-mono mt-1.5 block">Calculated from review volume</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Review Trend Chart */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D]">
                  Review Volume & Findings Trend
                </h3>
                <p className="text-xs text-[#66736D] mt-0.5">Pull requests analyzed vs findings generated (Past 7 Days)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#126B50] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#126B50]" /> Reviews
                </span>
                <span className="flex items-center gap-1.5 text-[#16835B] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16835B]" /> Findings
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" stroke="#66736D" fontSize={11} />
                  <YAxis stroke="#66736D" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E4EAE6',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#14211D',
                      boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
                    }}
                  />
                  <Line type="monotone" dataKey="reviews" stroke="#126B50" strokeWidth={2.5} dot={{ r: 3.5, fill: '#126B50' }} />
                  <Line type="monotone" dataKey="findings" stroke="#16835B" strokeWidth={2.5} dot={{ r: 3.5, fill: '#16835B' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Distribution Pie Chart */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D] mb-1">
                Severity Breakdown
              </h3>
              <p className="text-xs text-[#66736D] mb-4">Distribution across all findings</p>

              <div className="h-44 w-full">
                {totalFindings === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#66736D] font-mono">
                    Zero findings recorded
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={3}>
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4EAE6',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#14211D',
                          boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-[#E4EAE6]">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[#66736D] text-[11px]">{s.name}:</span>
                  <span className="text-[#14211D] font-bold text-[11px]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-6 rounded-2xl bg-white border border-[#E4EAE6] shadow-sleek-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#14211D] mb-1">
            Findings by Engineering Category
          </h3>
          <p className="text-xs text-[#66736D] mb-5">Security, correctness, and performance distribution</p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="category" stroke="#66736D" fontSize={11} />
                <YAxis stroke="#66736D" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4EAE6',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#14211D',
                    boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
                  }}
                />
                <Bar dataKey="count" fill="#126B50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
