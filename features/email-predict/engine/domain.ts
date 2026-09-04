/**
 * llms.txt validation probe for the Email Predictor's server-side MX check.
 * Pure engine logic (moved out of the API route): does this domain receive
 * mail at all, and via which hosts?
 */

import { NodeDNSResolver } from "@/lib/shared/dns";

export interface DomainMailInfo {
  mxPresent: boolean;
  mxHosts?: string[];
  /** Present when the check failed to get a clean answer. */
  mxStatus?: string;
}

/** `asciiDomain` must already be normalized + validated (see lib/shared/domain-input). */
export async function checkDomainMail(asciiDomain: string): Promise<DomainMailInfo> {
  const resolver = new NodeDNSResolver();
  const mx = await resolver.resolveMX(asciiDomain);
  if (mx.status === "RECORD_FOUND") {
    return { mxPresent: true, mxHosts: mx.values.map((v) => v.replace(/^\d+\s+/, "")).slice(0, 6) };
  }
  const unknown = mx.status === "TIMEOUT" || mx.status === "SERVFAIL" || mx.status === "NETWORK_ERROR";
  return { mxPresent: false, mxStatus: unknown ? mx.status : "no MX records" };
}
