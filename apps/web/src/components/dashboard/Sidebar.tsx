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
  ChevronDown,
  Check,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [org, setOrg] = useState<{ id?: string; name: string; plan: string } | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false);
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
            id: json.data.activeOrganization.id,
            name: json.data.activeOrganization.name,
            plan: json.data.activeOrganization.plan,
          });
        }
        if (json?.data?.organizations) {
          setOrganizations(json.data.organizations);
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

  const handleSwitchOrg = async (targetOrgId: string) => {
    if (targetOrgId === org?.id) {
      setShowOrgDropdown(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) return;

    setIsSwitchingOrg(true);
    try {
      const res = await fetch(`${API_URL}/auth/switch-org`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId: targetOrgId }),
      });
      const json = await res.json();
      if (res.ok && json.data?.token) {
        localStorage.setItem('reviewflow_token', json.data.token);
        window.location.reload();
      }
    } catch {
      // fallback
    } finally {
      setIsSwitchingOrg(false);
      setShowOrgDropdown(false);
    }
  };

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
    <aside className="w-64 border-r border-[rgba(255,255,255,0.09)] bg-[#0A1115] flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm">
      <div>
        {/* Organization Brand Header */}
        <div className="h-16 border-b border-[rgba(255,255,255,0.09)] px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#126B50] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <GitPullRequest className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#F3F7F5] font-display">
                ReviewFlow
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-mono font-bold border border-[rgba(52,229,165,0.28)]">
                AI
              </span>
            </div>
          </Link>
        </div>

        {/* Active Organization Switcher Card */}
        <div className="p-3.5 relative">
          <div
            onClick={() => organizations.length > 1 && setShowOrgDropdown(!showOrgDropdown)}
            className={`p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)] flex items-center justify-between transition-colors ${
              organizations.length > 1 ? 'cursor-pointer hover:border-[rgba(52,229,165,0.30)]' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0A1115] border border-[rgba(255,255,255,0.09)] flex items-center justify-center text-[#F3F7F5] shadow-sm shrink-0">
                <Building2 className="w-3.5 h-3.5 text-[#34E5A5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#F3F7F5] truncate max-w-[120px]">
                  {org?.name || 'Workspace'}
                </span>
                <span className="text-[10px] text-[#34E5A5] font-mono font-semibold">
                  {org?.plan || 'FREE'} Tier Active
                </span>
              </div>
            </div>
            {organizations.length > 1 && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#9AA7A1] transition-transform shrink-0 ${
                  showOrgDropdown ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>

          {/* Org Switcher Dropdown */}
          {showOrgDropdown && organizations.length > 1 && (
            <div className="absolute top-[calc(100%-8px)] left-3.5 right-3.5 z-50 bg-[#0A1115] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-sleek-lg p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono font-semibold text-[#7F8C86] uppercase tracking-wider">
                Workspaces ({organizations.length})
              </div>
              {organizations.map((o) => {
                const isCurrent = o.id === org?.id;
                return (
                  <button
                    key={o.id}
                    disabled={isSwitchingOrg}
                    onClick={() => handleSwitchOrg(o.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors text-xs ${
                      isCurrent
                        ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-medium'
                        : 'text-[#B4C0BB] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F3F7F5]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold text-xs">{o.name}</span>
                      <span className="text-[10px] font-mono text-[#7F8C86]">
                        {o.installationsCount > 0 ? `Connected • ${o.repositoriesCount || 0} repos` : 'No GitHub link'}
                      </span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#34E5A5] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
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
                    ? 'bg-[rgba(52,229,165,0.10)] text-[#34E5A5] font-semibold border border-[rgba(52,229,165,0.28)] shadow-sm'
                    : 'text-[#B4C0BB] hover:bg-[rgba(255,255,255,0.035)] hover:text-[#F3F7F5] border border-transparent'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[#34E5A5]' : 'text-[#B4C0BB]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Monthly Usage Bar & User */}
      <div className="p-3.5 border-t border-[rgba(255,255,255,0.09)] space-y-3.5">
        {/* Usage Quota Card */}
        <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.09)]">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="text-[#B4C0BB] font-medium">Monthly Reviews</span>
            <span className="text-[#F3F7F5] font-bold">
              {usage ? `${usage.reviewsUsed} / ${usage.reviewsLimit}` : '0 / 25'}
            </span>
          </div>
          <div className="w-full h-2 bg-[rgba(255,255,255,0.10)] rounded-full overflow-hidden">
            <div className="h-full bg-[#126B50] rounded-full transition-all duration-300" style={{ width: `${usagePercent}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#B4C0BB] font-mono">
            <span>{usage?.resetDate ? `Resets ${new Date(usage.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Quota Usage'}</span>
            <Link href="/dashboard/settings" className="text-[#34E5A5] font-semibold hover:underline">
              Plan Details
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[rgba(52,229,165,0.10)] border border-[rgba(52,229,165,0.28)] flex items-center justify-center text-xs font-bold text-[#34E5A5] font-mono shadow-sm">
              {userInitials}
            </div>
            <div className="flex flex-col truncate max-w-[130px]">
              <span className="text-xs font-semibold text-[#F3F7F5] truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-[#B4C0BB] font-mono truncate">{user?.email || ''}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-[#B4C0BB] hover:text-[#FF6B7A] p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
