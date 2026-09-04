import type { CheckResult } from "../types";
import { mkCheck, ev, type AuditContext } from "./helpers";
import { parseDmarcRecord, dmarcEffectiveTags } from "../parsers/dmarc";

const COMMON_SELECTORS = [
  "default", "google", "selector1", "selector2", "s1", "s2", "k1", "k2",
  "dkim", "mail", "email", "sendgrid", "mandrill", "ces", "protonmail2",
];

/** Normalize a DKIM TXT value into a readable policy line. */
function describeDkimValue(value: string): string {
  return value.slice(0, 300);
}

async function discoverDkim(
  ctx: AuditContext,
  selectors: string[]
): Promise<{ selector: string; value: string; viaCname: boolean } | null> {
  for (const sel of selectors) {
    const name = `${sel}._domainkey.${ctx.domain}`;
    const txt = await ctx.resolver.resolveTXT(name);
    const txtVal = txt.values.find((v) => /^v\s*=\s*DKIM1/i.test(v));
    if (txtVal) return { selector: sel, value: txtVal, viaCname: false };
    if (txt.status === "RECORD_FOUND") {
      // TXT exists but not a DKIM record — not a hit
    }
    const cname = await ctx.resolver.resolveCNAME(name);
    if (cname.status === "RECORD_FOUND") {
      const target = cname.values[0] ?? "";
      const t2 = await ctx.resolver.resolveTXT(target);
      const v = t2.values.find((x) => /^v\s*=\s*DKIM1/i.test(x));
      if (v) return { selector: sel, value: v, viaCname: true };
    }
  }
  return null;
}

export async function dkimCheck(ctx: AuditContext, providerSelectors: string[]): Promise<CheckResult> {
  const selectors = [...new Set([...COMMON_SELECTORS, ...providerSelectors])];
  const found = await discoverDkim(ctx, selectors);

  if (found) {
    const malformed = !/^v\s*=\s*DKIM1\s*;/i.test(found.value);
    if (malformed) {
      return mkCheck({
        id: "dkim",
        category: "DKIM",
        status: "FAIL",
        severity: "MEDIUM",
        title: `DKIM selector "${found.selector}" exists but appears malformed`,
        summary: "A DKIM record was found, but its value does not look like a valid v=DKIM1 record.",
        evidence: [
          ev("DNS_RECORD", `${found.selector}._domainkey.${ctx.domain} ${found.viaCname ? "(via CNAME)" : "TXT"}`, describeDkimValue(found.value)),
        ],
        recommendation: "Verify the DKIM record published by your sending platform.",
        scoreImpact: 15,
      });
    }
    return mkCheck({
      id: "dkim",
      category: "DKIM",
      status: "PASS",
      severity: "INFO",
      title: `DKIM selector discovered (${found.selector})`,
      summary: "A DKIM public key is published and looks valid.",
      evidence: [
        ev("DNS_RECORD", `${found.selector}._domainkey.${ctx.domain} ${found.viaCname ? "(via CNAME)" : "TXT"}`, describeDkimValue(found.value)),
      ],
      scoreImpact: 15,
    });
  }

  // No known selector discovered — must NOT claim DKIM is missing
  return mkCheck({
    id: "dkim",
    category: "DKIM",
    status: "INFO",
    severity: "INFO",
    title: "No common DKIM selector discovered",
    summary:
      "None of the well-known DKIM selectors resolved to a valid key. This does NOT prove DKIM is absent — a sender can use a private selector.",
    evidence: [
      ev("DERIVED", "dkim-selectors", selectors.join(", "), "Selectors probed"),
    ],
    recommendation:
      "Ask your email-sending platform which DKIM selector it uses, then publish its public key at <selector>._domainkey.<domain>.",
  });
}

