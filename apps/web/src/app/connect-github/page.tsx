'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Github, RefreshCw, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F7F9F8] text-[#14211D] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E4EAE6] rounded-2xl p-8 shadow-sleek-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF5EF] border border-[#C7E4D6] flex items-center justify-center mx-auto text-[#126B50] shadow-sm">
          <Github className="w-8 h-8 text-[#126B50]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#14211D] tracking-tight font-display">Connect ReviewFlow AI to GitHub</h2>
          <p className="text-xs text-[#66736D] mt-1.5 font-mono">
            Secure, single-app multi-tenant GitHub App integration
          </p>
        </div>

        {error ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#C43D4B] text-xs flex items-center gap-2.5 font-mono text-left font-medium">
              <AlertCircle className="w-4 h-4 text-[#C43D4B] shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  hasTriggeredRef.current = false;
                  setError(null);
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl btn-primary text-xs font-semibold shadow-sm"
              >
                Retry Connection
              </button>
              <Link href="/dashboard" className="px-5 py-2.5 rounded-xl btn-secondary text-xs font-semibold">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-center gap-2.5 text-xs font-mono text-[#14211D] font-medium">
              <RefreshCw className="w-4 h-4 text-[#126B50] animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <p className="text-xs text-[#66736D] font-mono leading-relaxed">
              You will be redirected automatically without entering any keys or installation IDs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
