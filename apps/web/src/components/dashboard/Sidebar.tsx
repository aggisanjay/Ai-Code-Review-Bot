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
    <aside className="w-64 border-r border-[#E4EAE6] bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sleek-sm">
      <div>
        {/* Organization Brand Header */}
        <div className="h-16 border-b border-[#E4EAE6] px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center transition-transform group-hover:scale-105">
              <GitPullRequest className="w-4 h-4 text-[#126B50]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#14211D] font-display">
                ReviewFlow
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono font-bold border border-[#C7E4D6]">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Active Organization Switcher Card */}
        <div className="p-3.5">
          <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#E4EAE6] flex items-center justify-center text-[#14211D] shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-[#126B50]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#14211D] truncate max-w-[130px]">
                  {org?.name || 'Workspace'}
                </span>
                <span className="text-[10px] text-[#126B50] font-mono font-semibold">
                  {org?.plan || 'FREE'} Tier Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1 mt-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#EAF5EF] text-[#126B50] font-semibold border border-[#C7E4D6] shadow-sm'
                    : 'text-[#66736D] hover:bg-[#F7F9F8] hover:text-[#14211D] border border-transparent'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[#126B50]' : 'text-[#66736D]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monthly Usage Bar & User */}
      <div className="p-3.5 border-t border-[#E4EAE6] space-y-3.5">
        {/* Usage Quota Card */}
        <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E4EAE6]">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="text-[#66736D] font-medium">Monthly Reviews</span>
            <span className="text-[#14211D] font-bold">
              {usage ? `${usage.reviewsUsed} / ${usage.reviewsLimit}` : '0 / 25'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E4EAE6] rounded-full overflow-hidden">
            <div className="h-full bg-[#126B50] rounded-full transition-all duration-300" style={{ width: `${usagePercent}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#66736D] font-mono">
            <span>{usage?.resetDate ? `Resets ${new Date(usage.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Quota Usage'}</span>
            <Link href="/dashboard/settings" className="text-[#126B50] font-semibold hover:underline">
              Plan Details
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center text-xs font-bold text-[#126B50] font-mono shadow-sm">
              {userInitials}
            </div>
            <div className="flex flex-col truncate max-w-[130px]">
              <span className="text-xs font-semibold text-[#14211D] truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-[#66736D] font-mono truncate">{user?.email || ''}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-[#66736D] hover:text-[#C43D4B] p-1.5 rounded-lg hover:bg-[#FDE8E8] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
