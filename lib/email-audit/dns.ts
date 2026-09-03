/**
 * DNS resolver implementation.
 *
 * Primary transport: Node's built-in `dns/promises` (system resolver — free,
 * open-source, no external service) for A/AAAA/MX/TXT/CNAME/NS/PTR.
 *
 * DS/DNSKEY (DNSSEC records): `node:dns` cannot fetch these, so they go over
 * DNS-over-HTTPS to Cloudflare's FREE public resolver (cloudflare-dns.com).
 * This is not a commercial/paid DNS API — it is public free infrastructure —
 * and is only used for the two record types Node cannot resolve natively.
 * The DNSResolver interface keeps this swappable.
 *
 * Error mapping is strict: NXDOMAIN, SERVFAIL, TIMEOUT and network errors are
 * never conflated with "record absent".
 */

import dns from "node:dns/promises";
import type { DNSResolver, DNSResult } from "./types";

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

async function resolveListSafe(
  domain: string,
  type: "A" | "AAAA" | "CNAME" | "NS"
): Promise<DNSResult> {
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
    return answers.length
      ? resultOk("RECORD_FOUND", answers.map((a) => a.data))
      : resultOk("NO_RECORD", []);
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
