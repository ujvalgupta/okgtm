/**
 * Resolver decorator that caches every record lookup keyed by
 * `type|name`, shared across all checks in one audit and across audits.
 */

import type { DNSResolver, DNSResult } from "./types";
import type { DNSCache } from "./cache";

export class NodeSafeResolver implements DNSResolver {
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
