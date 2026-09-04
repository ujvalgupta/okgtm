import type { CheckResult } from "../types";
import { mkCheck, ev, type AuditContext } from "./helpers";
import { fetchWellKnown } from "../../shared/http";

/** BIMI (optional, low weight) */
export async function bimiCheck(ctx: AuditContext): Promise<CheckResult> {
  const name = `default._bimi.${ctx.domain}`;
  const txt = await ctx.resolver.resolveTXT(name);
  const record = txt.values.find((v) => v.trim().toLowerCase().startsWith("v=bimi1"));

  if (txt.status === "TIMEOUT" || txt.status === "SERVFAIL" || txt.status === "NETWORK_ERROR") {
    return mkCheck({
      id: "bimi",
      category: "Brand Indicators",
      status: "UNKNOWN",
      severity: "INFO",
      title: "BIMI could not be checked",
      summary: "DNS resolution failed while checking BIMI.",
      evidence: [{ type: "DNS_RECORD", source: `${name} TXT`, value: txt.status }],
    });
  }

  if (record) {
    const hasLogo = /(^|;)\s*l=/i.test(record);
    const hasAuth = /(^|;)\s*a=/i.test(record);
    return mkCheck({
      id: "bimi",
      category: "Brand Indicators",
      status: hasLogo && hasAuth ? "PASS" : "WARN",
      severity: "INFO",
      title: "BIMI record present",
      summary: hasLogo && hasAuth
        ? "A BIMI record with logo and authority references is published."
        : "A BIMI record exists but is missing the logo (l=) or authority (a=) field.",
      evidence: [ev("DNS_RECORD", `${name} TXT`, record, "Raw BIMI record")],
      scoreImpact: 2,
    });
  }

  return mkCheck({
    id: "bimi",
    category: "Brand Indicators",
    status: "INFO",
    severity: "INFO",
    title: "No BIMI record",
    summary: "BIMI is optional. It only affects the branded-avatar indicator and does not affect authentication.",
    evidence: [{ type: "DNS_RECORD", source: `${name} TXT`, value: txt.values.join("\n") || "no record" }],
  });
}

/** TLS-RPT (optional, low weight) */
export async function tlsRptCheck(ctx: AuditContext): Promise<CheckResult> {
  const name = `_smtp._tls.${ctx.domain}`;
  const txt = await ctx.resolver.resolveTXT(name);
  const record = txt.values.find((v) => v.trim().toLowerCase().startsWith("v=tlsrptv1"));

  if (txt.status === "TIMEOUT" || txt.status === "SERVFAIL" || txt.status === "NETWORK_ERROR") {
    return mkCheck({
      id: "tls-rpt",
      category: "Transport Security",
      status: "UNKNOWN",
      severity: "INFO",
      title: "TLS-RPT could not be checked",
      summary: "DNS resolution failed while checking TLS-RPT.",
      evidence: [{ type: "DNS_RECORD", source: `${name} TXT`, value: txt.status }],
    });
  }

  if (record) {
    const hasRua = /(^|;)\s*rua=/i.test(record);
    return mkCheck({
      id: "tls-rpt",
      category: "Transport Security",
      status: hasRua ? "PASS" : "WARN",
      severity: "INFO",
      title: "TLS-RPT record present",
      summary: hasRua
        ? "TLS-RPT reporting is configured."
        : "A TLS-RPT record exists but has no rua= reporting address.",
      evidence: [ev("DNS_RECORD", `${name} TXT`, record, "Raw TLS-RPT record")],
      scoreImpact: 3,
    });
  }

  return mkCheck({
    id: "tls-rpt",
    category: "Transport Security",
    status: "INFO",
    severity: "INFO",
    title: "No TLS-RPT record",
    summary: "TLS-RPT is optional reporting; absence does not indicate a broken email system.",
    evidence: [{ type: "DNS_RECORD", source: `${name} TXT`, value: "no record" }],
  });
}

