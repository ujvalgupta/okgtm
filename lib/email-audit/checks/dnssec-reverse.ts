import type { CheckResult } from "../types";
import { mkCheck, ev, type AuditContext } from "./helpers";

export async function dnssecCheck(ctx: AuditContext): Promise<CheckResult> {
  const ds = await ctx.resolver.resolveDS(ctx.domain);
  const dnsKey = await ctx.resolver.resolveDNSKEY(ctx.domain);

  if (
    ds.status === "TIMEOUT" || ds.status === "SERVFAIL" || ds.status === "NETWORK_ERROR" ||
    dnsKey.status === "TIMEOUT" || dnsKey.status === "SERVFAIL" || dnsKey.status === "NETWORK_ERROR"
  ) {
    return mkCheck({
      id: "dnssec",
      category: "DNSSEC",
      status: "UNKNOWN",
      severity: "INFO",
      title: "DNSSEC status could not be determined",
      summary: "DNSSEC records could not be resolved reliably (DS/DNSKEY lookup failed).",
      evidence: [
        ev("DNS_RECORD", `${ctx.domain} DS`, ds.status),
        ev("DNS_RECORD", `${ctx.domain} DNSKEY`, dnsKey.status),
      ],
    });
  }

  const dsPresent = ds.status === "RECORD_FOUND";
  const keyPresent = dnsKey.status === "RECORD_FOUND";

  if (dsPresent && !keyPresent) {
    return mkCheck({
      id: "dnssec",
      category: "DNSSEC",
      status: "FAIL",
      severity: "LOW",
      title: "DNSSEC appears broken",
      summary: "A DS record exists in the parent zone but no DNSKEY was found at the domain — signatures would fail.",
      evidence: [ev("DNS_RECORD", `${ctx.domain} DS`, ds.values.join("\n"))],
      recommendation: "Ask your DNS provider to fix DNSSEC signing.",
      scoreImpact: 3,
    });
  }

  return mkCheck({
    id: "dnssec",
    category: "DNSSEC",
    status: dsPresent && keyPresent ? "PASS" : "INFO",
    severity: "INFO",
    title: dsPresent && keyPresent ? "DNSSEC enabled" : "DNSSEC not enabled",
    summary:
      dsPresent && keyPresent
        ? "The zone is signed and the parent has a DS record."
        : "DNSSEC is not enabled. This is a domain-security signal, not an email-authentication requirement.",
    evidence: [
      ...(dsPresent ? [ev("DNS_RECORD", `${ctx.domain} DS`, ds.values.join("\n"))] : []),
      ...(keyPresent ? [ev("DNS_RECORD", `${ctx.domain} DNSKEY`, dnsKey.values.slice(0, 3).join("\n"))] : []),
    ],
    scoreImpact: 3,
  });
}

export async function reverseDnsCheck(ctx: AuditContext): Promise<CheckResult> {
  const hostIps: string[] = [...ctx.a.values, ...ctx.aaaa.values];
  if (!hostIps.length) {
    return mkCheck({
      id: "reverse-dns",
      category: "Networking",
      status: "INFO",
      severity: "INFO",
      title: "No A/AAAA records for domain",
      summary: "The domain does not resolve to an IPv4/IPv6 address, so reverse DNS could not be assessed.",
      evidence: [],
    });
  }

  const ptrResults: { ip: string; host?: string }[] = [];
  for (const ip of hostIps.slice(0, 4)) {
    const ptr = await ctx.resolver.resolvePTR(ip);
    if (ptr.status === "RECORD_FOUND") ptrResults.push({ ip, host: ptr.values[0] });
    else ptrResults.push({ ip });
  }

  const withPtr = ptrResults.filter((p) => p.host);

  if (!withPtr.length) {
    return mkCheck({
      id: "reverse-dns",
      category: "Networking",
      status: "INFO",
      severity: "INFO",
      title: "No reverse DNS on the domain's hosting IPs",
      summary:
        "The IPs this domain resolves to have no PTR records. This usually does NOT affect outbound mail unless those IPs are actual sending servers.",
      evidence: ptrResults.map((p) => ev("DNS_RECORD", `${p.ip} PTR`, p.host ?? "no PTR")),
    });
  }

  return mkCheck({
    id: "reverse-dns",
    category: "Networking",
    status: "INFO",
    severity: "INFO",
    title: "Reverse DNS present on hosting IPs",
    summary:
      "Reverse DNS resolves for the domain's hosting IP(s). This is informational — the website IP is not necessarily the outbound mail server, so this alone says nothing about mail-server reputation.",
    evidence: withPtr.map((p) => ev("DNS_RECORD", `${p.ip} PTR`, p.host)),
  });
}
