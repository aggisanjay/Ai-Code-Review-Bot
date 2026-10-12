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
    <div className="min-h-screen bg-[#F7F9F8] text-[#14211D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Dot Texture */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2.5 group mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center shadow-sm">
            <GitPullRequest className="w-4 h-4 text-[#126B50]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#14211D] font-display">
            ReviewFlow <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EAF5EF] text-[#126B50] font-mono font-bold border border-[#C7E4D6]">AI</span>
          </span>
        </Link>

        <h2 className="text-center text-2xl font-bold tracking-tight text-[#14211D] font-display">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-center text-xs text-[#66736D]">
          Or{' '}
          <Link href={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`} className="text-[#126B50] font-semibold hover:underline">
            create a new team organization
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-[#E4EAE6] py-8 px-6 shadow-sleek-md rounded-2xl sm:px-8">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-xs flex items-start gap-2.5 font-medium shadow-sm">
              <AlertCircle className="w-4 h-4 text-[#C43D4B] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#14211D] mb-1.5">
                Work Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#66736D]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9F8] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm text-[#14211D] placeholder-[#66736D] focus:outline-none focus:border-[#126B50] transition-colors font-mono"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14211D] mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#66736D]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9F8] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm text-[#14211D] placeholder-[#66736D] focus:outline-none focus:border-[#126B50] transition-colors font-mono"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-[#E4EAE6] text-[#126B50] focus:ring-[#126B50]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-[#66736D] text-xs font-medium">
                  Remember session (30 days)
                </label>
              </div>

              <Link href="/login" onClick={(e) => { e.preventDefault(); alert('Please contact your organization administrator or use password reset.'); }} className="text-[#66736D] hover:text-[#126B50] text-xs font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-primary text-xs sm:text-sm font-semibold shadow-sleek-sm"
            >
              <span>{isLoading ? 'Verifying credentials...' : 'Sign In with Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[#66736D] font-mono">
          Protected by enterprise multi-tenant isolation and cryptographic verification.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F9F8]" />}>
      <LoginContent />
    </Suspense>
  );
}
