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
import {
  TrendingUp,
  ShieldAlert,
  Clock,
  Zap,
  CheckCircle2,
  DollarSign,
  Brain,
} from 'lucide-react';
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
    { name: 'Critical', value: 7, color: '#EF4444' },
    { name: 'High', value: 14, color: '#F97316' },
    { name: 'Medium', value: 29, color: '#F59E0B' },
    { name: 'Low / Info', value: 18, color: '#0EA5E9' },
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
        title="Code Quality & AI Analytics"
        description="Comprehensive telemetry, defect prevention metrics, and review turnaround times."
      />

      <div className="px-8 pt-8 space-y-8 max-w-7xl">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Defect Catches</span>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-2">68 Issues</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">98.6% accuracy rate</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Critical Vulnerabilities Blocked</span>
            <div className="text-2xl font-bold text-red-400 font-mono mt-2">7 Prevented</div>
            <span className="text-[11px] text-slate-400 mt-1 block">JWT fallbacks & race conditions</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Avg Processing Duration</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono mt-2">8.4 Seconds</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Sub-minute turnarounds</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Estimated AI Model Cost</span>
            <div className="text-2xl font-bold text-indigo-400 font-mono mt-2">$0.56 / Mo</div>
            <span className="text-[11px] text-slate-400 mt-1 block">112,500 tokens used</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Review Trend Chart */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Review Volume & Findings Trend</h3>
                <p className="text-xs text-slate-400">Pull requests analyzed vs findings generated</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Reviews
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Findings
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="reviews" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="findings" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Distribution Pie Chart */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Severity Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Distribution across all findings</p>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={4}>
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-800">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}:</span>
                  <span className="text-slate-100 font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Findings by Engineering Category</h3>
          <p className="text-xs text-slate-400 mb-4">Security, correctness, and performance distribution</p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="category" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
