import type { CheckResult } from "../types";
import { mkCheck, ev, dnsEvidence, type AuditContext } from "./helpers";
import {
  parseSpfRecord,
  findSpfRecord,
  extractSpfRecords,
  analyzeSpfLookups,
} from "../parsers/spf";

/**
 * SPF area: existence, multiple-record, syntax, `all` mechanism, and the
 * recursive DNS-lookup count. Uses the shared root TXT fetch from context.
 */
export async function spfChecks(ctx: AuditContext): Promise<CheckResult[]> {
  const { txt } = ctx;
  const out: CheckResult[] = [];
  const spfRecords = extractSpfRecords(txt.values);
  const single = findSpfRecord(txt.values);

  // UNKNOWN when DNS itself failed
  if (txt.status === "TIMEOUT" || txt.status === "SERVFAIL" || txt.status === "NETWORK_ERROR") {
    out.push(
      mkCheck({
        id: "spf",
        category: "SPF",
        status: "UNKNOWN",
        severity: "INFO",
        title: "SPF could not be checked",
        summary: "DNS resolution failed while checking the SPF record.",
        evidence: dnsEvidence(`${ctx.domain} TXT`, txt),
      })
    );
    return out;
  }

  // Existence
  if (!single) {
    out.push(
      mkCheck({
        id: "spf",
        category: "SPF",
        status: "FAIL",
        severity: "HIGH",
        title: "No SPF record found",
        summary: "No v=spf1 policy was published for this domain.",
        evidence: dnsEvidence(`${ctx.domain} TXT`, txt),
        recommendation:
          "Publish a single SPF record. Start conservatively and include every service that sends mail as you as an include: or ip4: mechanism.",
        exactFix: {
          recordType: "TXT",
          hostname: ctx.domain,
          value: "v=spf1 -all",
          instructions:
            "Add a TXT record at the root of your domain. Begin with v=spf1 -all and add includes for each real sending service — see the SPF remediation warning below.",
        },
        scoreImpact: 6,
      })
    );
  } else {
    // Multiple SPF records
    if (spfRecords.length > 1) {
      out.push(
        mkCheck({
          id: "spf",
          category: "SPF",
          status: "FAIL",
          severity: "HIGH",
          title: "Multiple SPF records detected",
          summary: "SPF requires a single policy record; multiple v=spf1 records are invalid.",
          evidence: [
            ...dnsEvidence(`${ctx.domain} TXT`, txt),
            ev("DERIVED", "spf-count", String(spfRecords.length), "Number of SPF records found"),
          ],
          recommendation:
            "Remove all but one SPF record and merge the mechanisms into it.",
          scoreImpact: 5,
        })
      );
    }

    const parsed = parseSpfRecord(single);
    const syntaxOk = parsed.errors.length === 0;

    if (!syntaxOk) {
      out.push(
        mkCheck({
          id: "spf",
          category: "SPF",
          status: "FAIL",
          severity: "HIGH",
          title: "SPF record contains syntax errors",
          summary: `The SPF record failed to parse: ${parsed.errors.join("; ")}`,
          evidence: [
            ev("DNS_RECORD", `${ctx.domain} TXT`, single, "Raw SPF record"),
            ev("DERIVED", "spf-parse", parsed.errors.join("\n"), "Parser errors"),
          ],
          recommendation:
            "Fix the SPF syntax. Unknown terms or malformed mechanisms invalidate the policy for compliant receivers.",
          scoreImpact: 5,
        })
      );
    } else {
      // `all` mechanism analysis
      const q = parsed.allQualifier;
      if (q === "+") {
        out.push(
          mkCheck({
            id: "spf",
            category: "SPF",
            status: "FAIL",
            severity: "CRITICAL",
            title: "SPF uses +all (allows every sender)",
            summary: "The +all qualifier effectively authorizes every sender and removes SPF's protection.",
            evidence: [ev("DNS_RECORD", `${ctx.domain} TXT`, single, "Raw SPF record")],
            recommendation:
              "Change +all to ~all (soft fail) at minimum, or -all once you are certain every legitimate sender is included.",
            scoreImpact: 4,
          })
        );
      } else if (q === "~") {
        out.push(
          mkCheck({
            id: "spf",
            category: "SPF",
            status: "WARN",
            severity: "LOW",
            title: "SPF uses ~all (soft fail)",
            summary: "Soft-fail tells receivers to treat unmatched senders as suspicious but not reject them.",
            evidence: [ev("DNS_RECORD", `${ctx.domain} TXT`, single, "Raw SPF record")],
            scoreImpact: 4,
          })
        );
      } else if (q === "?") {
        out.push(
          mkCheck({
            id: "spf",
            category: "SPF",
            status: "WARN",
            severity: "MEDIUM",
            title: "SPF uses ?all (neutral)",
            summary: "Neutral tells receivers nothing about unmatched senders — little protection.",
            evidence: [ev("DNS_RECORD", `${ctx.domain} TXT`, single, "Raw SPF record")],
            scoreImpact: 4,
          })
        );
      } else {
        out.push(
          mkCheck({
            id: "spf",
            category: "SPF",
            status: "PASS",
            severity: "INFO",
            title: "SPF ends with a hard fail (-all)",
            summary: "A strong authorization boundary is published.",
            evidence: [ev("DNS_RECORD", `${ctx.domain} TXT`, single, "Raw SPF record")],
            scoreImpact: 4,
          })
        );
      }
    }

    // SPF remediation safety note (always present when an SPF record exists)
    if (single) {
      out.push(
        mkCheck({
          id: "spf-review-before-change",
          category: "SPF",
          status: "INFO",
          severity: "INFO",
          title: "Review senders before editing SPF",
          summary:
            "Your SPF record may reference several sending services. Removing one can break authentication for that sender.",
          evidence: [ev("DNS_RECORD", `${ctx.domain} TXT`, single, "Raw SPF record")],
          recommendation:
            "List every include:/ip4: mechanism and confirm each maps to a service you still use before making changes.",
        })
      );
    }

    // Lookup count analysis (recursive)
    if (parsed.errors.length === 0) {
      const analysis = await analyzeSpfLookups(ctx.resolver, ctx.domain, single);
      const within = analysis.withinLimit && !analysis.cycleDetected && !analysis.maxDepthReached;
      out.push(
        mkCheck({
          id: "spf-lookup",
          category: "SPF",
          status: within ? "PASS" : "FAIL",
          severity: within ? "INFO" : "HIGH",
          title: within ? `SPF DNS lookups within limit (${analysis.lookupCount}/10)` : `SPF exceeds the DNS lookup limit (${analysis.lookupCount}/10)`,
          summary: analysis.cycleDetected
            ? "SPF include/redirect chain contains a cycle, which can break evaluation."
            : analysis.maxDepthReached
              ? "SPF include chain exceeded the maximum evaluation depth."
              : within
                ? "Recursive include/redirect evaluation stays within the RFC 7208 limit of 10 DNS lookups."
                : "Receivers may reject or treat the policy as permerror because it requires more than 10 DNS lookups.",
          evidence: [
            ev("DERIVED", "spf-lookup-count", String(analysis.lookupCount), "Total DNS-causing mechanisms across the chain"),
            ev("DERIVED", "spf-expansion", analysis.expandedDomains.join(" → "), "Include/redirect chain"),
            ...(analysis.cycleDetected ? [ev("DERIVED", "spf-cycle", "cycle detected", "Include/redirect cycle")] : []),
          ],
          recommendation: within
            ? undefined
            : "Reduce DNS lookups by merging or removing includes, or by using ip4: for your own infrastructure.",
          scoreImpact: 15,
        })
      );
    }
  }

  return out;
}
