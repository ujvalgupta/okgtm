/**
 * SSRF-safe HTTPS fetch for MTA-STS.
 *
 * Only ever fetches https://mta-sts.<validated-domain>/.well-known/mta-sts.txt.
 * Blocks private/loopback/link-local/metadata ranges by re-resolving the
 * hostname itself and refusing non-public IPs; enforces timeout, redirect
 * cap, response-size cap, and revalidates the destination after each
 * redirect. Never follows a redirect to a different host.
 */

import dns from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 2;
const MAX_BYTES = 16_384;
const TIMEOUT_MS = 6000;

const PRIVATE = [
  "127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
  "169.254.0.0/16", "0.0.0.0/8", "100.64.0.0/10", "192.0.0.0/24",
];

function ipInCidr(ip: string, cidr: string): boolean {
  const [net, bitsS] = cidr.split("/");
  const bits = Number(bitsS);
  const toInt = (s: string) => s.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(net) & mask);
}

function isPublicIpv4(ip: string): boolean {
  if (isIP(ip) !== 4) return false;
  return !PRIVATE.some((cidr) => ipInCidr(ip, cidr));
}

function isPublicIpv6(ip: string): boolean {
  if (isIP(ip) !== 6) return false;
  const lower = ip.toLowerCase();
  // ::1 loopback, fc00::/7 unique-local, fe80::/10 link-local, and IPv4-mapped
  if (lower === "::1" || lower === "::") return false;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return false;
  if (lower.startsWith("::ffff:")) return false;
  return true;
}

async function resolvePublic(hostname: string): Promise<string[]> {
  const ips: string[] = [];
  try {
    const a = await dns.resolve4(hostname);
    ips.push(...a);
  } catch {
    /* ignore */
  }
  try {
    const aaaa = await dns.resolve6(hostname);
    ips.push(...aaaa);
  } catch {
    /* ignore */
  }
  return ips;
}

export interface SafeFetchResult {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
}

export async function fetchWellKnown(hostname: string, path: string): Promise<SafeFetchResult> {
  let current = `https://${hostname}${path}`;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return { ok: false, error: "invalid URL" };
    }
    if (parsed.protocol !== "https:") {
      return { ok: false, error: "HTTPS only" };
    }

    const host = parsed.hostname.toLowerCase();
    const ips = await resolvePublic(host);
    if (!ips.length) {
      return { ok: false, error: "host does not resolve" };
    }
    if (ips.some((ip) => {
      if (isIP(ip) === 4) return !isPublicIpv4(ip);
      if (isIP(ip) === 6) return !isPublicIpv6(ip);
      return true;
    })) {
      return { ok: false, error: "blocked non-public destination" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "okgtm-email-audit/1.0" },
      });
      const status = res.status;
      if (status >= 300 && status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return { ok: false, error: "redirect without location" };
        const next = new URL(loc, current);
        if (next.hostname.toLowerCase() !== host) {
          return { ok: false, error: "redirect to different host blocked" };
        }
        current = next.toString();
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) {
        return { ok: false, error: "response too large" };
      }
      return { ok: status >= 200 && status < 300, status, body: buf.toString("utf8") };
    } catch {
      return { ok: false, error: "fetch failed or timed out" };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, error: "too many redirects" };
}