import { describe, it, expect, beforeAll } from "vitest";
import { normalizeGeoInput } from "../../lib/geo-audit/normalize";
import { evaluateRobotsAccess, parseCrawlDelay } from "../../lib/geo-audit/robots";
import { extractJsonLdItems, structuredDataCheck } from "../../lib/geo-audit/checks/schema-authority";
import { canonicalCheck } from "../../lib/geo-audit/checks/crawl-signals";
import { runGeoAudit } from "../../lib/geo-audit/orchestrator";
import type { CheckCtx } from "../../lib/geo-audit/checks/ctx";
import dns from "node:dns/promises";

describe("normalizeGeoInput", () => {
  it("accepts a bare domain and treats it as https homepage", () => {
    const r = normalizeGeoInput("example.com");
    expect(r.ok).toBe(true);
    expect(r.url).toBe("https://example.com/");
  });

  it("accepts a full URL with a path", () => {
    const r = normalizeGeoInput("https://example.com/blog/post");
    expect(r.ok).toBe(true);
    expect(r.url).toBe("https://example.com/blog/post");
  });

  it("accepts uppercase and http", () => {
    const r = normalizeGeoInput("HTTP://EXAMPLE.com/About");
    expect(r.ok).toBe(true);
    expect(r.url).toBe("http://example.com/About");
  });

  it("rejects IPs, localhost and private names", () => {
    expect(normalizeGeoInput("192.168.1.1").ok).toBe(false);
    expect(normalizeGeoInput("http://localhost:3000/x").ok).toBe(false);
    expect(normalizeGeoInput("http://10.0.0.5").ok).toBe(false);
    expect(normalizeGeoInput("mail.internal").ok).toBe(false);
  });

  it("rejects non-http schemes and junk", () => {
    expect(normalizeGeoInput("ftp://example.com").ok).toBe(false);
    expect(normalizeGeoInput("not a url at all").ok).toBe(false);
    expect(normalizeGeoInput("").ok).toBe(false);
  });
});

describe("robots evaluation", () => {
  it("allows when nothing matches", () => {
    const r = evaluateRobotsAccess("User-agent: *\nDisallow: /private/\n", "GPTBot", "/");
    expect(r.allowed).toBe(true);
  });

  it("blocks a matching disallow with wildcards", () => {
    const r = evaluateRobotsAccess("User-agent: GPTBot\nDisallow: /search*\n", "GPTBot", "/search?q=x");
    expect(r.allowed).toBe(false);
  });

  it("respects end anchors", () => {
    const r = evaluateRobotsAccess("User-agent: *\nDisallow: /*.pdf$\n", "ClaudeBot", "/manual.pdf");
    expect(r.allowed).toBe(false);
    const other = evaluateRobotsAccess("User-agent: *\nDisallow: /*.pdf$\n", "ClaudeBot", "/manual.pdf/extra");
    expect(other.allowed).toBe(true);
  });

  it("applies allow override on equal specificity", () => {
    const content = "User-agent: *\nDisallow: /x\nAllow: /x\n";
    const r = evaluateRobotsAccess(content, "PerplexityBot", "/x");
    expect(r.allowed).toBe(true);
  });

  it("gives specific user-agent rules precedence", () => {
    const content = "User-agent: *\nDisallow: /\nUser-agent: GPTBot\nAllow: /\n";
    const gpt = evaluateRobotsAccess(content, "GPTBot", "/");
    const other = evaluateRobotsAccess(content, "ClaudeBot", "/");
    expect(gpt.allowed).toBe(true);
    expect(other.allowed).toBe(false);
  });

  it("parses crawl-delay", () => {
    expect(parseCrawlDelay("User-agent: *\nCrawl-delay: 30\n")).toBe(30);
    expect(parseCrawlDelay("User-agent: *\nAllow: /\n")).toBe(null);
  });
});

describe("structured data parsing", () => {
  it("extracts and validates JSON-LD", () => {
    const html = `<html><head><title>Acme</title><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme"}</script></head></html>`;
    const items = extractJsonLdItems(html);
    expect(items.length).toBe(1);
    const ctx: CheckCtx = { inputUrl: "https://acme.com/", normalizedUrl: new URL("https://acme.com/"), base: { url: "https://acme.com/", finalUrl: "https://acme.com/", statusCode: 200, statusText: "OK", headers: {}, body: html, durationMs: 1 } };
    const result = structuredDataCheck(ctx);
    expect(result.status).toBe("PASS");
  });

  it("flags broken JSON-LD", () => {
    const html = `<script type="application/ld+json">{not json}</script>`;
    const ctx: CheckCtx = { inputUrl: "https://x.com/", normalizedUrl: new URL("https://x.com/"), base: { url: "https://x.com/", finalUrl: "https://x.com/", statusCode: 200, statusText: "OK", headers: {}, body: html, durationMs: 1 } };
    const result = structuredDataCheck(ctx);
    expect(result.status).toBe("FAIL");
  });
});

describe("canonical", () => {
  it("passes on a self-referencing canonical", () => {
    const html = `<link rel="canonical" href="https://site.com/page">`;
    const ctx: CheckCtx = { inputUrl: "https://site.com/page", normalizedUrl: new URL("https://site.com/page"), base: { url: "https://site.com/page", finalUrl: "https://site.com/page", statusCode: 200, statusText: "OK", headers: {}, body: html, durationMs: 1 } };
    const r = canonicalCheck(ctx);
    expect(r.status).toBe("PASS");
  });
});

let online = true;
beforeAll(async () => {
  try {
    await dns.resolve("okgtm.com");
  } catch {
    online = false;
  }
});

describe("live geo audit (integration)", () => {
  it.skipIf(!online)(
    "audits a real site end to end and returns a report",
    async () => {
      const report = await runGeoAudit("https://okgtm.com", { budgetMs: 50_000 });
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.classification).toBeTruthy();
      expect(report.categories.length).toBe(7);
      // Rendering category has no browser here — must not be counted.
      const rendering = report.categories.find((c) => c.key === "rendering");
      expect(rendering?.available).toBe(false);
      expect(report.checks.length).toBe(16);
      expect(report.durationMs).toBeLessThan(55_000);
    },
    70_000
  );

  it.skipIf(!online)("returns deterministic schema fields", async () => {
    const a = await runGeoAudit("https://okgtm.com");
    const b = await runGeoAudit("https://okgtm.com");
    expect(a.schemaVersion).toBe(b.schemaVersion);
    expect(a.checks.length).toBe(b.checks.length);
  }, 120_000);
});
