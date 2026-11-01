'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Btn, CinematicVideo, SectionHead, Words, EASE, C } from './shared';
import { Reveal, Tilt3D } from '../ui/Motion3D';
import { Logo } from '../ui/Logo';
import { FAQS } from './faq-data';

const ORB_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4';
const wrap = 'mx-auto max-w-6xl px-5';
const glass = 'rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl';

/* ───────── Metrics ───────── */
export function Metrics() {
  const items = [['100%', 'precision on the security benchmark'], ['0%', 'false-positive rate in testing'], ['5', 'engineering pillars per review'], ['0', 'writes without your approval']];
  return (
    <section className="border-y border-white/8 bg-[#04070A] py-16">
      <div className={`${wrap} grid grid-cols-2 gap-y-10 md:grid-cols-4`}>
        {items.map(([n, l], i) => (
          <Reveal key={l} delay={i * 0.08}>
            <div className="border-white/8 md:border-l md:pl-8">
              <div className="text-[clamp(44px,6vw,84px)] font-light leading-none tracking-[-0.04em] text-white">{n}</div>
              <p className="mt-3 max-w-[16ch] text-[13.5px] leading-snug text-white/50">{l}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── Codebase Q&A ───────── */
export function QnA() {
  const answer = 'Sessions are validated in verifySession(), which checks the signed cookie, then loads the user. Tokens are rotated on every privileged action, and expired sessions are rejected before any route handler runs.';
  return (
    <section id="qna" className="bg-[#04070A] py-28 sm:py-36">
      <div className={`${wrap} grid items-center gap-14 lg:grid-cols-2`}>
        <div>
          <SectionHead kicker="CODEBASE Q&A" title="Ask the repo. Get answers with receipts." body="Every answer links to the files and line ranges it came from, so you can verify in one click instead of trusting a paragraph." />
          <ul className="mt-8 space-y-3 text-[15px] text-white/65">
            {['Grounded in your indexed code, not guesses', 'Citations you can open at the exact lines', 'Works across every connected repository'].map((t, i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: EASE }} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34E5A5]" />{t}
              </motion.li>
            ))}
          </ul>
        </div>
        <Tilt3D max={5}>
          <div className={`${glass} p-5 sm:p-6`}>
            <div className="mb-5 flex items-center justify-between font-mono text-[10.5px] text-white/35"><span>SAMPLE CONVERSATION</span><span>acme/payments-api</span></div>
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-[14px] text-white">How do we validate user sessions?</div>
            <div className="mt-4 rounded-2xl rounded-bl-md border border-white/8 bg-[#0A1115] p-4">
              <p className="text-[14px] leading-relaxed text-white/80">
                {answer.split(' ').map((w, i) => (
                  <motion.span key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}>{w} </motion.span>
                ))}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['src/auth/session.ts#L41-L58', 'src/middleware/guard.ts#L12-L30', 'src/auth/rotate.ts#L7-L22'].map((c, i) => (
                  <motion.span key={c} initial={{ opacity: 0, y: 8, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.6 + i * 0.12, duration: 0.5, ease: EASE }}
                    className="rounded-md border border-[#34E5A5]/30 bg-[#34E5A5]/[0.08] px-2 py-1 font-mono text-[10.5px] text-[#34E5A5]">{c}</motion.span>
                ))}
              </div>
            </div>
          </div>
        </Tilt3D>
      </div>
    </section>
  );
}

