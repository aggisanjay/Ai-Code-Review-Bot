'use client';

import React from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Reveal, Tilt3D } from '../ui/Motion3D';

const SEV = [
  { key: 'CRITICAL', name: 'Critical', color: '#DC2626' },
  { key: 'HIGH', name: 'High', color: '#D97706' },
  { key: 'MEDIUM', name: 'Medium', color: '#063B2C' },
  { key: 'LOW', name: 'Low / Info', color: '#94A3A0' },
];
const PILLARS = [
  { key: 'SECURITY', name: 'Security', color: '#DC2626' },
  { key: 'CORRECTNESS', name: 'Correctness', color: '#10B981' },
  { key: 'PERFORMANCE', name: 'Performance', color: '#D97706' },
  { key: 'TESTING', name: 'Testing', color: '#3B82F6' },
  { key: 'MAINTAINABILITY', name: 'Maintainability', color: '#8B5CF6' },
];

const tip = {
  contentStyle: { borderRadius: 12, border: '1px solid #E2EDE6', boxShadow: '0 8px 24px rgba(6,59,44,.12)', fontSize: 12 },
  cursor: { stroke: '#B2E0C7' },
};

function Panel({ title, sub, children, delay }: { title: string; sub: string; children: React.ReactNode; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Tilt3D max={3} className="h-full">
        <div className="h-full rounded-2xl border border-[#E2EDE6] bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#111C18]">{title}</h3>
            <p className="text-xs text-[#66736D]">{sub}</p>
          </div>
          {children}
        </div>
      </Tilt3D>
    </Reveal>
  );
}

const Empty = ({ text }: { text: string }) => (
  <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[#D6EFE1] bg-[#F8FCFA] text-xs text-[#66736D]">{text}</div>
);

export function InsightCharts({ analytics }: { analytics: any }) {
  const trend = (analytics?.reviewsTrend || []).map((t: any) => ({
    date: String(t.date).slice(5), reviews: t.reviewsCount || 0, qna: t.qnaCount || 0,
  }));
  const sev = SEV.map((s) => ({ ...s, value: (analytics?.severityDistribution?.[s.key] || 0) + (s.key === 'LOW' ? analytics?.severityDistribution?.INFO || 0 : 0) }));
  const sevTotal = sev.reduce((a, b) => a + b.value, 0);
  const pill = PILLARS.map((p) => ({ ...p, count: analytics?.categoryDistribution?.[p.key] || 0 }));
  const pillTotal = pill.reduce((a, b) => a + b.count, 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={{ perspective: 1200 }}>
      <div className="lg:col-span-2">
        <Panel title="Review activity" sub="Pull request reviews and codebase Q&A per day" delay={0}>
          {trend.length === 0 ? <Empty text="Activity appears after your first review." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.45} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gQna" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#063B2C" stopOpacity={0.3} /><stop offset="100%" stopColor="#063B2C" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#EEF6F1" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66736D' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66736D' }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="reviews" name="Reviews" stroke="#10B981" strokeWidth={2.5} fill="url(#gRev)" />
                <Area type="monotone" dataKey="qna" name="Q&A" stroke="#063B2C" strokeWidth={2} fill="url(#gQna)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="Findings by severity" sub="Across all reviewed pull requests" delay={0.1}>
        {sevTotal === 0 ? <Empty text="No findings yet." /> : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={sev} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} cornerRadius={6} stroke="none">
                  {sev.map((s) => <Cell key={s.key} fill={s.color} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-1">
              <span className="font-mono text-2xl font-bold text-[#111C18]">{sevTotal}</span>
              <span className="text-[10px] text-[#66736D]">findings</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {sev.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-[#52635B]">
                  <i className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}<b className="ml-auto font-mono text-[#111C18]">{s.value}</b>
                </span>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <div className="lg:col-span-3">
        <Panel title="Coverage across the five pillars" sub="Where findings are concentrated" delay={0.15}>
          {pillTotal === 0 ? <Empty text="Pillar breakdown appears after your first review." /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pill} layout="vertical" margin={{ left: 20, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#EEF6F1" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66736D' }} />
                <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#111C18' }} />
                <Tooltip {...tip} cursor={{ fill: '#F4FAF6' }} />
                <Bar dataKey="count" name="Findings" radius={[0, 8, 8, 0]} barSize={16} animationDuration={900}>
                  {pill.map((p) => <Cell key={p.key} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}