/** MTA-STS (DNS + optional HTTPS policy fetch, SSRF-safe) */
export async function mtaStsCheck(ctx: AuditContext): Promise<CheckResult> {
  const name = `_mta-sts.${ctx.domain}`;
  const txt = await ctx.resolver.resolveTXT(name);
  const record = txt.values.find((v) => v.trim().toLowerCase().startsWith("v=stsv1"));

  if (txt.status === "TIMEOUT" || txt.status === "SERVFAIL" || txt.status === "NETWORK_ERROR") {
    return mkCheck({
      id: "mta-sts",
      category: "Transport Security",
      status: "UNKNOWN",
      severity: "INFO",
      title: "MTA-STS could not be checked",
      summary: "DNS resolution failed while checking MTA-STS.",
      evidence: [{ type: "DNS_RECORD", source: `${name} TXT`, value: txt.status }],
    });
  }

  if (!record) {
    return mkCheck({
      id: "mta-sts",
      category: "Transport Security",
      status: "WARN",
      severity: "MEDIUM",
      title: "MTA-STS not configured",
      summary:
        "No MTA-STS policy is published. Opportunistic TLS still applies, but strict transport is not enforced for inbound mail.",
      evidence: [{ type: "DNS_RECORD", source: `${name} TXT`, value: "no record" }],
      recommendation:
        "Publish an MTA-STS policy if you want receiving servers to enforce TLS when connecting to your MX hosts.",
      scoreImpact: 5,
    });
  }

  const hasId = /(^|;)\s*id=/i.test(record);
  const parsed = /v\s*=\s*STSv1\s*;\s*id\s*=\s*([^;]+)/i.exec(record);

  // Fetch the HTTPS policy (SSRF-safe)
  const https = await fetchWellKnown(`mta-sts.${ctx.domain}`, "/.well-known/mta-sts.txt");

  if (!hasId) {
    return mkCheck({
      id: "mta-sts",
      category: "Transport Security",
      status: "FAIL",
      severity: "MEDIUM",
      title: "MTA-STS policy record missing id= field",
      summary: "The _mta-sts TXT record is present but has no id= value.",
      evidence: [ev("DNS_RECORD", `${name} TXT`, record, "Raw MTA-STS record")],
      scoreImpact: 5,
    });
  }

  if (!https.ok) {
    return mkCheck({
      id: "mta-sts",
      category: "Transport Security",
      status: "FAIL",
      severity: "MEDIUM",
      title: "MTA-STS policy not reachable over HTTPS",
      summary: `The discovery TXT record exists (id=${parsed?.[1]?.trim() ?? "?"}) but https://mta-sts.${ctx.domain}/.well-known/mta-sts.txt could not be retrieved${https.error ? ` (${https.error})` : ""}.`,
      evidence: [
        ev("DNS_RECORD", `${name} TXT`, record, "Raw MTA-STS record"),
        ev("HTTP_RESPONSE", `https://mta-sts.${ctx.domain}/.well-known/mta-sts.txt`, https.error ?? `HTTP ${https.status}`),
      ],
      recommendation: "Publish the policy file over HTTPS at mta-sts.<domain>/.well-known/mta-sts.txt.",
      scoreImpact: 5,
    });
  }

  // Validate policy content basics
  const policy = https.body ?? "";
  const hasVersion = /^\s*version\s*:\s*STSv1\s*$/im.test(policy);
  const mode = /^\s*mode\s*:\s*(\S+)\s*$/im.exec(policy);
  const hasMode = !!mode;
  const modeVal = mode?.[1]?.toLowerCase();

  if (!hasVersion || !hasMode) {
    return mkCheck({
      id: "mta-sts",
      category: "Transport Security",
      status: "FAIL",
      severity: "MEDIUM",
      title: "MTA-STS policy file is malformed",
      summary: "The policy file is missing required version: STSv1 or mode: fields.",
      evidence: [
        ev("DNS_RECORD", `${name} TXT`, record, "Raw MTA-STS record"),
        ev("HTTP_RESPONSE", `https://mta-sts.${ctx.domain}/.well-known/mta-sts.txt`, policy.slice(0, 500), "Retrieved policy"),
      ],
      scoreImpact: 5,
    });
  }

  const status = modeVal === "enforce" ? "PASS" : modeVal === "testing" ? "WARN" : "INFO";
  const severity = status === "PASS" ? "INFO" : status === "WARN" ? "LOW" : "INFO";
  return mkCheck({
    id: "mta-sts",
    category: "Transport Security",
    status,
    severity,
    title: `MTA-STS policy present (mode: ${modeVal})`,
    summary:
      modeVal === "enforce"
        ? "Strict TLS is enforced for inbound mail to your MX hosts."
        : modeVal === "testing"
          ? "MTA-STS is in testing mode — reports only, no enforcement yet."
          : "MTA-STS is published but mode is none, which disables enforcement.",
    evidence: [
      ev("DNS_RECORD", `${name} TXT`, record, "Raw MTA-STS record"),
      ev("HTTP_RESPONSE", `https://mta-sts.${ctx.domain}/.well-known/mta-sts.txt`, policy.slice(0, 500), "Retrieved policy"),
    ],
    scoreImpact: 5,
  });
}
