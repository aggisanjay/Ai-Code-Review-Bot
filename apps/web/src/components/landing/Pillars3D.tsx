'use client';

import React, { useRef, useState } from 'react';
import { motion, MotionValue, useMotionValueEvent, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { C } from './shared';

const PILLARS = [
  { name: 'Security', color: C.red, sev: 'High', blurb: 'Injection paths, leaked secrets, unsafe deserialization. Found by a deterministic AST scan first, then explained by the model.',
    file: 'src/routes/users.ts', title: 'Unvalidated input reaches a SQL query',
    code: [['-', "db.query(`... WHERE name = '${name}'`)"], ['+', "db.query('... WHERE name = $1', [name])"]] },
  { name: 'Correctness', color: C.mint, sev: 'Medium', blurb: 'Unhandled rejections, off-by-one errors and null paths, traced back to the exact change that introduced them.',
    file: 'src/jobs/sync.ts', title: 'Promise rejection is never handled',
    code: [['-', 'sendReceipt(order);'], ['+', 'await sendReceipt(order).catch(logFailure);']] },
  { name: 'Performance', color: C.amber, sev: 'Medium', blurb: 'Quadratic loops, N+1 queries and wasteful re-renders flagged with the cost they add.',
    file: 'src/lib/match.ts', title: 'Quadratic lookup inside a loop',
    code: [['-', 'items.filter(i => ids.includes(i.id))'], ['+', 'const set = new Set(ids); items.filter(i => set.has(i.id))']] },
  { name: 'Testing', color: C.azure, sev: 'Low', blurb: 'Skipped suites, missing assertions and untested branches, so coverage gaps never ship quietly.',
    file: 'tests/billing.test.ts', title: 'Skipped suite left in the pull request',
    code: [['-', "describe.skip('invoice totals', ...)"], ['+', "describe('invoice totals', ...)"]] },
  { name: 'Maintainability', color: C.violet, sev: 'Low', blurb: 'Type escapes, dead code and tangled modules, with a smaller change that fixes each.',
    file: 'src/types/api.ts', title: 'Explicit any hides a type error',
    code: [['-', 'function parse(body: any) {'], ['+', 'function parse(body: ParseInput) {']] },
];

function Card({ i, act }: { i: number; act: MotionValue<number> }) {
  const p = PILLARS[i];
  const x = useTransform(act, (a) => (i - a) * 150);
  const z = useTransform(act, (a) => -Math.abs(i - a) * 150);
  const rotateY = useTransform(act, (a) => -(i - a) * 26);
  const scale = useTransform(act, (a) => 1 - Math.abs(i - a) * 0.06);
  const opacity = useTransform(act, (a) => Math.max(0, 1 - Math.abs(i - a) * 0.38));
  const zIndex = useTransform(act, (a) => 100 - Math.round(Math.abs(i - a) * 20));
  return (
    <motion.div style={{ x, z, rotateY, scale, opacity, zIndex, transformStyle: 'preserve-3d' }}
      className="absolute left-1/2 top-1/2 -ml-[170px] -mt-[150px] w-[340px] rounded-2xl border border-white/10 bg-[#0A1115] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />
      <div className="mb-4 flex items-center gap-2 text-[12px]">
        <i className="h-2 w-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 12px ${p.color}` }} />
        <span className="font-medium text-white/90">{p.name}</span>
        <span className="ml-auto rounded-full border px-2 py-0.5 font-mono text-[10px]" style={{ borderColor: `${p.color}66`, color: p.color }}>{p.sev}</span>
      </div>
      <p className="font-mono text-[10.5px] text-white/35">{p.file}</p>
      <p className="mt-1 text-[15px] font-medium leading-snug tracking-[-0.01em] text-white">{p.title}</p>
      <div className="mt-4 space-y-1 font-mono text-[10.5px] leading-relaxed">
        {p.code.map(([t, c], k) => (
          <div key={k} className={`truncate rounded px-2 py-1 ${t === '+' ? 'bg-[#34E5A5]/10 text-[#9AF2CF]' : 'bg-[#FF5D6C]/10 text-[#FF9AA4]'}`}>{t} {c}</div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] text-[#34E5A5]/70">cited from the diff · line verified</p>
    </motion.div>
  );
}

export function Pillars3D() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const act = useTransform(scrollYProgress, [0.06, 0.94], [0, PILLARS.length - 1]);
  const [idx, setIdx] = useState(0);
  useMotionValueEvent(act, 'change', (v) => setIdx(Math.min(PILLARS.length - 1, Math.max(0, Math.round(v)))));
  const cur = PILLARS[idx];

  return (
    <section id="pillars" ref={ref} className="relative bg-[#04070A]" style={{ height: reduce ? 'auto' : '420vh' }}>
      <div className={`${reduce ? '' : 'sticky top-0 h-screen'} flex items-center overflow-hidden`}>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#34E5A5]/80">FIVE PILLARS · {String(idx + 1).padStart(2, '0')} / 05</p>
            <h2 className="text-[clamp(34px,4.8vw,64px)] font-medium leading-[1.02] tracking-[-0.035em] text-[#F3F7F5]">
              One review.<br /><span style={{ color: cur.color }} className="transition-colors duration-500">{cur.name}</span> and four more lenses.
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/60">{cur.blurb}</p>
            <div className="mt-8 flex gap-2" aria-hidden>
              {PILLARS.map((p, k) => (
                <span key={p.name} className="h-1 rounded-full transition-all duration-500"
                  style={{ width: k === idx ? 44 : 14, background: k === idx ? p.color : 'rgba(255,255,255,0.16)' }} />
              ))}
            </div>
          </div>
          <div className="relative h-[340px] sm:h-[420px]" style={{ perspective: 1400 }}>
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-colors duration-700" style={{ background: `${cur.color}30` }} />
            {PILLARS.map((_, i) => <Card key={i} i={i} act={act} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

