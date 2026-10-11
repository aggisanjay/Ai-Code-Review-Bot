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
  BookOpen,
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
    <aside className="w-64 border-r border-slate-800 bg-slate-950/90 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Organization Brand Header */}
        <div className="h-16 border-b border-slate-800 px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-glow">
              <GitPullRequest className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-100">ReviewFlow AI</span>
              <span className="text-[10px] text-indigo-400 font-mono">v1.0.0 Production</span>
            </div>
          </Link>
        </div>

        {/* Active Organization Switcher Card */}
        <div className="p-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Acme Cloud</span>
                <span className="text-[10px] text-emerald-400 font-mono">PRO Plan Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monthly Usage Bar & User */}
      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* Usage Quota Card */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-400">Monthly Reviews</span>
            <span className="text-slate-200 font-mono">38 / 500</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full w-[8%]" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Reset in 16d</span>
            <Link href="/dashboard/settings" className="text-indigo-400 hover:underline">
              Manage
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
              AC
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">Alex Chen</span>
              <span className="text-[10px] text-slate-400">Staff Engineer</span>
            </div>
          </div>
          <Link href="/" title="Log out" className="text-slate-500 hover:text-slate-300 p-1">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
