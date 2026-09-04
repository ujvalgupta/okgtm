/**
 * DNS access layer shared by the email-audit engine and the Email Predictor:
 * the resolver contract, a Node + free public DoH resolver, a caching
 * decorator, and the failure-aware cache. Everything that talks DNS lives
 * here once.
 */

import dns from "node:dns/promises";
import { TtlCache } from "./cache";

/* ── Types ─────────────────────────────────────────────────────────────── */

export type DNSRecordStatus =
  | "RECORD_FOUND"
  | "NO_RECORD"
  | "NXDOMAIN"
  | "SERVFAIL"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface DNSResult {
  status: DNSRecordStatus;
  /** Answers normalized to strings (hostnames, IPs, raw TXT strings). */
  values: string[];
  /** Raw-ish detail for the technical-evidence panel. */
  raw?: unknown;
}

/** Transport-agnostic resolver so the backend can swap DNS providers. */
export interface DNSResolver {
  resolveA(domain: string): Promise<DNSResult>;
  resolveAAAA(domain: string): Promise<DNSResult>;
  resolveMX(domain: string): Promise<DNSResult>;
  resolveTXT(domain: string): Promise<DNSResult>;
  resolveCNAME(domain: string): Promise<DNSResult>;
  resolveNS(domain: string): Promise<DNSResult>;
  resolvePTR(ip: string): Promise<DNSResult>;
  resolveDS(domain: string): Promise<DNSResult>;
  resolveDNSKEY(domain: string): Promise<DNSResult>;
}

/* ── Node resolver ─────────────────────────────────────────────────────── */

/**
 * Node's built-in `dns/promises` (system resolver — free, no external
 * service) for A/AAAA/MX/TXT/CNAME/NS/PTR. DS/DNSKEY (DNSSEC records) go over
 * DNS-over-HTTPS to Cloudflare's free public resolver because `node:dns`
 * cannot fetch them; this is public infrastructure, not a paid API, and only
 * used for the two record types Node cannot resolve natively.
 *
 * Error mapping is strict: NXDOMAIN, SERVFAIL, TIMEOUT and network errors are
 * never conflated with "record absent".
 */

const DOH_JSON = "https://cloudflare-dns.com/dns-query";
const DOH_TIMEOUT_MS = 5000;

function mapNodeError(err: unknown): DNSResult {
  const code = (err as NodeJS.ErrnoException)?.code;
  if (code === "ENOTFOUND") return { status: "NXDOMAIN", values: [] };
  if (code === "ENODATA") return { status: "NO_RECORD", values: [] };
  if (code === "ETIMEOUT") return { status: "TIMEOUT", values: [] };
  if (code === "SERVFAIL" || code === "FORMERR" || code === "REFUSED" || code === "NOTIMP") {
    return { status: "SERVFAIL", values: [] };
  }
  return { status: "NETWORK_ERROR", values: [] };
}

function resultOk(status: "RECORD_FOUND" | "NO_RECORD" | "NXDOMAIN", values: string[]): DNSResult {
  return { status, values };
}

async function resolveTxtSafe(domain: string): Promise<DNSResult> {
  try {
    const records = await dns.resolveTxt(domain);
    // node returns arrays of string-chunks per record; join them
    const joined = records.map((chunks) => chunks.join(""));
    return joined.length ? resultOk("RECORD_FOUND", joined) : resultOk("NO_RECORD", []);
  } catch (err) {
    return mapNodeError(err);
  }
}

async function resolveListSafe(domain: string, type: "A" | "AAAA" | "CNAME" | "NS"): Promise<DNSResult> {
  try {
    const records = await dns.resolve(domain, type);
    return records.length ? resultOk("RECORD_FOUND", records as string[]) : resultOk("NO_RECORD", []);
  } catch (err) {
    return mapNodeError(err);
  }
}

async function resolveMXSafe(domain: string): Promise<DNSResult> {
  try {
    const records = await dns.resolveMx(domain);
    if (!records.length) return resultOk("NO_RECORD", []);
    const sorted = [...records].sort((a, b) => a.priority - b.priority);
    return resultOk("RECORD_FOUND", sorted.map((r) => `${r.priority} ${r.exchange}`));
  } catch (err) {
    return mapNodeError(err);
  }
}

async function resolvePTRSafe(ip: string): Promise<DNSResult> {
  try {
    const hostnames = await dns.reverse(ip);
    return hostnames.length ? resultOk("RECORD_FOUND", hostnames) : resultOk("NO_RECORD", []);
  } catch (err) {
    return mapNodeError(err);
  }
}

