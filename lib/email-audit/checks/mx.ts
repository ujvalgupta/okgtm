import type { CheckResult } from "../types";
import { mkCheck, ev, foundOrAbsent, dnsEvidence, type AuditContext } from "./helpers";

const KNOWN_PROVIDERS: { hosts: string[]; name: string }[] = [
  { hosts: ["aspmx.l.google.com", "google.com"], name: "Google Workspace" },
  { hosts: ["protection.outlook.com", "mail.protection.outlook.com"], name: "Microsoft 365" },
  { hosts: ["mx1.mailchannels.net"], name: "MailChannels" },
  { hosts: ["mx.zoho.com", "zoho.com"], name: "Zoho Mail" },
  { hosts: ["mx1.emailsrvr.com"], name: "Rackspace" },
  { hosts: ["fastmail"], name: "Fastmail" },
  { hosts: ["us2.mx"], name: "US2 (unknown)" },
];

export function inferProviderFromMx(mxValues: string[]): { name: string; evidence: string[] } | null {
  for (const line of mxValues) {
    const host = line.split(/\s+/)[1] ?? "";
    for (const p of KNOWN_PROVIDERS) {
      if (p.hosts.some((h) => host === h || host.endsWith("." + h))) {
        return { name: p.name, evidence: [`MX host: ${host}`] };
      }
    }
  }
  // Heuristic fallbacks
  if (mxValues.some((l) => /google/i.test(l))) return { name: "Google Workspace", evidence: ["Google-style MX host"] };
  if (mxValues.some((l) => /outlook|protection\.outlook/i.test(l))) return { name: "Microsoft 365", evidence: ["Microsoft MX host"] };
  return null;
}

export async function mxCheck(ctx: AuditContext): Promise<CheckResult> {
  const { mx } = ctx;
  const found = foundOrAbsent(mx);

  if (found === "error") {
    return mkCheck({
      id: "mx",
      category: "Mail Infrastructure",
      status: "UNKNOWN",
      severity: "INFO",
      title: "MX lookup failed",
      summary: "DNS resolution failed while checking MX records.",
      evidence: dnsEvidence(`${ctx.domain} MX`, mx),
    });
  }

  if (found === "absent") {
    return mkCheck({
      id: "mx",
      category: "Mail Infrastructure",
      status: "WARN",
      severity: "MEDIUM",
      title: "No MX records found",
      summary:
        "No MX records were found. MX controls where inbound mail is routed. This is not, by itself, proof that outbound email cannot be sent.",
      evidence: dnsEvidence(`${ctx.domain} MX`, mx),
      recommendation:
        "If you want to receive email at this domain, add MX records pointing to your mail provider. If you only send email, MX absence does not block sending.",
      scoreImpact: 5,
    });
  }

  const lines = mx.values;
  const provider = inferProviderFromMx(lines);

  // Basic broken-target check: MX pointing at an IP or a bare missing host
  const suspicious = lines.filter((l) => {
    const host = l.split(/\s+/)[1] ?? "";
    return host === "." || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  });

  if (suspicious.length) {
    return mkCheck({
      id: "mx",
      category: "Mail Infrastructure",
      status: "FAIL",
      severity: "HIGH",
      title: "MX records point to invalid targets",
      summary: "One or more MX targets appear broken (null MX or an IP address).",
      evidence: [
        ...dnsEvidence(`${ctx.domain} MX`, mx),
        ev("DERIVED", "mx-parse", suspicious.join("\n"), "Suspicious MX targets"),
      ],
      recommendation: "Remove null or IP-based MX entries; point MX at your mail provider's hostnames.",
      scoreImpact: 5,
    });
  }

  return mkCheck({
    id: "mx",
    category: "Mail Infrastructure",
    status: "PASS",
    severity: "INFO",
    title: provider ? `${provider.name} detected` : "MX records configured",
    summary: provider
      ? `Mail infrastructure detected (${provider.name}). ${lines.length} MX record(s) found.`
      : `${lines.length} MX record(s) found. Inbound mail routing is configured.`,
    evidence: dnsEvidence(`${ctx.domain} MX`, mx),
    scoreImpact: 5,
  });
}
