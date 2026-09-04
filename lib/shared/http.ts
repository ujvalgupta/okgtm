/**
 * SSRF-safe HTTP layer — the merged engine behind the GEO audit fetcher,
 * the LLMs.txt validator fetcher, and the email auditor's MTA-STS policy
 * fetch. One implementation of the security machinery (re-resolve hostname,
 * block private/loopback/link-local/metadata ranges, cap size/time/redirects,
 * re-validate every redirect hop); each entrypoint configures its policy.
 *
 * Security boundary: never call raw `fetch` on user-supplied URLs elsewhere.
 * Use this module.
 */

import dns from "node:dns/promises";
import { isIP } from "node:net";

/** Full snapshot of one fetch (redirect chain included). */
export interface HttpSnapshot {
  /** The URL that was requested first. */
  url: string;
  /** The URL after following redirects (same as url when none). */
  finalUrl: string;
  statusCode: number | null;
  statusText: string | null;
  /** Merged response headers, lower-cased keys, captured hop by hop. */
  headers: Record<string, string>;
  /** Textual body when one was read; null for non-textual/oversized/no-body modes. */
  body: string | null;
  /** Present when the fetch did not complete cleanly (blocked, timed out, too large…). */
  fetchError?: string;
  durationMs: number;
  /** Every HTTP response received, in order (redirects and the final one). */
  redirectChain?: { url: string; statusCode: number }[];
}

type Scheme = "http:" | "https:";

interface Policy {
  /** Allowed URL schemes. */
  schemes: readonly Scheme[];
  /** Error when the scheme is not allowed. */
  schemeError: string;
  /** Error when the URL does not parse. */
  invalidUrlError: string;
  maxRedirects: number;
  timeoutMs: number;
  maxBytes: number;
  userAgent: string;
  /** Sent on every hop. May carry a caller-provided `user-agent` override. */
  extraHeaders?: Record<string, string>;
  /**
   * same-site: redirects may move to another host only within the same
   * registrable domain (page audits). same-host: redirects may not change
   * host at all (mta-sts policy fetch).
   */
  redirectMode: "same-site" | "same-host";
  /** Error when a redirect is blocked by redirectMode. */
  redirectError: string;
  /**
   * textual: read the body only when content-type looks like text (page
   * audits); raw: always read up to maxBytes (mta-sts — content-type is not
   * trusted); none: don't read the body at all (status-only checks).
   */
  readBody: "textual" | "raw" | "none";
  /** Error reported when the body exceeds maxBytes. */
  tooLargeError: string;
  /** Normalizes an unexpected fetch error into the reported message. */
  catchError: (err: unknown) => string;
}

const PRIVATE_V4 = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "0.0.0.0/8",
  "100.64.0.0/10",
  "192.0.0.0/24",
];

function ip4InCidr(ip: string, cidr: string): boolean {
  const [net, bitsS] = cidr.split("/");
  const bits = Number(bitsS);
  const toInt = (s: string) => s.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(net) & mask);
}

function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) return !PRIVATE_V4.some((cidr) => ip4InCidr(ip, cidr));
  if (isIP(ip) === 6) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::") return false; // loopback
    if (l.startsWith("fc") || l.startsWith("fd")) return false; // fc00::/7 unique-local
    if (l.startsWith("fe8") || l.startsWith("fe9") || l.startsWith("fea") || l.startsWith("feb")) return false; // fe80::/10 link-local
    if (l.startsWith("::ffff:")) return false; // IPv4-mapped
    return true;
  }
  return false;
}

async function resolvePublicHosts(hostname: string): Promise<string[]> {
  const ips: string[] = [];
  for (const rrtype of [4, 6] as const) {
    try {
      const addrs = await (rrtype === 4 ? dns.resolve4(hostname) : dns.resolve6(hostname));
      ips.push(...addrs);
    } catch {
      /* ignore */
    }
  }
  return ips;
}

