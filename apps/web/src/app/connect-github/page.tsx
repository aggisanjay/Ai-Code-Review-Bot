'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Github, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function ConnectGithubGatewayPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Checking GitHub connection status...');
  const [error, setError] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const token = typeof window !== 'undefined' ? localStorage.getItem('reviewflow_token') : null;
    if (!token) {
      // Unauthenticated visitor: route to login and preserve the intended destination
      router.push('/login?redirect=/connect-github');
      return;
    }

    const initiateOrRoute = async () => {
      try {
        setStatusMessage('Verifying organization workspace and installations...');

        const [instRes, reposRes] = await Promise.all([
          fetch(`${API_URL}/repositories/installations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/repositories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (instRes.status === 401 || reposRes.status === 401) {
          localStorage.removeItem('reviewflow_token');
          router.push('/login?redirect=/connect-github');
          return;
        }

        const instJson = instRes.ok ? await instRes.json() : { data: [] };
        const reposJson = reposRes.ok ? await reposRes.json() : { data: [] };

        const installations = instJson.data || [];
        const repositories = reposJson.data || [];

        if (installations.length === 0) {
          // Logged-in but disconnected: initiate secure single-use state and redirect to GitHub App
          setStatusMessage('Initiating secure GitHub App authorization session...');
          const initRes = await fetch(`${API_URL}/repositories/installations/initiate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });

          const initJson = await initRes.json();
          if (initRes.ok && initJson.data?.installUrl) {
            window.location.href = initJson.data.installUrl;
          } else {
            setError(initJson.error?.message || 'Failed to generate GitHub App installation URL.');
          }
        } else if (repositories.length === 0) {
          // GitHub is connected, but no repositories are selected yet
          setStatusMessage('GitHub connected! Navigating to repository selection...');
          router.replace('/dashboard/repositories?picker=true');
        } else {
          // Already connected and repositories configured: route to dashboard
          setStatusMessage('GitHub already connected! Navigating to your repositories...');
          router.replace('/dashboard/repositories');
        }
      } catch (err: any) {
        setError(`Unable to connect to ReviewFlow API: ${err.message}`);
      }
    };

    initiateOrRoute();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#08090C] text-[#EDEDEF] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0B0D12] border border-white/[0.08] rounded-xl p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-300 shadow-inner">
          <Github className="w-7 h-7 text-blue-400" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Connect ReviewFlow AI to GitHub</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Secure, single-app multi-tenant GitHub App integration
          </p>
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-mono text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  hasTriggeredRef.current = false;
                  setError(null);
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg btn-primary text-xs font-medium"
              >
                Retry Connection
              </button>
              <Link href="/dashboard" className="px-4 py-2 rounded-lg btn-secondary text-xs">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-300">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              You will be redirected automatically without entering any keys or installation IDs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
