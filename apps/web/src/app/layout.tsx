import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'ReviewFlow AI — Every pull request. Reviewed intelligently.',
  description:
    'An intelligent GitHub pull-request review platform that automatically analyzes code changes, identifies bugs and security vulnerabilities, suggests fixes, and posts actionable inline comments directly on GitHub.',
  keywords: [
    'AI Code Review',
    'GitHub Bot',
    'Automated Code Analysis',
    'Static Analysis',
    'DevSecOps',
    'Pull Request Reviewer',
  ],
  authors: [{ name: 'ReviewFlow AI Engineering Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
