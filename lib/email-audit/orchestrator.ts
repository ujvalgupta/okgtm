/**
 * F1 audit orchestrator: shared-DNS fetch → parallel checks → score → result.
 * Pure engine — no route/network framing here.
 */

import { randomUUID } from "node:crypto";
import { NodeDNSResolver } from "./dns";
import { DNSCache } from "./cache";
import { NodeSafeResolver } from "./cachedResolver";
import type { AuditResult } from "./types";
import { SCHEMA_VERSION } from "./types";
import type { AuditContext } from "./checks/helpers";
import { mxCheck } from "./checks/mx";
import { spfChecks } from "./checks/spf";
import { dkimCheck, dmarcChecks } from "./checks/dkim-dmarc";
import { bimiCheck, tlsRptCheck, mtaStsCheck } from "./checks/transport";
import { dnssecCheck, reverseDnsCheck } from "./checks/dnssec-reverse";
import { detectProvider } from "./checks/provider";
import { computeScore, summarizeChecks, sortChecks } from "./score";

export interface AuditInput {
  domain: string; // already normalized+validated (ascii)
}

export async function runAudit(input: AuditInput, opts?: { cache?: DNSCache }): Promise<AuditResult> {
  const started = Date.now();
  const cache = opts?.cache ?? new DNSCache();
  const resolver = new NodeSafeResolver(new NodeDNSResolver(), cache);
  const domain = input.domain;

  // Shared root lookups (one network pass each, cached for other checks)
  const [mx, txt, a, aaaa] = await Promise.all([
    resolver.resolveMX(domain),
    resolver.resolveTXT(domain),
    resolver.resolveA(domain),
    resolver.resolveAAAA(domain),
  ]);

  const ctx: AuditContext = { domain, resolver, mx, txt, a, aaaa };

  const groups: Array<Promise<unknown[]>> = [
    mxCheck(ctx).then((r) => [r]),
    spfChecks(ctx),
    dmarcChecks(ctx),
    dkimCheck(ctx, providerSelectors(ctx)).then((r) => [r]),
    bimiCheck(ctx).then((r) => [r]),
    tlsRptCheck(ctx).then((r) => [r]),
    mtaStsCheck(ctx).then((r) => [r]),
    dnssecCheck(ctx).then((r) => [r]),
    reverseDnsCheck(ctx).then((r) => [r]),
  ];

  const settled = await Promise.allSettled(groups);
  const flat: unknown[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") flat.push(...s.value);
    // Rejected groups are swallowed: a module crash must not 500 the whole audit.
  }

  const checks = sortChecks(flat as AuditResult["checks"]);
  const provider = detectProvider(ctx);
  const { score, grade } = computeScore(checks);
  const summary = summarizeChecks(checks);

  return {
    schemaVersion: SCHEMA_VERSION,
    auditId: randomUUID(),
    timestamp: new Date().toISOString(),
    domain,
    normalizedDomain: domain,
    score,
    grade,
    provider,
    summary,
    checks,
    durationMs: Date.now() - started,
  };
}

/** Extra DKIM selectors worth probing based on detected provider. */
function providerSelectors(ctx: AuditContext): string[] {
  const spfLower = ctx.txt.values.join(" ").toLowerCase();
  const selectors: string[] = [];
  if (spfLower.includes("_spf.google.com")) selectors.push("google");
  if (spfLower.includes("spf.protection.outlook.com")) selectors.push("selector2");
  if (spfLower.includes("sendgrid")) selectors.push("s1", "s2");
  if (spfLower.includes("amazonses")) selectors.push("ses");
  if (spfLower.includes("zoho")) selectors.push("zoho");
  return selectors;
}
