import type { CheckResult, DNSResult, DNSResolver, Evidence } from "../types";

/** Context handed to every check: the validated domain + shared root DNS. */
export interface AuditContext {
  domain: string; // ascii domain (already normalized/validated)
  resolver: DNSResolver;
  mx: DNSResult;
  txt: DNSResult;
  a: DNSResult;
  aaaa: DNSResult;
}

export function mkCheck(partial: Partial<CheckResult> & Pick<CheckResult, "id" | "category" | "title" | "summary">): CheckResult {
  return {
    status: "INFO",
    severity: "INFO",
    evidence: [],
    scoreImpact: 0,
    ...partial,
  };
}

export function ev(type: Evidence["type"], source: string, value?: string, explanation?: string): Evidence {
  return { type, source, value, explanation };
}

/** Build a DNS-evidence entry from a DNSResult + source label. */
export function dnsEvidence(source: string, result: DNSResult): Evidence[] {
  return [
    {
      type: "DNS_RECORD",
      source,
      value: result.values.join("\n") || result.status,
      explanation: `DNS status: ${result.status}`,
    },
  ];
}

export function foundOrAbsent(result: DNSResult): "found" | "absent" | "error" {
  if (result.status === "RECORD_FOUND") return "found";
  if (result.status === "NO_RECORD" || result.status === "NXDOMAIN") return "absent";
  return "error";
}
