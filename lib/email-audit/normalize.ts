/**
 * Domain normalization + validation.
 * Accepts bare domains, URLs, www, uppercase, trailing slashes — normalizes
 * to a lowercase label for DNS queries. IDN → Punycode.
 */

import { domainToASCII } from "node:url";

const LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export function normalizeDomain(input: string): string {
  let s = (input ?? "").trim().toLowerCase();

  // Strip scheme
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  // Strip www. (repeatedly, tolerate www.www.)
  s = s.replace(/^(?:www\.)+/i, "");
  // Strip path / query / fragment
  const slash = s.indexOf("/");
  if (slash !== -1) s = s.slice(0, slash);
  const q = s.indexOf("?");
  if (q !== -1) s = s.slice(0, q);
  const h = s.indexOf("#");
  if (h !== -1) s = s.slice(0, h);
  // Trailing dots (FQDN) are fine for DNS but strip for display
  s = s.replace(/\.+$/, "");
  return s.trim().toLowerCase();
}

export interface NormalizeResult {
  ok: boolean;
  domain?: string;
  ascii?: string;
  error?: string;
}

export function validateDomain(input: string): NormalizeResult {
  const normalized = normalizeDomain(input);
  if (!normalized) {
    return { ok: false, error: "Enter a domain name." };
  }
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return { ok: false, error: "localhost is not a valid target." };
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return { ok: false, error: "Enter a domain name, not an IP address." };
  }
  if (/(^|\.)(local|internal|home|lan|corp|invalid|test)$/.test(normalized)) {
    return { ok: false, error: "Enter a public domain name." };
  }

  let ascii: string;
  try {
    ascii = domainToASCII(normalized);
  } catch {
    return { ok: false, error: "Invalid internationalized domain." };
  }
  if (!ascii || ascii !== ascii.toLowerCase() || ascii.length > 253) {
    return { ok: false, error: "Invalid domain name." };
  }

  const labels = ascii.split(".");
  if (labels.length < 2) {
    return { ok: false, error: "Enter a full domain (e.g. example.com)." };
  }
  for (const label of labels) {
    if (!LABEL_RE.test(label)) {
      return { ok: false, error: `Invalid label: ${label}` };
    }
  }
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/.test(tld) && !/^xn--/.test(tld)) {
    return { ok: false, error: `Unrecognized top-level domain: .${tld}` };
  }

  return { ok: true, domain: normalized, ascii };
}
