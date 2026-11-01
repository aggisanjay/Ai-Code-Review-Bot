'use client';

import React, { useEffect, useRef } from 'react';
import {
  motion, animate, useInView, useMotionValue, useSpring, useTransform, useReducedMotion,
} from 'framer-motion';

/** Card enters with a 3D flip-up. Use `delay` to stagger siblings. */
export function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48, rotateX: -22, scale: 0.94, transformPerspective: 1000 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 90, damping: 16, mass: 0.9, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Pointer-driven 3D tilt with a soft light sheen. */
export function Tilt3D({ children, max = 7, className = '' }: {
  children: React.ReactNode; max?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5), py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 20 });
  const sy = useSpring(py, { stiffness: 220, damping: 20 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const sheen = useTransform([sx, sy] as any, ([x, y]: number[]) =>
    `radial-gradient(360px circle at ${x * 100}% ${y * 100}%, rgba(16,185,129,0.10), transparent 60%)`);
  return (
    <div style={{ perspective: 900 }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={(e) => {
          if (reduce || !ref.current) return;
          const b = ref.current.getBoundingClientRect();
          px.set((e.clientX - b.left) / b.width);
          py.set((e.clientY - b.top) / b.height);
        }}
        onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={reduce ? undefined : { translateZ: 14 }}
        className="relative h-full"
      >
        {children}
        <motion.div aria-hidden style={{ background: sheen }} className="pointer-events-none absolute inset-0 rounded-2xl" />
      </motion.div>
    </div>
  );
}

/** Counts up to a number string like "42", "3.5 hrs", "12s" when scrolled into view. */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const m = value.match(/^(-?[\d.]+)(.*)$/);
  useEffect(() => {
    if (!inView || !m || !ref.current) return;
    const target = parseFloat(m[1]);
    const decimals = (m[1].split('.')[1] || '').length;
    const c = animate(0, target, {
      duration: 1.2, ease: 'easeOut',
      onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(decimals) + m[2]; },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);
  return <span ref={ref}>{m ? '0' + m[2] : value}</span>;
}
