'use client';

import React from 'react';
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

export default function AnalyticsPage() {
  const trendData = [
    { date: 'Oct 5', reviews: 4, findings: 11 },
    { date: 'Oct 6', reviews: 6, findings: 16 },
    { date: 'Oct 7', reviews: 5, findings: 12 },
    { date: 'Oct 8', reviews: 8, findings: 22 },
    { date: 'Oct 9', reviews: 7, findings: 18 },
    { date: 'Oct 10', reviews: 10, findings: 26 },
    { date: 'Oct 11', reviews: 9, findings: 20 },
  ];

  const severityData = [
    { name: 'Critical', value: 7, color: '#F43F5E' },
    { name: 'High', value: 14, color: '#F97316' },
    { name: 'Medium', value: 29, color: '#F59E0B' },
    { name: 'Low / Info', value: 18, color: '#3B82F6' },
  ];

  const categoryData = [
    { category: 'Security', count: 21 },
    { category: 'Correctness', count: 18 },
    { category: 'Performance', count: 12 },
    { category: 'Testing', count: 9 },
    { category: 'Maintainability', count: 8 },
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
            <div className="text-2xl font-bold text-white font-mono mt-1">68 Issues</div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">98.6% accuracy rate</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Critical Blocked</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">7 Prevented</div>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">JWT fallbacks & race conditions</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Avg Processing Time</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">8.4 Seconds</div>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Sub-minute turnarounds</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0D12] border border-white/[0.07]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Estimated Model Cost</span>
            <div className="text-2xl font-bold text-blue-400 font-mono mt-1">$0.56 / Mo</div>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">112,500 tokens used</span>
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
                <p className="text-xs text-zinc-400">Pull requests analyzed vs findings generated</p>
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
                  <YAxis stroke="#4B5563" fontSize={11} />
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
                <YAxis stroke="#4B5563" fontSize={11} />
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
