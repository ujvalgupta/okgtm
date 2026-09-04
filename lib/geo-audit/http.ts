/**
 * SSRF-safe HTTP layer for the GEO audit.
 *
 * This tool's whole job is fetching user-supplied URLs, so the fetcher is the
 * security boundary: every hostname is re-resolved and only public IPs are
 * contacted (blocks private, loopback, link-local, IPv4-mapped and ULA v6).
 * Redirects are re-validated hop by hop, response sizes are capped, and every
 * fetch is time-boxed.
 */

import dns from "node:dns/promises";
import { isIP } from "node:net";
import type { GeoSnapshot } from "./types";

const PER_FETCH_TIMEOUT_MS = 9000;
const MAX_BODY_BYTES = 3_000_000;
const MAX_REDIRECTS = 6;
const PRIVATE_V4 = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8", "169.254.0.0/16", "0.0.0.0/8", "100.64.0.0/10", "192.0.0.0/24"];

function ip4InCidr(ip: string, cidr: string): boolean {
  const [net, bitsS] = cidr.split("/");
  const bits = Number(bitsS);
  const toInt = (s: string) => s.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(net) & mask);
}

function publicIp(ip: string): boolean {
  if (isIP(ip) === 4) return !PRIVATE_V4.some((c) => ip4InCidr(ip, c));
  if (isIP(ip) === 6) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::") return false;
    if (/^fc|^fd/.test(l)) return false; // fc00::/7 unique-local
    if (/^fe[89ab]/.test(l)) return false; // fe80::/10 link-local
    if (l.startsWith("::ffff:")) return false; // IPv4-mapped
    return true;
  }
  return false;
}

async function resolvePublicHosts(hostname: string): Promise<string[]> {
  const ips: string[] = [];
  for (const rrtype of [4, 6]) {
    try {
      const addrs = await (rrtype === 4 ? dns.resolve4(hostname) : dns.resolve6(hostname));
      ips.push(...addrs);
    } catch {
      /* ignore */
    }
  }
  return ips;
}

/** Returns an error string when the host cannot be contacted safely. */
async function assertPublicTarget(url: URL): Promise<string | null> {
  const host = url.hostname.toLowerCase();
  const ips = await resolvePublicHosts(host);
  if (!ips.length) return "host does not resolve";
  if (ips.some((ip) => !publicIp(ip))) return "blocked non-public destination";
  return null;
}

async function readBody(response: Response, maxBytes: number): Promise<{ body: string | null; size: number }> {
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const isTextual = contentType.includes("text") || contentType.includes("html") || contentType.includes("json") || contentType.includes("xml") || contentType === "";
  if (!isTextual) return { body: null, size: 0 };
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length > maxBytes) return { body: null, size: buf.length };
  return { body: buf.toString("utf8"), size: buf.length };
}

export async function fetchText(
  url: string,
  init?: { headers?: Record<string, string>; maxBytes?: number }
): Promise<GeoSnapshot> {
  const startedAt = Date.now();
  const headers: Record<string, string> = {};
  const chain: { url: string; statusCode: number }[] = [];
  const maxBytes = init?.maxBytes ?? MAX_BODY_BYTES;
  let currentUrl = url;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch {
        return snapshot(url, currentUrl, chain, null, headers, null, "invalid redirect URL", startedAt);
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return snapshot(url, currentUrl, chain, null, headers, null, "unsupported protocol", startedAt);
      }
      const blocked = await assertPublicTarget(parsed);
      if (blocked) {
        return snapshot(url, currentUrl, chain, null, headers, null, blocked, startedAt);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PER_FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(currentUrl, {
          redirect: "manual",
          headers: { "user-agent": init?.headers?.["user-agent"] ?? "Mozilla/5.0 (compatible; OkGTM-GeoAudit/1.0; +okgtm.com)", ...init?.headers },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      chain.push({ url: currentUrl, statusCode: response.status });
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return snapshot(url, currentUrl, chain, response.status, headers, null, "redirect without location", startedAt);
        }
        const next = new URL(location, currentUrl);
        if (next.hostname.toLowerCase() !== parsed.hostname.toLowerCase()) {
          // Allow same-registrable host redirects only; anything else is suspicious for a page audit.
          const sameSite = sameRegistrableDomain(next.hostname, parsed.hostname);
          if (!sameSite) {
            return snapshot(url, currentUrl, chain, response.status, headers, null, "cross-site redirect blocked", startedAt);
          }
        }
        currentUrl = next.toString();
        continue;
      }

      const { body, size } = await readBody(response, maxBytes);
      return {
        url,
        finalUrl: currentUrl,
        statusCode: response.status,
        statusText: response.statusText,
        headers,
        body,
        durationMs: Date.now() - startedAt,
        redirectChain: chain,
        ...(size > maxBytes ? { fetchError: "response too large" } : {}),
      };
    }
    return snapshot(url, currentUrl, chain, null, headers, null, "too many redirects", startedAt);
  } catch (error) {
    const msg = error instanceof Error ? (error.name === "AbortError" ? "timed out" : error.message) : String(error);
    return snapshot(url, currentUrl, chain, null, headers, null, msg, startedAt);
  }
}

