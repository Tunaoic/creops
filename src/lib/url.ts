/**
 * Resolve the public base URL for the running app — used to build
 * absolute links (invite URLs, OG/share URLs).
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL — explicit override (set this in Vercel
 *      for the canonical domain once you wire DNS, e.g. https://creops.app)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel-injected, points at the
 *      project's production deployment (no scheme), e.g. creops-ruddy.vercel.app
 *   3. http://localhost:3000 — local dev fallback
 */
export function resolveBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) return `https://${vercelProd}`;

  return "http://localhost:3000";
}

/**
 * Validate that a string is a syntactically reasonable web URL with
 * an http(s) scheme. Trims whitespace, requires hostname, rejects
 * file:// or javascript: schemes.
 */
export function isValidUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.hostname || u.hostname === "localhost") return true; // localhost ok for testing
    // Reject obvious junk like "https://x" (no TLD, no dot)
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}