interface DoHResponse {
  Status?: number;
  Answer?: { type: number; data: string }[];
}

/** DS/DNSKEY only — free public DoH resolver. */
async function resolveDoH(domain: string, type: "DS" | "DNSKEY"): Promise<DNSResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS);
  try {
    const url = `${DOH_JSON}?name=${encodeURIComponent(domain)}&type=${type}`;
    const res = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: controller.signal,
    });
    if (!res.ok) return { status: "NETWORK_ERROR", values: [] };
    const data = (await res.json()) as DoHResponse;
    const status = data.Status;
    if (status === 3) return resultOk("NXDOMAIN", []);
    if (status !== 0) return { status: "SERVFAIL", values: [] };
    const answers = (data.Answer ?? []).filter((a) => a.type === (type === "DS" ? 43 : 48));
    return answers.length ? resultOk("RECORD_FOUND", answers.map((a) => a.data)) : resultOk("NO_RECORD", []);
  } catch {
    return { status: "TIMEOUT", values: [] };
  } finally {
    clearTimeout(timer);
  }
}

export class NodeDNSResolver implements DNSResolver {
  resolveA(d: string) {
    return resolveListSafe(d, "A");
  }
  resolveAAAA(d: string) {
    return resolveListSafe(d, "AAAA");
  }
  resolveMX(d: string) {
    return resolveMXSafe(d);
  }
  resolveTXT(d: string) {
    return resolveTxtSafe(d);
  }
  resolveCNAME(d: string) {
    return resolveListSafe(d, "CNAME");
  }
  resolveNS(d: string) {
    return resolveListSafe(d, "NS");
  }
  resolvePTR(ip: string) {
    return resolvePTRSafe(ip);
  }
  resolveDS(d: string) {
    return resolveDoH(d, "DS");
  }
  resolveDNSKEY(d: string) {
    return resolveDoH(d, "DNSKEY");
  }
}

/* ── Cache + caching decorator ─────────────────────────────────────────── */

/**
 * Short-lived in-memory DNS cache: successful answers get a 5-15 min TTL;
 * failures (SERVFAIL/TIMEOUT/NETWORK_ERROR) a short TTL so a hiccup is not
 * remembered for long. Per-process (VPS); per-instance on Vercel — fine v1.
 */

const GOOD_TTL_MS = 10 * 60_000;
const FAIL_TTL_MS = 30_000;

export class DNSCache {
  private store = new TtlCache<DNSResult>(GOOD_TTL_MS);

  get(key: string): DNSResult | undefined {
    return this.store.get(key);
  }

  set(key: string, result: DNSResult): void {
    const isFailure =
      result.status === "SERVFAIL" ||
      result.status === "TIMEOUT" ||
      result.status === "NETWORK_ERROR";
    this.store.set(key, result, isFailure ? FAIL_TTL_MS : GOOD_TTL_MS);
  }
}

/**
 * Resolver decorator that caches every record lookup keyed by `type|name`,
 * shared across all checks in one audit and across audits.
 */
export class CachedResolver implements DNSResolver {
  constructor(
    private inner: DNSResolver,
    private cache: DNSCache
  ) {}

  private async cached(type: string, name: string, fn: () => Promise<DNSResult>): Promise<DNSResult> {
    const key = `${type}|${name.toLowerCase()}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const result = await fn();
    this.cache.set(key, result);
    return result;
  }

  resolveA(d: string) {
    return this.cached("A", d, () => this.inner.resolveA(d));
  }
  resolveAAAA(d: string) {
    return this.cached("AAAA", d, () => this.inner.resolveAAAA(d));
  }
  resolveMX(d: string) {
    return this.cached("MX", d, () => this.inner.resolveMX(d));
  }
  resolveTXT(d: string) {
    return this.cached("TXT", d, () => this.inner.resolveTXT(d));
  }
  resolveCNAME(d: string) {
    return this.cached("CNAME", d, () => this.inner.resolveCNAME(d));
  }
  resolveNS(d: string) {
    return this.cached("NS", d, () => this.inner.resolveNS(d));
  }
  resolvePTR(ip: string) {
    return this.cached("PTR", ip, () => this.inner.resolvePTR(ip));
  }
  resolveDS(d: string) {
    return this.cached("DS", d, () => this.inner.resolveDS(d));
  }
  resolveDNSKEY(d: string) {
    return this.cached("DNSKEY", d, () => this.inner.resolveDNSKEY(d));
  }
}
