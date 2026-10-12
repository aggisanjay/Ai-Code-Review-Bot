'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitPullRequest, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Invalid email or password. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      if (data.data?.token) {
        localStorage.setItem('reviewflow_token', data.data.token);
        router.push(redirectTarget);
      } else {
        setError('Login response did not provide an authentication token.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(`Cannot reach API server at ${API_URL}. Ensure the backend is running.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#EDEDEF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Dot Texture */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 group mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <GitPullRequest className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            ReviewFlow <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.08] text-zinc-400 font-mono">AI</span>
          </span>
        </Link>

        <h2 className="text-center text-xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-center text-xs text-zinc-400">
          Or{' '}
          <Link href={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`} className="text-blue-400 hover:underline">
            create a new team organization
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0B0D12] border border-white/[0.08] py-7 px-6 shadow-2xl rounded-xl sm:px-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Work Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-[#08090C] border border-white/[0.08] rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-[#08090C] border border-white/[0.08] rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded bg-zinc-900 border-white/[0.1] text-blue-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-zinc-400 text-[11px]">
                  Remember session (30 days)
                </label>
              </div>

              <Link href="/login" onClick={(e) => { e.preventDefault(); alert('Please contact your organization administrator or use password reset.'); }} className="text-zinc-400 hover:text-white text-[11px]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-xs font-medium"
            >
              <span>{isLoading ? 'Verifying credentials...' : 'Sign In with Email'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-500 font-mono">
          Protected by enterprise multi-tenant isolation and cryptographic verification.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08090C]" />}>
      <LoginContent />
    </Suspense>
  );
}
