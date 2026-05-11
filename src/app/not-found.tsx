import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="text-center max-w-md">
        <p className="text-[64px] font-semibold text-text-subtle tabular-nums leading-none">
          404
        </p>
        <h1 className="text-title-2 text-text mt-4">Page not found</h1>
        <p className="text-[15px] text-text-muted mt-3">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="btn-primary text-[14px] inline-flex items-center"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-[14px] text-text-muted hover:text-text transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