export async function dmarcChecks(ctx: AuditContext): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  const dmarcName = `_dmarc.${ctx.domain}`;
  const txt = await ctx.resolver.resolveTXT(dmarcName);

  const errStatus =
    txt.status === "TIMEOUT" || txt.status === "SERVFAIL" || txt.status === "NETWORK_ERROR";

  if (errStatus) {
    out.push(
      mkCheck({
        id: "dmarc",
        category: "DMARC",
        status: "UNKNOWN",
        severity: "INFO",
        title: "DMARC could not be checked",
        summary: "DNS resolution failed while checking DMARC. Configuration cannot be determined reliably.",
        evidence: [{ type: "DNS_RECORD", source: `${dmarcName} TXT`, value: txt.status }],
      })
    );
    return out;
  }

  const dmarcRecord = txt.values.find((v) => v.trim().toLowerCase().startsWith("v=dmarc1"));
  const hasAnyTxt = txt.status === "RECORD_FOUND";

  if (!dmarcRecord) {
    out.push(
      mkCheck({
        id: "dmarc",
        category: "DMARC",
        status: "FAIL",
        severity: "CRITICAL",
        title: "No DMARC policy detected",
        summary: "No valid v=DMARC1 record was found at _dmarc." + ctx.domain + ".",
        evidence: [{ type: "DNS_RECORD", source: `${dmarcName} TXT`, value: txt.values.join("\n") || (hasAnyTxt ? "TXT present, no DMARC" : "no TXT") }],
        recommendation:
          "Publish a DMARC record. Start in monitoring mode (p=none) with rua= pointing at an address you control, then move toward enforcement once you understand your sending.",
        exactFix: {
          recordType: "TXT",
          hostname: `_dmarc.${ctx.domain}`,
          value: "v=DMARC1; p=none; rua=mailto:dmarc@REPLACE-WITH-YOUR-DOMAIN",
          instructions:
            "Add a TXT record at _dmarc.<your-domain>. Replace the rua address with a real mailbox you control. Do not publish p=reject until monitoring shows only legitimate mail fails alignment.",
        },
        scoreImpact: 12,
      })
    );
    return out;
  }

  const parsed = parseDmarcRecord(dmarcRecord);
  const eff = dmarcEffectiveTags(parsed.tags);

  if (!parsed.valid) {
    out.push(
      mkCheck({
        id: "dmarc",
        category: "DMARC",
        status: "FAIL",
        severity: "HIGH",
        title: "DMARC record is malformed",
        summary: `The DMARC record failed to parse: ${parsed.errors.join("; ")}`,
        evidence: [ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record")],
        recommendation: "Correct the DMARC tags. A malformed record provides no enforcement.",
        scoreImpact: 12,
      })
    );
  } else {
    // Policy classification
    if (eff.p === "none") {
      out.push(
        mkCheck({
          id: "dmarc",
          category: "DMARC",
          status: "WARN",
          severity: "MEDIUM",
          title: "DMARC is in monitoring mode (p=none)",
          summary: "p=none collects reports but does not enforce quarantine or rejection.",
          evidence: [ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record")],
          recommendation:
            "Review aggregate reports, confirm legitimate senders align, then move to p=quarantine and eventually p=reject.",
          scoreImpact: 8,
        })
      );
    } else if (eff.p === "quarantine") {
      out.push(
        mkCheck({
          id: "dmarc",
          category: "DMARC",
          status: "WARN",
          severity: "LOW",
          title: "DMARC enforcement: quarantine",
          summary: "Receivers are asked to quarantine messages that fail DMARC. Consider p=reject once confident.",
          evidence: [ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record")],
          scoreImpact: 8,
        })
      );
    } else {
      out.push(
        mkCheck({
          id: "dmarc",
          category: "DMARC",
          status: "PASS",
          severity: "INFO",
          title: "DMARC enforcement: reject",
          summary: "A strong enforcement policy is published.",
          evidence: [ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record")],
          scoreImpact: 8,
        })
      );
    }

    // Subdomain policy
    if (parsed.tags.sp && parsed.tags.sp !== eff.p) {
      out.push(
        mkCheck({
          id: "dmarc-subdomain",
          category: "DMARC",
          status: "INFO",
          severity: "INFO",
          title: `Subdomain policy differs (sp=${parsed.tags.sp})`,
          summary: `Subdomains use sp=${parsed.tags.sp} while the root uses p=${eff.p}. Verify this is intentional.`,
          evidence: [ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record")],
        })
      );
    }

    // Reporting
    out.push(
      mkCheck({
        id: "dmarc-reporting",
        category: "DMARC",
        status: parsed.tags.rua ? "PASS" : "WARN",
        severity: "INFO",
        title: parsed.tags.rua ? "DMARC aggregate reporting configured" : "DMARC aggregate reporting not configured",
        summary: parsed.tags.rua
          ? `Aggregate reports: configured (${shortUris(parsed.tags.rua)}).`
          : "Without rua= you receive no aggregate reports, making it harder to see who is failing alignment.",
        evidence: [ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record")],
        recommendation: parsed.tags.rua ? undefined : "Add rua=mailto:<your-mailbox> to receive aggregate reports.",
        scoreImpact: 2,
      })
    );

    // Alignment configuration (adkim/aspf) — never claim actual alignment
    out.push(
      mkCheck({
        id: "alignment-config",
        category: "DMARC Alignment",
        status: "INFO",
        severity: "INFO",
        title: `DMARC alignment configuration (adkim=${eff.adkim}, aspf=${eff.aspf})`,
        summary:
          "Relaxed (r) alignment allows subdomains of the signing domain; strict (s) requires an exact match. Actual message alignment cannot be verified without observing a real outbound message.",
        evidence: [
          ev("DNS_RECORD", `${dmarcName} TXT`, dmarcRecord, "Raw DMARC record"),
          ev("DERIVED", "alignment", `adkim=${eff.adkim}; aspf=${eff.aspf}`, "Configured alignment modes"),
        ],
        scoreImpact: 10,
      })
    );
  }

  return out;
}

function shortUris(uris: string): string {
  return uris.split(",").slice(0, 2).join(", ");
}
