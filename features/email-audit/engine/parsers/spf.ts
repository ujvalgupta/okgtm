/**
 * SPF parser + recursive DNS-lookup analysis (RFC 7208).
 *
 * - Proper tokenizer: mechanisms + modifiers, qualifiers, IPv4/IPv6, domains.
 * - Recursive include/redirect evaluation with the 10-lookup limit,
 *   a recursion-depth limit, cycle detection, and a hard expansion cap so
 *   malicious DNS data can never cause unbounded work.
 */

import type { DNSResolver } from "@/lib/shared/dns";

export type SpfQualifier = "+" | "-" | "~" | "?";

export interface SpfTerm {
  name: string; // a | mx | ip4 | ip6 | include | exists | all | redirect | exp | unknown
  qualifier?: SpfQualifier;
  value?: string;
  raw: string;
}

export interface SpfRecord {
  found: boolean;
  raw?: string;
  terms: SpfTerm[];
  errors: string[];
  allQualifier?: SpfQualifier;
  redirectDomain?: string;
}

const MECHANISMS = new Set(["all", "a", "mx", "ip4", "ip6", "include", "exists", "ptr"]);
const MODIFIERS = new Set(["redirect", "exp"]);
const QUALIFIERS = new Set(["+", "-", "~", "?"]);

function tokenize(record: string): { terms: SpfTerm[]; errors: string[] } {
  const terms: SpfTerm[] = [];
  const errors: string[] = [];
  const parts = record.split(/\s+/).filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0 && !part.toLowerCase().startsWith("v=spf1")) {
      errors.push("Record does not begin with v=spf1");
      continue;
    }
    if (part.toLowerCase().startsWith("v=spf1")) continue;

    let body = part;
    let qualifier: SpfQualifier | undefined;
    if (QUALIFIERS.has(body[0])) {
      qualifier = body[0] as SpfQualifier;
      body = body.slice(1);
    }

    // Split name/value on the first ':' (mechanisms) or '=' (modifiers).
    const sepMatch = body.match(/^([^:=]+)([:=])(.*)$/);
    let name: string;
    let value: string | undefined;
    if (sepMatch) {
      name = sepMatch[1].toLowerCase();
      value = sepMatch[3];
    } else {
      name = body.toLowerCase();
      value = undefined;
    }

    if (MECHANISMS.has(name) || MODIFIERS.has(name)) {
      terms.push({ name, qualifier, value: value || undefined, raw: part });
    } else {
      terms.push({ name: "unknown", qualifier, value: value || undefined, raw: part });
      errors.push(`Unknown term: ${name}`);
    }
  }
  return { terms, errors };
}

export function parseSpfRecord(record: string): SpfRecord {
  const { terms, errors } = tokenize(record);
  const all = terms.find((t) => t.name === "all");
  const redirect = terms.find((t) => t.name === "redirect");
  const duplicateAll = terms.filter((t) => t.name === "all").length > 1;
  if (duplicateAll) errors.push("More than one 'all' mechanism");
  if (redirect && !redirect.value) errors.push("redirect modifier requires a domain");

  return {
    found: true,
    raw: record,
    terms,
    errors,
    allQualifier: all?.qualifier,
    redirectDomain: redirect?.value,
  };
}

export interface SpfLookupAnalysis {
  lookupCount: number;
  limit: number;
  withinLimit: boolean;
  maxDepthReached: boolean;
  cycleDetected: boolean;
  expandedDomains: string[];
}

export const SPF_LIMIT = 10;
const MAX_DEPTH = 10;
const MAX_LOOKUPS = 32; // hard cap: never trust remote DNS to bound our work

/**
 * Recursively counts DNS-causing mechanisms across include/redirect chains.
 * Fetches each target's TXT from the resolver and tokenizes it.
 */
export async function analyzeSpfLookups(
  resolver: DNSResolver,
  rootDomain: string,
  rootRecord: string
): Promise<SpfLookupAnalysis> {
  let lookupCount = 0;
  let cycleDetected = false;
  let maxDepthReached = false;
  const visited = new Set<string>();
  const expanded: string[] = [rootDomain];

  async function walk(domain: string, record: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) {
      maxDepthReached = true;
      return;
    }
    const parsed = parseSpfRecord(record);
    const redirectTarget = parsed.redirectDomain;

    for (const term of parsed.terms) {
      if (term.name === "include") {
        if (!term.value) continue;
        lookupCount += 1;
        if (lookupCount > MAX_LOOKUPS) return; // hard stop
        const key = term.value.toLowerCase();
        if (visited.has(key)) {
          cycleDetected = true;
          continue;
        }
        visited.add(key);
        expanded.push(key);
        const target = await resolver.resolveTXT(key);
        const spf = target.values.find((v) => v.trim().toLowerCase().startsWith("v=spf1"));
        if (spf) {
          await walk(key, spf, depth + 1);
        } else if (target.status === "RECORD_FOUND") {
          lookupCount += 1; // fetch happened, record absent → counts
        }
        if (lookupCount > MAX_LOOKUPS) return;
      } else if (term.name === "a" || term.name === "mx" || term.name === "exists" || term.name === "ptr") {
        // a/mx/exists each cause a lookup when evaluated (ptr is deprecated → still a lookup)
        lookupCount += 1;
        if (lookupCount > MAX_LOOKUPS) return;
      }
    }

    // redirect: if no include/all made a decision path, its target is evaluated.
    // We conservatively count its own record fetch + recurse.
    if (redirectTarget && redirectTarget !== domain.toLowerCase()) {
      const key = redirectTarget.toLowerCase();
      lookupCount += 1;
      if (lookupCount > MAX_LOOKUPS) return;
      if (visited.has(key)) {
        cycleDetected = true;
        return;
      }
      visited.add(key);
      expanded.push(key);
      const target = await resolver.resolveTXT(key);
      const spf = target.values.find((v) => v.trim().toLowerCase().startsWith("v=spf1"));
      if (spf) await walk(key, spf, depth + 1);
    }
  }

  await walk(rootDomain, rootRecord, 0);

  return {
    lookupCount,
    limit: SPF_LIMIT,
    withinLimit: lookupCount <= SPF_LIMIT,
    maxDepthReached,
    cycleDetected,
    expandedDomains: expanded,
  };
}

/** Find SPF records among TXT values (returns all v=spf1 records). */
export function extractSpfRecords(txtValues: string[]): string[] {
  return txtValues.filter((v) => v.trim().toLowerCase().startsWith("v=spf1"));
}

/** Find an SPF record; null if none present. */
export function findSpfRecord(txtValues: string[]): string | null {
  const recs = extractSpfRecords(txtValues);
  return recs[0] ?? null;
}
