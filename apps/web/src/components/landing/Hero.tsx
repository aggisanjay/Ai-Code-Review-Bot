'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Btn, CinematicVideo, Words, EASE } from './shared';

// Shelf video #16 from the MotionSites media shelf (dark blue ribbon on black).
const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

const DIFF = [
  { n: 38, t: ' ', c: 'router.post(\'/users/search\', async (req, res) => {' },
  { n: 39, t: ' ', c: '  const { name } = req.body;' },
  { n: 40, t: '-', c: '  const rows = await db.query(`SELECT * FROM users WHERE name = \'${name}\'`);' },
  { n: 41, t: '+', c: '  const rows = await db.query(`SELECT * FROM users WHERE name LIKE \'%${name}%\'`);' },
  { n: 42, t: ' ', c: '  res.json(rows);' },
];

function ProductWindow() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A1115]/90 text-left shadow-[0_40px_120px_-20px_rgba(77,163,255,0.35),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.03] px-4 py-3">
        <i className="h-2.5 w-2.5 rounded-full bg-[#FF5D6C]/80" /><i className="h-2.5 w-2.5 rounded-full bg-[#FFB454]/80" /><i className="h-2.5 w-2.5 rounded-full bg-[#34E5A5]/80" />
        <span className="ml-3 truncate font-mono text-[11px] text-white/45">acme/payments-api  ·  #482 Add user search endpoint</span>
        <span className="ml-auto hidden rounded-full border border-[#FF5D6C]/40 bg-[#FF5D6C]/10 px-2.5 py-0.5 font-mono text-[10px] text-[#FF5D6C] sm:block">changes requested</span>
      </div>
      <div className="grid md:grid-cols-[1fr_300px]">
        <div className="border-white/8 p-4 font-mono text-[11.5px] leading-[1.85] md:border-r">
          {DIFF.map((l) => (
            <div key={l.n} className={`flex gap-3 rounded px-2 ${l.t === '+' ? 'bg-[#34E5A5]/10 text-[#9AF2CF]' : l.t === '-' ? 'bg-[#FF5D6C]/10 text-[#FF9AA4]' : 'text-white/55'}`}>
              <span className="w-6 select-none text-right text-white/25">{l.n}</span>
              <span className="w-3 select-none">{l.t}</span>
              <span className="truncate">{l.c}</span>
            </div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
            className="mt-3 rounded-xl border border-[#FF5D6C]/30 bg-[#FF5D6C]/[0.07] p-3.5 font-sans"
          >
            <div className="mb-1.5 flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-[#FF5D6C] px-2 py-0.5 font-semibold text-[#04070A]">High</span>
              <span className="text-white/60">Security · SQL injection</span>
              <span className="ml-auto font-mono text-white/35">L41</span>
            </div>
            <p className="text-[12.5px] leading-snug text-white/85">User input is interpolated into the query string. An attacker controls the WHERE clause.</p>
            <p className="mt-1.5 font-mono text-[10.5px] text-[#34E5A5]/80">evidence: req.body.name → db.query [src/routes/users.ts#L39-L41]</p>
          </motion.div>
        </div>
        <div className="hidden space-y-3 p-4 md:block">
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-white/40">FIVE PILLARS</p>
          {[['Security', 82, '#FF5D6C'], ['Correctness', 64, '#34E5A5'], ['Performance', 41, '#FFB454'], ['Testing', 55, '#4DA3FF'], ['Maintainability', 28, '#A78BFA']].map(([n, v, c], i) => (
            <div key={n as string}>
              <div className="mb-1 flex justify-between text-[11.5px] text-white/70"><span>{n}</span><span className="font-mono text-white/40">{v}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full" style={{ background: c as string }}
                  initial={{ width: 0 }} whileInView={{ width: `${v}%` }} viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 1.1, ease: EASE }} />
              </div>
            </div>
          ))}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11.5px] text-white/60">
            <span className="text-white/90">Write approval required.</span> Suggested fix is ready. Nothing is pushed until you approve it.
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start 95%', 'start 25%'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [42, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.86, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, 0]);
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 800], [0, 160]);
  const fade = useTransform(scrollY, [0, 600], [1, 0.25]);

  return (
    <section className="relative isolate overflow-hidden bg-[#04070A]">
      {/* Footage layer with a still gradient underneath, so the page is never blank */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_30%,rgba(77,163,255,0.25),transparent_55%),radial-gradient(ellipse_at_20%_80%,rgba(52,229,165,0.12),transparent_50%)]" />
      <motion.div style={{ y: videoY, opacity: fade }} className="absolute inset-x-0 -top-10 -z-10 h-[900px]">
        <CinematicVideo src={HERO_VIDEO} className="h-full w-full object-cover opacity-80 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(4,7,10,0.35),rgba(4,7,10,0)_30%,#04070A_88%)]" />

      <div className="mx-auto max-w-6xl px-5 pt-40 text-center sm:pt-48">
        <motion.a
          href="#pillars" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] py-1.5 pl-2 pr-4 text-[12.5px] text-white/75 backdrop-blur-md"
        >
          <span className="rounded-full bg-[#34E5A5] px-2 py-0.5 text-[11px] font-semibold text-[#04070A]">New</span>
          Codebase Q&A with line-level citations
        </motion.a>
        <h1 className="mx-auto max-w-4xl text-[clamp(42px,7.4vw,104px)] font-medium leading-[0.96] tracking-[-0.045em] text-[#F3F7F5]">
          <Words text="Code review that shows its evidence." inView={false} delay={0.15} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}
          className="mx-auto mt-7 max-w-xl text-[clamp(16px,1.5vw,19px)] leading-relaxed text-white/60"
        >
          ReviewFlow reads every pull request across five engineering pillars, cites the exact lines behind each finding, and never writes to your repo without your approval.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Btn href="/signup">Start free</Btn>
          <Btn href="/dashboard" variant="ghost">Open the demo</Btn>
        </motion.div>
      </div>

      {/* Product window tilts up out of the page as you scroll */}
      <div ref={stage} className="mx-auto mt-20 max-w-5xl px-4 pb-24 sm:mt-28" style={{ perspective: 1800 }}>
        <motion.div style={{ rotateX, scale, y, transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}>
          <ProductWindow />
        </motion.div>
      </div>
    </section>
  );
}