/** Returns an error message when the host cannot be contacted safely. */
async function blockedReason(hostname: string): Promise<string | null> {
  const ips = await resolvePublicHosts(hostname);
  if (!ips.length) return "host does not resolve";
  if (ips.some((ip) => !isPublicIp(ip))) return "blocked non-public destination";
  return null;
}

/** Last two labels of a hostname — crude but sufficient registrable-domain check. */
function registrableTail(hostname: string): string {
  return hostname.split(".").slice(-2).join(".");
}

function sameRegistrableDomain(a: string, b: string): boolean {
  return registrableTail(a) === registrableTail(b);
}

function snapshot(
  url: string,
  finalUrl: string,
  chain: { url: string; statusCode: number }[],
  headers: Record<string, string>,
  statusCode: number | null,
  statusText: string | null,
  body: string | null,
  fetchError: string | undefined,
  startedAt: number
): HttpSnapshot {
  return { url, finalUrl, statusCode, statusText, headers, body, fetchError, durationMs: Date.now() - startedAt, redirectChain: chain };
}

async function safeFetch(startUrl: string, p: Policy): Promise<HttpSnapshot> {
  const startedAt = Date.now();
  const headers: Record<string, string> = {};
  const chain: { url: string; statusCode: number }[] = [];
  const url = startUrl;
  let currentUrl = startUrl;

  const fail = (
    statusCode: number | null,
    statusText: string | null,
    body: string | null,
    fetchError: string | undefined
  ): HttpSnapshot => snapshot(url, currentUrl, chain, headers, statusCode, statusText, body, fetchError, startedAt);

  try {
    for (let hop = 0; hop <= p.maxRedirects; hop++) {
      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch {
        return fail(null, null, null, p.invalidUrlError);
      }
      if (!p.schemes.includes(parsed.protocol as Scheme)) {
        return fail(null, null, null, p.schemeError);
      }

      const blocked = await blockedReason(parsed.hostname.toLowerCase());
      if (blocked) {
        return fail(null, null, null, blocked);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), p.timeoutMs);
      let response: Response;
      try {
        response = await fetch(currentUrl, {
          redirect: "manual",
          headers: { "user-agent": p.userAgent, ...p.extraHeaders },
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
          return fail(response.status, response.statusText, null, "redirect without location");
        }
        const next = new URL(location, currentUrl);
        const hostChanged = next.hostname.toLowerCase() !== parsed.hostname.toLowerCase();
        if (hostChanged && (p.redirectMode === "same-host" || !sameRegistrableDomain(next.hostname, parsed.hostname))) {
          return fail(response.status, response.statusText, null, p.redirectError);
        }
        currentUrl = next.toString();
        continue;
      }

      // Final response — decide how much of the body to read.
      let body: string | null = null;
      let oversized = false;
      if (p.readBody !== "none") {
        const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
        const textual =
          p.readBody === "raw" ||
          contentType.includes("text") ||
          contentType.includes("html") ||
          contentType.includes("json") ||
          contentType.includes("xml") ||
          contentType === "";
        if (textual) {
          const buf = Buffer.from(await response.arrayBuffer());
          if (buf.length > p.maxBytes) {
            oversized = true;
          } else {
            body = buf.toString("utf8");
          }
        }
      } else {
        // Status-only: stop the body download early.
        response.body?.cancel().catch(() => {});
      }

      return snapshot(url, currentUrl, chain, headers, response.status, response.statusText, body, oversized ? p.tooLargeError : undefined, startedAt);
    }
    return fail(null, null, null, "too many redirects");
  } catch (error) {
    return fail(null, null, null, p.catchError(error));
  }
}

const GEO_MAX_BYTES = 3_000_000;
const GEO_TIMEOUT_MS = 9000;
const GEO_MAX_REDIRECTS = 6;
const GEO_USER_AGENT = "Mozilla/5.0 (compatible; OkGTM-GeoAudit/1.0; +okgtm.com)";
const GEO_TOO_LARGE = "response too large";

function geoFailMessage(error: unknown): string {
  return error instanceof Error && error.name === "AbortError" ? "timed out" : error instanceof Error ? error.message : String(error);
}

