import Link from "next/link";

/**
 * Footer for public marketing pages — landing, /privacy, /terms,
 * auth screens. Lives outside the (app) shell so no sidebar/topbar.
 *
 * Keep this lean: brand mark, three thin link rows, copyright. No
 * newsletter form, no social grid — those are launch+1 work, not
 * launch-readiness work.
 */
export function MarketingFooter() {
  const year = 2026; // hard-coded — dev-mode build pins date for determinism
  return (
    <footer className="border-t border-border bg-bg">
      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <span className="font-semibold text-[12px] text-accent leading-none">
                CO
              </span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-text">
              CreOps
            </span>
          </div>
          <p className="text-[13px] text-text-muted leading-relaxed max-w-sm">
            Content workflow for creator teams. Plan, ship, and measure
            every video, short, and post from one place.
          </p>
        </div>

        <div>
          <p className="text-[12px] uppercase tracking-wider text-text-subtle font-semibold mb-3">
            Product
          </p>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link
                href="/sign-up"
                className="text-text-muted hover:text-text transition-colors"
              >
                Get started
              </Link>
            </li>
            <li>
              <Link
                href="/sign-in"
                className="text-text-muted hover:text-text transition-colors"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[12px] uppercase tracking-wider text-text-subtle font-semibold mb-3">
            Legal
          </p>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link
                href="/privacy"
                className="text-text-muted hover:text-text transition-colors"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-text-muted hover:text-text transition-colors"
              >
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-text-subtle">
            © {year} CreOps. All rights reserved.
          </p>
          <p className="text-[12px] text-text-subtle">
            Built with care in Vietnam.
          </p>
        </div>
      </div>
    </footer>
  );
}
