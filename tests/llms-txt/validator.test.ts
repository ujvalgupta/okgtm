import { describe, it, expect, beforeAll } from "vitest";
import { parseLlmsTxt, analyzeParsed, runLlmsTxtAudit } from "../../lib/llms-txt/validator";
import dns from "node:dns/promises";

const GOOD_FILE = `# Example Company

> Example Company builds tools for sales teams.

## Products

- [Example](https://example.com/): The flagship product.
- [Docs](https://example.com/docs): Setup and guides.

## Blog

- [Announcements](https://example.com/blog): Product news.
`;

describe("parseLlmsTxt", () => {
  it("extracts title, summary, sections and links", () => {
    const p = parseLlmsTxt(GOOD_FILE);
    expect(p.title).toBe("Example Company");
    expect(p.summary).toBe("Example Company builds tools for sales teams.");
    expect(p.sections).toHaveLength(2);
    expect(p.sections[0].heading).toBe("Products");
    expect(p.sections[0].links).toHaveLength(2);
    expect(p.sections[0].links[0].description).toBe("The flagship product.");
    expect(p.strayLinks).toHaveLength(0);
  });

  it("keeps links that appear before any section as uncategorized", () => {
    const p = parseLlmsTxt(`# Site\n\n- [Orphan](https://x.com/): no section\n\n## A\n\n- [Home](https://x.com/)\n`);
    expect(p.strayLinks).toHaveLength(1);
    expect(p.sections[0].links).toHaveLength(1);
  });

  it("handles missing parts", () => {
    const p = parseLlmsTxt(`## Only sections\n\n- [Home](https://x.com/)\n`);
    expect(p.title).toBeNull();
    expect(p.summary).toBeNull();
    expect(p.sections).toHaveLength(1);
  });
});

describe("analyzeParsed", () => {
  it("passes a well-formed file", () => {
    const parsed = parseLlmsTxt(GOOD_FILE);
    const a = analyzeParsed(parsed, GOOD_FILE.length, GOOD_FILE);
    expect(a.dumpSignal).toBe(false);
    const passCount = a.checks.filter((c) => c.status === "PASS").length;
    const failCount = a.checks.filter((c) => c.status === "FAIL").length;
    expect(failCount).toBe(0);
    expect(passCount).toBeGreaterThan(3);
    expect(a.totalLinks).toBe(3);
    expect(a.describedLinks).toBe(3);
  });

  it("flags the sitemap-dump failure mode", () => {
    let body = "# Dump\n\n";
    for (let i = 0; i < 180; i++) body += `- [Page ${i}](https://x.com/p/${i})\n`;
    const parsed = parseLlmsTxt(body);
    const a = analyzeParsed(parsed, body.length, body);
    expect(a.dumpSignal).toBe(true);
    expect(a.checks.some((c) => c.id === "dump" && c.status === "FAIL")).toBe(true);
    expect(a.uncategorizedLinks).toBe(180);
  });

  it("warns when most links lack descriptions", () => {
    const body = "# T\n\n> summary\n\n## S\n\n- [A](https://x.com/a)\n- [B](https://x.com/b)\n- [C](https://x.com/c)\n";
    const parsed = parseLlmsTxt(body);
    const a = analyzeParsed(parsed, body.length, body);
    const links = a.checks.find((c) => c.id === "links");
    expect(links?.status).toBe("WARN");
    expect(a.describedLinks).toBe(0);
  });

  it("fails on a file with no links", () => {
    const body = "# T\n\n> summary\n\n## S\n\nNothing here.";
    const parsed = parseLlmsTxt(body);
    const a = analyzeParsed(parsed, body.length, body);
    expect(a.checks.find((c) => c.id === "links")?.status).toBe("FAIL");
  });
});

let online = true;
beforeAll(async () => {
  try {
    await dns.resolve("cloudflare.com");
  } catch {
    online = false;
  }
});

describe("live audit (integration)", () => {
  it.skipIf(!online)(
    "validates a real llms.txt file end to end",
    async () => {
      const r = await runLlmsTxtAudit("https://cloudflare.com");
      expect(r.found).toBe(true);
      expect(r.title).toBeTruthy();
      expect(r.sections.length).toBeGreaterThan(0);
      expect(r.totalLinks).toBeGreaterThan(0);
      expect(r.linkCheck.fetched).toBeGreaterThan(0);
    },
    60_000
  );
});