/**
 * Full-body fetch for page audits: follows same-site redirects, reads textual
 * bodies up to maxBytes. Returns a snapshot even on failure (fetchError set).
 */
export async function fetchText(
  url: string,
  init?: { headers?: Record<string, string>; maxBytes?: number }
): Promise<HttpSnapshot> {
  const headers = init?.headers;
  return safeFetch(url, {
    schemes: ["http:", "https:"],
    schemeError: "unsupported protocol",
    invalidUrlError: "invalid redirect URL",
    maxRedirects: GEO_MAX_REDIRECTS,
    timeoutMs: GEO_TIMEOUT_MS,
    maxBytes: init?.maxBytes ?? GEO_MAX_BYTES,
    userAgent: headers?.["user-agent"] ?? GEO_USER_AGENT,
    extraHeaders: headers,
    redirectMode: "same-site",
    redirectError: "cross-site redirect blocked",
    readBody: "textual",
    tooLargeError: GEO_TOO_LARGE,
    catchError: geoFailMessage,
  });
}

/**
 * Status-only fetch for link checks: returns the final HTTP status without
 * downloading the body. Same SSRF guards as fetchText.
 */
export async function fetchStatus(
  url: string,
  init?: { headers?: Record<string, string> }
): Promise<{ status: number | null; error?: string }> {
  const headers = init?.headers;
  const result = await safeFetch(url, {
    schemes: ["http:", "https:"],
    schemeError: "unsupported protocol",
    invalidUrlError: "invalid URL",
    maxRedirects: GEO_MAX_REDIRECTS,
    timeoutMs: GEO_TIMEOUT_MS,
    maxBytes: GEO_MAX_BYTES,
    userAgent: headers?.["user-agent"] ?? GEO_USER_AGENT,
    extraHeaders: headers,
    redirectMode: "same-site",
    redirectError: "cross-site redirect blocked",
    readBody: "none",
    tooLargeError: GEO_TOO_LARGE,
    catchError: geoFailMessage,
  });
  return { status: result.statusCode, error: result.fetchError };
}

export interface SafeFetchResult {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
}

const MTA_MAX_REDIRECTS = 2;
const MTA_TIMEOUT_MS = 6000;
const MTA_MAX_BYTES = 16_384;
const MTA_USER_AGENT = "okgtm-email-audit/1.0";

/**
 * Strict same-host fetch used for the MTA-STS policy file: HTTPS only, never
 * follows a redirect to a different host, tiny response cap. Preserves the
 * historical { ok, status?, body?, error? } contract.
 */
export async function fetchWellKnown(hostname: string, path: string): Promise<SafeFetchResult> {
  const result = await safeFetch(`https://${hostname}${path}`, {
    schemes: ["https:"],
    schemeError: "HTTPS only",
    invalidUrlError: "invalid URL",
    maxRedirects: MTA_MAX_REDIRECTS,
    timeoutMs: MTA_TIMEOUT_MS,
    maxBytes: MTA_MAX_BYTES,
    userAgent: MTA_USER_AGENT,
    redirectMode: "same-host",
    redirectError: "redirect to different host blocked",
    readBody: "raw",
    tooLargeError: "response too large",
    catchError: () => "fetch failed or timed out",
  });
  if (result.fetchError) {
    return { ok: false, error: result.fetchError };
  }
  return { ok: result.statusCode !== null && result.statusCode >= 200 && result.statusCode < 300, status: result.statusCode ?? undefined, body: result.body ?? undefined };
}

/** Robots.txt URL for an origin. */
export function robotsTxtUrl(origin: URL): string {
  return new URL("/robots.txt", origin.origin).toString();
}

/** Sitemap URL for an origin. */
export function sitemapUrl(origin: URL): string {
  return new URL("/sitemap.xml", origin.origin).toString();
}

/** sitemap_index.xml URL for an origin. */
export function sitemapIndexUrl(origin: URL): string {
  return new URL("/sitemap_index.xml", origin.origin).toString();
}
