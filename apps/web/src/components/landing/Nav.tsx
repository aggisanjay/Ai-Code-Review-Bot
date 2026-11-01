'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';

const LINKS = [['Pillars', '/#pillars'], ['Codebase Q&A', '/#qna'], ['Safety', '/#safety'], ['Pricing', '/#pricing'], ['Docs', '/docs']];

export function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        className={`flex w-full max-w-4xl items-center justify-between rounded-full border px-3 py-2 pl-4 transition-all duration-500 ${
          solid ? 'border-white/10 bg-[#04070A]/70 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl' : 'border-transparent bg-transparent'
        }`}
        aria-label="Primary"
      >
        <Logo />
        <div className="hidden items-center gap-7 text-[13.5px] text-[#F3F7F5]/65 md:flex">
          {LINKS.map(([l, h]) => (
            <Link key={h} href={h} className="transition-colors hover:text-white">{l}</Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-[13.5px] text-[#F3F7F5]/70 hover:text-white sm:block">Sign in</Link>
          <Link href="/signup" className="rounded-full bg-[#F3F7F5] px-4 py-2 text-[13.5px] font-medium text-[#04070A] transition hover:bg-white">Start free</Link>
        </div>
      </nav>
    </header>
  );
}
