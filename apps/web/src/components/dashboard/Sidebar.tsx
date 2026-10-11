'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pull Requests', href: '/dashboard/pull-requests', icon: GitPullRequest },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings & Policy', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#090B0E] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Organization Brand Header */}
        <div className="h-14 border-b border-white/[0.08] px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-white">ReviewFlow</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.08] text-zinc-400 font-mono">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Active Organization Switcher Card */}
        <div className="p-3">
          <div className="p-2.5 rounded-lg bg-[#0E1117] border border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-white/[0.06] flex items-center justify-center text-zinc-300">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-200">Acme Cloud</span>
                <span className="text-[10px] text-emerald-400 font-mono">PRO Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-2 space-y-0.5 mt-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.08] text-white border border-white/[0.1] shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monthly Usage Bar & User */}
      <div className="p-3 border-t border-white/[0.08] space-y-3">
        {/* Usage Quota Card */}
        <div className="p-2.5 rounded-lg bg-[#0E1117] border border-white/[0.07]">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
            <span className="text-zinc-400">Monthly Reviews</span>
            <span className="text-zinc-200 font-semibold">38 / 500</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-[8%]" />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Reset in 16d</span>
            <Link href="/dashboard/settings" className="text-blue-400 hover:underline">
              Plan Details
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-200 font-mono">
              AC
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-200">Alex Chen</span>
              <span className="text-[10px] text-zinc-500 font-mono">Staff Engineer</span>
            </div>
          </div>
          <Link href="/" title="Log out" className="text-zinc-500 hover:text-zinc-300 p-1">
            <LogOut className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
