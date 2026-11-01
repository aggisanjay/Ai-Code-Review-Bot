'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Palette (near-black canvas, mint = brand, azure = matches hero footage). */
export const C = {
  canvas: '#04070A', surface: '#0A1115', line: 'rgba(255,255,255,0.08)',
  ink: '#F3F7F5', mute: 'rgba(243,247,245,0.62)', mint: '#34E5A5', azure: '#4DA3FF',
  red: '#FF5D6C', amber: '#FFB454', violet: '#A78BFA',
};

/** Headline that blurs in word by word. */
export function Words({ text, className = '', delay = 0, inView = true }: {
  text: string; className?: string; delay?: number; inView?: boolean;
}) {
  const reduce = useReducedMotion();
  const trigger = inView
    ? { whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: '-80px' } }
    : { animate: { opacity: 1, y: 0, filter: 'blur(0px)' } };
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={i} aria-hidden className="inline-block"
          initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(12px)' }}
          {...trigger}
          transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.07 }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </span>
  );
}

export function Btn({ href, children, variant = 'solid' }: {
  href: string; children: React.ReactNode; variant?: 'solid' | 'ghost';
}) {
  const base = 'group relative inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-all duration-300 will-change-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34E5A5]';
  const cls = variant === 'solid'
    ? `${base} bg-[#F3F7F5] text-[#04070A] hover:bg-white hover:shadow-[0_10px_40px_-8px_rgba(52,229,165,0.55)]`
    : `${base} border border-white/15 bg-white/[0.04] text-[#F3F7F5] backdrop-blur-md hover:border-white/30 hover:bg-white/10`;
  return <Link href={href} className={cls}>{children}</Link>;
}

/** Looping cinematic footage. Plays only while visible; stays still for reduced motion. */
export function CinematicVideo({ src, className = '', style }: {
  src: string; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const v = ref.current;
    if (!v || reduce) return;
    const io = new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.05 });
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);
  return (
    <video ref={ref} src={src} muted loop playsInline preload="auto" aria-hidden
      className={className} style={style} />
  );
}

export function SectionHead({ kicker, title, body, center = false }: {
  kicker?: string; title: string; body?: string; center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {kicker && <p className="mb-4 font-mono text-xs tracking-[0.18em] text-[#34E5A5]/80">{kicker}</p>}
      <h2 className="text-[clamp(32px,4.6vw,60px)] font-medium leading-[1.02] tracking-[-0.035em] text-[#F3F7F5]">
        <Words text={title} />
      </h2>
      {body && (
        <motion.p
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
          className="mt-5 text-[17px] leading-relaxed text-[#F3F7F5]/60">{body}</motion.p>
      )}
    </div>
  );
}

