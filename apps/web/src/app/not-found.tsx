import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#04070A] text-[#F3F7F5] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold font-display text-[#34E5A5] mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-sm text-[#9AA7A1] mb-6 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-xl bg-[#126B50] hover:bg-[#168362] text-white text-xs font-semibold transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}

