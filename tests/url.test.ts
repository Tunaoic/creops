import { describe, it, expect } from "vitest";
import { isValidUrl } from "@/lib/url";

describe("isValidUrl", () => {
  it("accepts well-formed https URLs", () => {
    expect(isValidUrl("https://drive.google.com/drive/folders/abc")).toBe(true);
    expect(isValidUrl("https://youtube.com/watch?v=xxx")).toBe(true);
    expect(isValidUrl("http://example.com/path?q=1#h")).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidUrl("  https://example.com  ")).toBe(true);
  });

  it("rejects empty / whitespace-only", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("   ")).toBe(false);
  });

  it("rejects non-http schemes (security: no javascript: or file:)", () => {
    // eslint-disable-next-line no-script-url
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("data:text/html,xss")).toBe(false);
  });

  it("rejects junk strings that aren't URLs", () => {
    expect(isValidUrl("foo")).toBe(false);
    expect(isValidUrl("foo.txt")).toBe(false);
    expect(isValidUrl("not a url at all")).toBe(false);
  });

  it("rejects schemed but malformed (no hostname or no TLD)", () => {
    expect(isValidUrl("https://x")).toBe(false); // no dot in hostname
    expect(isValidUrl("https://")).toBe(false);
  });

  it("accepts localhost (for development testing)", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("http://localhost")).toBe(true);
  });
});
