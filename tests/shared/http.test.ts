/**
 * Unit tests for the merged SSRF-safe HTTP layer (lib/shared/http.ts).
 * node:dns and global fetch are mocked; nothing touches the network.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => {
  const mocked = { resolve4: vi.fn(), resolve6: vi.fn() };
  return { default: mocked, ...mocked };
});

import { fetchStatus, fetchText, fetchWellKnown, robotsTxtUrl, sitemapUrl, sitemapIndexUrl } from "../../lib/shared/http";
import dns from "node:dns/promises";

const resolve4 = vi.mocked(dns.resolve4);
const resolve6 = vi.mocked(dns.resolve6);

interface FakeHeaders {
  get(name: string): string | null;
  forEach(cb: (value: string, key: string) => void): void;
}

interface FakeResponse {
  status: number;
  statusText: string;
  headers: FakeHeaders;
  arrayBuffer(): Promise<ArrayBuffer>;
  body?: { cancel(): Promise<void> } | null;
}

interface FetchCall {
  url: string;
  headers?: Record<string, string>;
  redirect?: string;
  signal?: AbortSignal;
}

const fetchMock = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>();

function headersOf(entries: Record<string, string>): FakeHeaders {
  return {
    get(name: string): string | null {
      return entries[name.toLowerCase()] ?? null;
    },
    forEach(cb: (value: string, key: string) => void): void {
      for (const [k, v] of Object.entries(entries)) cb(v, k);
    },
  };
}

function respond(status: number, headers: Record<string, string>, body?: string): FakeResponse {
  return {
    status,
    statusText: status === 301 ? "Moved Permanently" : status === 302 ? "Found" : "OK",
    headers: headersOf(headers),
    body: null,
    async arrayBuffer() {
      return new TextEncoder().encode(body ?? "").buffer as ArrayBuffer;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolve4.mockResolvedValue(["93.184.216.34"]);
  resolve6.mockResolvedValue([]);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchText (page audits)", () => {
  it("returns a snapshot with body, headers and chain for a 2xx response", async () => {
    fetchMock.mockResolvedValue(respond(200, { "content-type": "text/html", "x-test": "yes" }, "<html>hi</html>") as unknown as Response);

    const snap = await fetchText("https://example.com/");

    expect(snap.statusCode).toBe(200);
    expect(snap.body).toBe("<html>hi</html>");
    expect(snap.headers["x-test"]).toBe("yes");
    expect(snap.fetchError).toBeUndefined();
    expect(snap.redirectChain).toEqual([{ url: "https://example.com/", statusCode: 200 }]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.com/");
    // manual redirect handling is mandated
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe("manual");
  });

  it("blocks private/loopback destinations", async () => {
    resolve4.mockResolvedValue(["127.0.0.1"]);
    const snap = await fetchText("https://internal.example/");
    expect(snap.fetchError).toBe("blocked non-public destination");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks IPv6 unique-local destinations", async () => {
    resolve4.mockResolvedValue([]);
    resolve6.mockResolvedValue(["fd00::1"]);
    const snap = await fetchText("https://internal.example/");
    expect(snap.fetchError).toBe("blocked non-public destination");
  });

  it("reports hosts that do not resolve", async () => {
    resolve4.mockRejectedValue(new Error("ENOTFOUND"));
    resolve6.mockRejectedValue(new Error("ENOTFOUND"));
    const snap = await fetchText("https://nope.example/");
    expect(snap.fetchError).toBe("host does not resolve");
  });

  it("follows same-site redirects hop by hop, revalidating each", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(301, { location: "https://www.example.com/" }) as unknown as Response)
      .mockResolvedValueOnce(respond(200, { "content-type": "text/html" }, "final") as unknown as Response);

    const snap = await fetchText("https://example.com/");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(snap.finalUrl).toBe("https://www.example.com/");
    expect(snap.body).toBe("final");
    expect(snap.redirectChain).toHaveLength(2);
  });

  it("blocks cross-site redirects", async () => {
    fetchMock.mockResolvedValue(respond(301, { location: "https://evil.example.net/" }) as unknown as Response);
    const snap = await fetchText("https://example.com/");
    expect(snap.fetchError).toBe("cross-site redirect blocked");
    expect(snap.redirectChain).toHaveLength(1);
  });

  it("reports oversized textual bodies as fetchError", async () => {
    fetchMock.mockResolvedValue(respond(200, { "content-type": "text/plain" }, "x".repeat(100)) as unknown as Response);
    const snap = await fetchText("https://example.com/big.txt", { maxBytes: 10 });
    expect(snap.body).toBeNull();
    expect(snap.fetchError).toBe("response too large");
  });

  it("does not treat non-textual bodies as errors", async () => {
    fetchMock.mockResolvedValue(respond(200, { "content-type": "image/png" }, "png") as unknown as Response);
    const snap = await fetchText("https://example.com/img.png");
    expect(snap.body).toBeNull();
    expect(snap.fetchError).toBeUndefined();
    expect(snap.statusCode).toBe(200);
  });

  it("rejects non-http(s) schemes", async () => {
    const snap = await fetchText("ftp://example.com/");
    expect(snap.fetchError).toBe("unsupported protocol");
  });
});

describe("fetchStatus (link checks)", () => {
  it("returns the final status without reading a body", async () => {
    const resp = respond(200, { "content-type": "text/html" }, "ENORMOUS".repeat(1000));
    const cancel = vi.fn().mockResolvedValue(undefined);
    resp.body = { cancel };
    fetchMock.mockResolvedValue(resp as unknown as Response);

    const result = await fetchStatus("https://example.com/");
    expect(result).toEqual({ status: 200 });
    expect(cancel).toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    resolve4.mockResolvedValue(["10.1.2.3"]);
    const result = await fetchStatus("https://example.com/");
    expect(result.error).toBe("blocked non-public destination");
    expect(result.status).toBeNull();
  });
});

describe("fetchWellKnown (MTA-STS, strict same-host)", () => {
  it("fetches over https with the small cap", async () => {
    fetchMock.mockResolvedValue(respond(200, { "content-type": "text/plain" }, "version: STSv1") as unknown as Response);
    const result = await fetchWellKnown("mta-sts.example.com", "/.well-known/mta-sts.txt");
    expect(result.ok).toBe(true);
    expect(result.body).toBe("version: STSv1");
    const call = fetchMock.mock.calls[0];
    expect(String(call[0])).toBe("https://mta-sts.example.com/.well-known/mta-sts.txt");
  });

  it("blocks redirects to a different host", async () => {
    fetchMock.mockResolvedValue(respond(301, { location: "https://other.example.com/policy" }) as unknown as Response);
    const result = await fetchWellKnown("mta-sts.example.com", "/.well-known/mta-sts.txt");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("redirect to different host blocked");
  });

  it("allows same-host redirects", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(301, { location: "https://mta-sts.example.com/policy-v2" }) as unknown as Response)
      .mockResolvedValueOnce(respond(200, { "content-type": "text/plain" }, "version: STSv1") as unknown as Response);
    const result = await fetchWellKnown("mta-sts.example.com", "/.well-known/mta-sts.txt");
    expect(result.ok).toBe(true);
    expect(result.body).toBe("version: STSv1");
  });

  it("reports non-2xx as ok:false with a status", async () => {
    fetchMock.mockResolvedValue(respond(404, { "content-type": "text/plain" }, "nope") as unknown as Response);
    const result = await fetchWellKnown("mta-sts.example.com", "/.well-known/mta-sts.txt");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });
});

describe("URL helpers", () => {
  it("builds robots/sitemap URLs from an origin", () => {
    const u = new URL("https://example.com/some/page");
    expect(robotsTxtUrl(u)).toBe("https://example.com/robots.txt");
    expect(sitemapUrl(u)).toBe("https://example.com/sitemap.xml");
    expect(sitemapIndexUrl(u)).toBe("https://example.com/sitemap_index.xml");
  });
});
