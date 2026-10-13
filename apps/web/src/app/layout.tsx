import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'ReviewFlow AI — Engineering-Grade Pull Request Intelligence',
  description:
    'High-assurance automated code reviews for GitHub pull requests. Deterministic AST security scanning, evidence-grounded AI analysis, and inline code suggestions.',
  keywords: [
    'AI Code Review',
    'GitHub Bot',
    'Automated Code Analysis',
    'Static Analysis',
    'DevSecOps',
    'Pull Request Reviewer',
  ],
  authors: [{ name: 'ReviewFlow AI Engineering Team' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="bg-white text-[#111C18] min-h-screen antialiased selection:bg-[#EBF7F0] selection:text-[#063B2C] font-sans">
        {children}
      </body>
    </html>
  );
}
