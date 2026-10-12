'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [org, setOrg] = useState<{ name: string; plan: string } | null>(null);
  const [usage, setUsage] = useState<{ reviewsUsed: number; reviewsLimit: number; resetDate?: string } | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) return;

    // Fetch user profile and active organization
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('reviewflow_token');
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json?.data?.user) {
          setUser({ name: json.data.user.name, email: json.data.user.email });
        }
        if (json?.data?.activeOrganization) {
          setOrg({
            name: json.data.activeOrganization.name,
            plan: json.data.activeOrganization.plan,
          });
        }
      })
      .catch(() => {});

    // Fetch real billing usage
    fetch(`${API_URL}/billing/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const d = json.data;
          setUsage({
            reviewsUsed: typeof d.reviewsUsed === 'number' ? d.reviewsUsed : d.usage?.reviewsUsed ?? 0,
            reviewsLimit: typeof d.reviewsLimit === 'number' ? d.reviewsLimit : d.usage?.reviewsLimit ?? 25,
            resetDate: d.resetDate,
          });
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('reviewflow_token');
    router.push('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pull Requests', href: '/dashboard/pull-requests', icon: GitPullRequest },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings & Policy', href: '/dashboard/settings', icon: Settings },
  ];

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const usagePercent =
    usage && usage.reviewsLimit > 0
      ? Math.min(100, Math.round((usage.reviewsUsed / usage.reviewsLimit) * 100))
      : 0;

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
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px]">
                  {org?.name || 'Workspace'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {org?.plan || 'FREE'} Active
                </span>
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
            <span className="text-zinc-200 font-semibold">
              {usage ? `${usage.reviewsUsed} / ${usage.reviewsLimit}` : '0 / 25'}
            </span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${usagePercent}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>{usage?.resetDate ? `Resets ${new Date(usage.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Quota Usage'}</span>
            <Link href="/dashboard/settings" className="text-blue-400 hover:underline">
              Plan Details
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-[11px] font-semibold text-zinc-200 font-mono">
              {userInitials}
            </div>
            <div className="flex flex-col truncate max-w-[130px]">
              <span className="text-xs font-medium text-zinc-200 truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-zinc-500 font-mono truncate">{user?.email || ''}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