function snapshot(
  url: string,
  finalUrl: string,
  chain: { url: string; statusCode: number }[],
  statusCode: number | null,
  headers: Record<string, string>,
  body: string | null,
  fetchError: string | undefined,
  startedAt: number
): GeoSnapshot {
  return { url, finalUrl, statusCode, statusText: null, headers, body, fetchError, durationMs: Date.now() - startedAt, redirectChain: chain };
}

/** Fetch with a redirect chain that always follows (used by fetchability). */
export async function fetchWithRedirectChain(url: string): Promise<{ chain: { url: string; statusCode: number }[]; finalUrl: string; fetchError?: string }> {
  const result = await fetchText(url);
  return {
    chain: result.redirectChain ?? [],
    finalUrl: result.finalUrl,
    fetchError: result.fetchError,
  };
}

/**
 * Status-only fetch for link verification: returns the final HTTP status
 * WITHOUT downloading the body. Pages can be megabytes of HTML; a link check
 * only needs to know if the URL responds. Same SSRF guards as fetchText.
 */
export async function fetchStatus(url: string, init?: { headers?: Record<string, string> }): Promise<{ status: number | null; error?: string }> {
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      return { status: null, error: "invalid URL" };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { status: null, error: "unsupported protocol" };
    }
    const blocked = await assertPublicTarget(parsed);
    if (blocked) return { status: null, error: blocked };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        headers: { "user-agent": init?.headers?.["user-agent"] ?? "Mozilla/5.0 (compatible; OkGTM-GeoAudit/1.0; +okgtm.com)", ...init?.headers },
        signal: controller.signal,
      });
      // Headers are enough; stop the body download.
      controller.abort();
    } catch (error) {
      const msg = error instanceof Error ? (error.name === "AbortError" ? "timed out" : error.message) : String(error);
      return { status: null, error: msg };
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { status: response.status, error: "redirect without location" };
      const next = new URL(location, currentUrl);
      if (next.hostname.toLowerCase() !== parsed.hostname.toLowerCase() && !sameRegistrableDomain(next.hostname, parsed.hostname)) {
        return { status: response.status, error: "cross-site redirect blocked" };
      }
      currentUrl = next.toString();
      continue;
    }
    return { status: response.status };
  }
  return { status: null, error: "too many redirects" };
}

export function getOriginRobotsUrl(u: URL): string {
  return new URL("/robots.txt", u.origin).toString();
}
export function getOriginSitemapUrl(u: URL): string {
  return new URL("/sitemap.xml", u.origin).toString();
}
export function getOriginSitemapIndexUrl(u: URL): string {
  return new URL("/sitemap_index.xml", u.origin).toString();
}

function sameRegistrableDomain(a: string, b: string): boolean {
  const tail = (h: string, n: number) => h.split(".").slice(-n).join(".");
  return tail(a, 2) === tail(b, 2);
}