/* ───────── Safety: two-phase write approval ───────── */
export function Safety() {
  const steps = [
    ['01', 'Propose', 'The reviewer drafts a fix as a diff. Nothing touches your repository yet.'],
    ['02', 'Inspect', 'You see the exact patch, the finding it resolves and the evidence behind it.'],
    ['03', 'Approve', 'A one-time 64-character nonce authorises exactly this change, once.'],
  ];
  return (
    <section id="safety" className="relative bg-[#04070A] py-28 sm:py-36">
      <div className={wrap}>
        <SectionHead center kicker="SAFETY BY DESIGN" title="It suggests. You decide." body="Two-phase write approval keeps a human on every change, and pull request content is quarantined so it can never instruct the model." />
        <div className="relative mt-20 grid gap-6 md:grid-cols-3" style={{ perspective: 1200 }}>
          <svg className="pointer-events-none absolute left-[8%] right-[8%] top-10 hidden h-1 w-[84%] md:block" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden>
            <motion.line x1="0" y1="0.5" x2="100" y2="0.5" stroke="#34E5A5" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 6"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE }} />
          </svg>
          {steps.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.15}>
              <Tilt3D max={6}>
                <div className={`${glass} relative p-7`}>
                  <span className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#34E5A5]/40 bg-[#04070A] font-mono text-xs text-[#34E5A5]">{n}</span>
                  <h3 className="text-2xl font-medium tracking-[-0.02em] text-white">{t}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/55">{d}</p>
                </div>
              </Tilt3D>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Analytics preview (sample data) ───────── */
const TREND = [12, 18, 15, 22, 30, 26, 34, 29, 41, 38, 47, 52, 49, 58].map((v, i) => ({ d: `D${i + 1}`, reviews: v, qna: Math.round(v * 0.6 + (i % 4) * 3) }));
const PILL = [['Security', 34, C.red], ['Correctness', 27, C.mint], ['Performance', 18, C.amber], ['Testing', 14, C.azure], ['Maintainability', 22, C.violet]] as const;
const tip = { contentStyle: { background: '#0A1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }, cursor: { stroke: 'rgba(255,255,255,0.15)' } };

export function Analytics() {
  return (
    <section className="bg-[#04070A] py-28 sm:py-36">
      <div className={wrap}>
        <SectionHead kicker="DASHBOARD" title="See the health of every pull request." body="Trends, severity and pillar coverage in one place. The figures below are sample data." />
        <div className="mt-14 grid gap-4 lg:grid-cols-3" style={{ perspective: 1400 }}>
          <div className="lg:col-span-2"><Reveal><Tilt3D max={3}>
            <div className={`${glass} p-6`}>
              <div className="mb-4 flex items-end justify-between"><div><p className="text-sm text-white/50">Reviews per day</p><p className="text-4xl font-light tracking-tight text-white">58 <span className="text-sm text-[#34E5A5]">+31%</span></p></div><span className="font-mono text-[10px] text-white/30">SAMPLE</span></div>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={TREND} margin={{ left: -24, right: 4 }}>
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.mint} stopOpacity={0.5} /><stop offset="100%" stopColor={C.mint} stopOpacity={0} /></linearGradient>
                    <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.azure} stopOpacity={0.35} /><stop offset="100%" stopColor={C.azure} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="qna" name="Q&A" stroke={C.azure} strokeWidth={2} fill="url(#lg2)" />
                  <Area type="monotone" dataKey="reviews" name="Reviews" stroke={C.mint} strokeWidth={2.5} fill="url(#lg1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Tilt3D></Reveal></div>
          <Reveal delay={0.12}><Tilt3D max={4}>
            <div className={`${glass} h-full p-6`}>
              <p className="mb-1 text-sm text-white/50">Findings by pillar</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={PILL.map(([name, v, c]) => ({ name, v, c }))} layout="vertical" margin={{ left: 18, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }} />
                  <Tooltip {...tip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="v" name="Findings" radius={[0, 8, 8, 0]} barSize={14}>{PILL.map(([n, , c]) => <Cell key={n} fill={c} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Tilt3D></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────── Pricing ───────── */
const PLANS = [
  { name: 'Free', m: 0, y: 0, feat: ['Up to 3 connected repositories', '25 pull request reviews / month', '100 codebase Q&A queries / month', 'All 5 engineering pillars', 'Two-phase safe write approvals'] },
  { name: 'Pro', m: 39, y: 32, hot: true, feat: ['Up to 15 connected repositories', '250 pull request reviews / month', '2,500 codebase Q&A queries / month', 'Custom review rules & team guidelines', 'Priority background worker queues'] },
  { name: 'Team', m: 149, y: 129, feat: ['Up to 50 connected repositories', '1,000 reviews / month', '10,000 codebase Q&A queries / month', 'Dedicated Slack / webhook integrations', 'Personalized 24/7 priority support'] },
];
export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="bg-[#04070A] py-28 sm:py-36">
      <div className={wrap}>
        <SectionHead center kicker="PRICING" title="Start free. Scale when your team does." />
        <div className="mx-auto mt-8 flex w-fit rounded-full border border-white/10 bg-white/[0.04] p-1 text-[13px]" role="group" aria-label="Billing period">
          {[['Monthly', false], ['Yearly', true]].map(([l, v]) => (
            <button key={l as string} onClick={() => setYearly(v as boolean)} aria-pressed={yearly === v}
              className={`rounded-full px-5 py-1.5 transition ${yearly === v ? 'bg-white text-[#04070A]' : 'text-white/60 hover:text-white'}`}>{l as string}</button>
          ))}
        </div>
        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3" style={{ perspective: 1400 }}>
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1} className="h-full">
              <Tilt3D max={5} className="h-full">
                <div className="relative h-full rounded-2xl p-px">
                  {p.hot && <motion.div aria-hidden className="absolute inset-0 overflow-hidden rounded-2xl"><motion.div className="absolute -inset-[60%]" style={{ background: 'conic-gradient(from 0deg, transparent 0 60%, #34E5A5, #4DA3FF, transparent)' }} animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} /></motion.div>}
                  <div className={`relative flex h-full flex-col rounded-[15px] p-7 ${p.hot ? 'bg-[#0A1115]' : `${glass}`}`}>
                    <div className="flex items-center justify-between"><span className="font-mono text-xs tracking-[0.16em] text-white/55">{p.name.toUpperCase()}</span>{p.hot && <span className="rounded-full bg-[#34E5A5] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#04070A]">Most popular</span>}</div>
                    <div className="mt-6 text-5xl font-light tracking-[-0.04em] text-white">${yearly ? p.y : p.m}<span className="ml-1 text-sm text-white/40">/ month</span></div>
                    <ul className="mt-7 flex-1 space-y-3 text-[14px] text-white/65">
                      {p.feat.map((f) => <li key={f} className="flex gap-3"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#34E5A5]" />{f}</li>)}
                    </ul>
                    <div className="mt-8"><Btn href="/signup" variant={p.hot ? 'solid' : 'ghost'}>{p.m === 0 ? 'Start free' : `Choose ${p.name}`}</Btn></div>
                  </div>
                </div>
              </Tilt3D>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-[#04070A] py-28">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHead center kicker="FAQ" title="Questions engineers actually ask." />
        <div className="mt-12 divide-y divide-white/8 border-y border-white/8">
          {FAQS.map((f, i) => (
            <div key={f.num}>
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                <span className="text-[16px] font-medium tracking-[-0.01em] text-white">{f.question}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-2xl font-light text-[#34E5A5]">+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                    <p className="pb-6 pr-10 text-[15px] leading-relaxed text-white/55">{f.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Closing CTA + footer ───────── */
export function CTA() {
  return (
    <section className="relative isolate overflow-hidden bg-[#04070A] py-40 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_60%,rgba(77,163,255,0.22),transparent_60%)]" />
      <CinematicVideo src={ORB_VIDEO} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
      <div className={wrap}>
        <h2 className="mx-auto max-w-3xl text-[clamp(38px,6vw,84px)] font-medium leading-[0.98] tracking-[-0.04em] text-white"><Words text="Put evidence behind every review." /></h2>
        <p className="mx-auto mt-6 max-w-md text-[17px] text-white/60">Connect a repository in minutes and get your first cited review today.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3"><Btn href="/signup">Start free</Btn><Btn href="/docs" variant="ghost">Read the docs</Btn></div>
      </div>
    </section>
  );
}

export function Footer() {
  const cols = [['Product', [['Pillars', '/#pillars'], ['Codebase Q&A', '/#qna'], ['Pricing', '/#pricing']]], ['Developers', [['Docs', '/docs'], ['Dashboard', '/dashboard']]], ['Account', [['Sign in', '/login'], ['Create account', '/signup']]]] as const;
  return (
    <footer className="border-t border-white/8 bg-[#04070A] px-5 py-14">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-10 md:flex-row">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-white/45">Engineering-grade pull request intelligence, with a human on every write.</p>
        </div>
        <div className="grid grid-cols-3 gap-12 text-sm">
          {cols.map(([h, links]) => (<div key={h}><p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-white/35">{h.toUpperCase()}</p><ul className="space-y-2">{links.map(([l, href]) => <li key={href}><Link href={href} className="text-white/60 hover:text-white">{l}</Link></li>)}</ul></div>))}
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl font-mono text-[11px] text-white/25">© {new Date().getFullYear()} ReviewFlow AI</p>
    </footer>
  );
}
