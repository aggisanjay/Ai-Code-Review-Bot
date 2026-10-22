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
  Sparkles,
  Activity,
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
    { name: 'Codebase Q&A', href: '/dashboard/qna', icon: Sparkles },
    { name: 'Pull Requests', href: '/dashboard/pull-requests', icon: GitPullRequest },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
    { name: 'AI Observability', href: '/dashboard/analytics', icon: Activity },
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
    <aside className="w-64 border-r border-[#E2EDE6] bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm">
      <div>
        {/* Organization Brand Header */}
        <div className="h-16 border-b border-[#E2EDE6] px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#063B2C] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <GitPullRequest className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#111C18] font-display">
                ReviewFlow
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EBF7F0] text-[#063B2C] font-mono font-bold border border-[#C3EBD7]">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Active Organization Switcher Card */}
        <div className="p-3.5">
          <div className="p-3 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#E2EDE6] flex items-center justify-center text-[#111C18] shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-[#063B2C]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#111C18] truncate max-w-[130px]">
                  {org?.name || 'Workspace'}
                </span>
                <span className="text-[10px] text-[#063B2C] font-mono font-semibold">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-fast ${
                  isActive
                    ? 'bg-[#EBF7F0] text-[#063B2C] font-semibold border border-[#C3EBD7] shadow-sm'
                    : 'text-[#52635B] hover:bg-[#F8FCFA] hover:text-[#111C18] border border-transparent'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[#063B2C]' : 'text-[#52635B]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monthly Usage Bar & User */}
      <div className="p-3.5 border-t border-[#E2EDE6] space-y-3.5">
        {/* Usage Quota Card */}
        <div className="p-3 rounded-xl bg-[#F8FCFA] border border-[#E2EDE6]">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="text-[#52635B] font-medium">Monthly Reviews</span>
            <span className="text-[#111C18] font-bold">
              {usage ? `${usage.reviewsUsed} / ${usage.reviewsLimit}` : '0 / 25'}
            </span>
          </div>
          <div className="w-full h-2 bg-[#E2EDE6] rounded-full overflow-hidden">
            <div className="h-full bg-[#063B2C] rounded-full transition-all duration-300" style={{ width: `${usagePercent}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#52635B] font-mono">
            <span>{usage?.resetDate ? `Resets ${new Date(usage.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Quota Usage'}</span>
            <Link href="/dashboard/settings" className="text-[#063B2C] font-semibold hover:underline">
              Plan Details
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EBF7F0] border border-[#C3EBD7] flex items-center justify-center text-xs font-bold text-[#063B2C] font-mono shadow-sm">
              {userInitials}
            </div>
            <div className="flex flex-col truncate max-w-[130px]">
              <span className="text-xs font-semibold text-[#111C18] truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-[#52635B] font-mono truncate">{user?.email || ''}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-[#52635B] hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
