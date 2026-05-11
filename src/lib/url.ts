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
