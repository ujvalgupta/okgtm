import { describe, it, expect, beforeAll } from "vitest";
import { runAudit } from "../../lib/email-audit/orchestrator";
import { validateDomain } from "../../lib/email-audit/normalize";
import { fetchWellKnown } from "../../lib/shared/http";
import dns from "node:dns/promises";

/** Offline guard: skip live DNS tests when there is no network. */
let online = true;
beforeAll(async () => {
  try {
    await dns.resolve("google.com");
  } catch {
    online = false;
  }
});

describe("live audit (integration)", () => {
  it.skipIf(!online)(
    "audits a domain with public infrastructure end to end",
    async () => {
      const v = validateDomain("google.com");
      expect(v.ok).toBe(true);
      const result = await runAudit({ domain: v.ascii! }, {});
      expect(result.domain).toBe("google.com");
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.grade).toBeTruthy();
      expect(result.auditId).toBeTruthy();
      expect(result.checks.length).toBeGreaterThan(5);
      expect(result.summary.critical + result.summary.high + result.summary.medium).toBe(0);
      // google.com must show MX + valid SPF
      const mx = result.checks.find((c) => c.id === "mx");
      expect(mx?.status).toBe("PASS");
      const spfExistence = result.checks.some((c) => c.id === "spf" && c.status === "FAIL" && c.title.includes("No SPF"));
      expect(spfExistence).toBe(false);
    },
    30_000
  );

  it.skipIf(!online)(
    "never reports UNKNOWN when the domain resolves cleanly",
    async () => {
      const result = await runAudit({ domain: "cloudflare.com" }, {});
      const unknowns = result.checks.filter((c) => c.status === "UNKNOWN");
      // Allow at most the optional DNSSEC channel to be unknown; core DNS checks must answer.
      const coreUnknown = unknowns.filter((c) => !["dnssec", "reverse-dns"].includes(c.id));
      expect(coreUnknown.length).toBe(0);
    },
    30_000
  );
});

describe("SSRF-safe MTA-STS fetch", () => {
  it.skipIf(!online)(
    "fetches a public well-known file only over https",
    async () => {
      const r = await fetchWellKnown("mta-sts.google.com", "/.well-known/mta-sts.txt");
      expect(r.ok).toBe(true);
      expect(r.body).toContain("version");
    },
    20_000
  );

  it("blocks a request to a private host by refusing non-public resolution", async () => {
    // Points at loopback semantically — our resolver refuses private IPs.
    const r = await fetchWellKnown("localhost", "/.well-known/x.txt");
    expect(r.ok).toBe(false);
  });
});
