import { describe, it, expect } from "vitest";
import { parseSpfRecord, analyzeSpfLookups } from "../../lib/email-audit/parsers/spf";
import type { DNSResolver, DNSResult } from "../../lib/email-audit/types";

/* ── Fake resolver for deterministic lookup-count tests ── */
function fakeResolver(records: Record<string, string[]>): DNSResolver {
  const txt = (name: string): DNSResult => {
    const values = records[name.toLowerCase()] ?? [];
    return values.length ? { status: "RECORD_FOUND", values } : { status: "NO_RECORD", values: [] };
  };
  return {
    resolveTXT: async (n) => txt(n),
    resolveA: async () => ({ status: "NO_RECORD", values: [] }),
    resolveAAAA: async () => ({ status: "NO_RECORD", values: [] }),
    resolveMX: async () => ({ status: "NO_RECORD", values: [] }),
    resolveCNAME: async () => ({ status: "NO_RECORD", values: [] }),
    resolveNS: async () => ({ status: "NO_RECORD", values: [] }),
    resolvePTR: async () => ({ status: "NO_RECORD", values: [] }),
    resolveDS: async () => ({ status: "NO_RECORD", values: [] }),
    resolveDNSKEY: async () => ({ status: "NO_RECORD", values: [] }),
  };
}

describe("parseSpfRecord", () => {
  it("tokenizes mechanisms and qualifiers", () => {
    const r = parseSpfRecord("v=spf1 ip4:1.2.3.4 -all");
    expect(r.errors).toEqual([]);
    expect(r.terms.map((t) => t.name)).toEqual(["ip4", "all"]);
    expect(r.allQualifier).toBe("-");
    expect(r.terms[0].value).toBe("1.2.3.4");
  });

  it("detects syntax problems", () => {
    const r = parseSpfRecord("v=spf1 bogus:thing -all");
    expect(r.errors.some((e) => e.includes("Unknown term"))).toBe(true);
  });

  it("flags multiple all mechanisms", () => {
    const r = parseSpfRecord("v=spf1 -all +all");
    expect(r.errors.some((e) => e.includes("More than one 'all'"))).toBe(true);
  });

  it("requires the v=spf1 version prefix", () => {
    const r = parseSpfRecord("include:_spf.google.com ~all");
    expect(r.errors.some((e) => e.includes("v=spf1"))).toBe(true);
  });

  it("extracts redirect domain", () => {
    const r = parseSpfRecord("v=spf1 redirect=_spf.example.com");
    expect(r.redirectDomain).toBe("_spf.example.com");
  });
});

describe("analyzeSpfLookups", () => {
  it("counts a single include as 1 lookup", async () => {
    const rec = "v=spf1 include:_spf.google.com ~all";
    const res = fakeResolver({ "_spf.google.com": ["v=spf1 -all"] });
    const a = await analyzeSpfLookups(res, "example.com", rec);
    expect(a.lookupCount).toBe(1);
    expect(a.withinLimit).toBe(true);
  });

  it("counts nested includes recursively", async () => {
    const rec = "v=spf1 include:_spf.a.com include:_spf.b.com ~all";
    const res = fakeResolver({
      "_spf.a.com": ["v=spf1 include:_spf.c.com ~all"],
      "_spf.b.com": ["v=spf1 -all"],
      "_spf.c.com": ["v=spf1 -all"],
    });
    const a = await analyzeSpfLookups(res, "example.com", rec);
    // include a (1) + include c inside a (1) + include b (1) = 3
    expect(a.lookupCount).toBe(3);
  });

  it("detects include cycles", async () => {
    const rec = "v=spf1 include:_spf.a.com ~all";
    const res = fakeResolver({
      "_spf.a.com": ["v=spf1 include:_spf.a.com ~all"],
    });
    const a = await analyzeSpfLookups(res, "example.com", rec);
    expect(a.cycleDetected).toBe(true);
  });

  it("detects mutual recursion cycles", async () => {
    const rec = "v=spf1 include:_spf.a.com ~all";
    const res = fakeResolver({
      "_spf.a.com": ["v=spf1 include:_spf.b.com ~all"],
      "_spf.b.com": ["v=spf1 include:_spf.a.com ~all"],
    });
    const a = await analyzeSpfLookups(res, "example.com", rec);
    expect(a.cycleDetected).toBe(true);
  });

  it("flags exceeding the 10-lookup limit", async () => {
    // 11 sibling includes
    const terms = Array.from({ length: 11 }, (_, i) => `include:_spf.host${i}.com`).join(" ");
    const rec = `v=spf1 ${terms} ~all`;
    const map: Record<string, string[]> = {};
    for (let i = 0; i < 11; i++) map[`_spf.host${i}.com`] = ["v=spf1 -all"];
    const a = await analyzeSpfLookups(fakeResolver(map), "example.com", rec);
    expect(a.lookupCount).toBe(11);
    expect(a.withinLimit).toBe(false);
  });

  it("stays inside the limit for a common real-world record", async () => {
    const rec = "v=spf1 include:_spf.google.com include:amazonses.com ip4:1.2.3.4 ~all";
    const res = fakeResolver({
      "_spf.google.com": ["v=spf1 include:_spf.google.com:google.com -all"],
      "amazonses.com": ["v=spf1 ip4:199.255.192.0/22 ~all"],
      "_spf.google.com:google.com": ["v=spf1 ip4:1.2.3.4 -all"],
    });
    const a = await analyzeSpfLookups(res, "example.com", rec);
    expect(a.withinLimit).toBe(true);
    expect(a.lookupCount).toBeLessThanOrEqual(10);
  });

  it("bounded: a self-redirect does not loop forever", async () => {
    const rec = "v=spf1 redirect=example.com";
    const res = fakeResolver({ "example.com": [rec] });
    const a = await analyzeSpfLookups(res, "example.com", rec);
    expect(a.lookupCount).toBeLessThanOrEqual(20);
  });
});
