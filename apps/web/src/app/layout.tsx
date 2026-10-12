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
      <body className="bg-white text-[#14211D] min-h-screen antialiased selection:bg-[#126B50]/15 selection:text-[#126B50] font-sans">
        {children}
      </body>
    </html>
  );
}
