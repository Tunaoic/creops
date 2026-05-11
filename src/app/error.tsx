"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Global error boundary — catches uncaught errors in any route, surfaces
 * a friendly screen + the recovery hint. Logs to console (in production
 * these end up in Vercel's runtime logs).
 *
 * Per Next.js convention, error.tsx is a client component.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logs to Vercel runtime logs in production
    // eslint-disable-next-line no-console
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-danger-bg flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-danger" strokeWidth={1.75} />
        </div>
        <h1 className="text-title-2 text-text">Something went wrong</h1>
        <p className="text-[15px] text-text-muted mt-3">
          We hit an unexpected error. Try again, or come back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-[12px] text-text-subtle mt-3 font-mono">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary text-[14px]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-[14px] text-text-muted hover:text-text transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
