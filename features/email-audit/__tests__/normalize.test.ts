import { describe, it, expect } from "vitest";
import { normalizeDomain, validateDomain } from "@/lib/shared/domain-input";

describe("normalizeDomain", () => {
  it("strips scheme", () => {
    expect(normalizeDomain("https://example.com")).toBe("example.com");
    expect(normalizeDomain("http://example.com")).toBe("example.com");
  });

  it("strips www prefixes repeatedly", () => {
    expect(normalizeDomain("www.example.com")).toBe("example.com");
    expect(normalizeDomain("www.www.example.com")).toBe("example.com");
  });

  it("strips paths, queries, fragments", () => {
    expect(normalizeDomain("example.com/path/page")).toBe("example.com");
    expect(normalizeDomain("example.com?q=1")).toBe("example.com");
    expect(normalizeDomain("example.com#sec")).toBe("example.com");
    expect(normalizeDomain("https://example.com/a/b?x=1#y")).toBe("example.com");
  });

  it("lowercases and trims", () => {
    expect(normalizeDomain("  EXAMPLE.COM  ")).toBe("example.com");
  });

  it("strips trailing dots", () => {
    expect(normalizeDomain("example.com.")).toBe("example.com");
    expect(normalizeDomain("example.com...")).toBe("example.com");
  });
});

describe("validateDomain", () => {
  it("accepts a bare domain", () => {
    const r = validateDomain("example.com");
    expect(r.ok).toBe(true);
    expect(r.ascii).toBe("example.com");
  });

  it("accepts a URL and normalizes to the domain", () => {
    const r = validateDomain("https://www.example.com/some/path");
    expect(r.ok).toBe(true);
    expect(r.ascii).toBe("example.com");
  });

  it("accepts uppercase input", () => {
    const r = validateDomain("EXAMPLE.COM");
    expect(r.ok).toBe(true);
    expect(r.ascii).toBe("example.com");
  });

  it("converts an IDN to punycode", () => {
    const r = validateDomain("münchen.de");
    expect(r.ok).toBe(true);
    expect(r.ascii).toBe("xn--mnchen-3ya.de");
  });

  it("rejects raw IP addresses", () => {
    expect(validateDomain("192.168.1.1").ok).toBe(false);
    expect(validateDomain("8.8.8.8").ok).toBe(false);
  });

  it("rejects localhost and private suffixes", () => {
    expect(validateDomain("localhost").ok).toBe(false);
    expect(validateDomain("dev.localhost").ok).toBe(false);
    expect(validateDomain("mail.internal").ok).toBe(false);
    expect(validateDomain("srv.lan").ok).toBe(false);
    expect(validateDomain("nas.home").ok).toBe(false);
  });

  it("rejects single labels and junk", () => {
    expect(validateDomain("example").ok).toBe(false);
    expect(validateDomain("").ok).toBe(false);
    expect(validateDomain("   ").ok).toBe(false);
  });

  it("rejects malformed labels", () => {
    expect(validateDomain("-bad.com").ok).toBe(false);
    expect(validateDomain("bad-.com").ok).toBe(false);
    expect(validateDomain("exa mple.com").ok).toBe(false);
  });

  it("rejects a numeric-ish TLD", () => {
    expect(validateDomain("example.123").ok).toBe(false);
  });
});
