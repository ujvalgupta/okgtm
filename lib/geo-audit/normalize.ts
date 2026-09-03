/**
 * URL input normalization for the GEO audit.
 * Accepts a full URL or a bare domain (treated as https://<domain>/).
 * Rejects IPs, localhost, private/internal names, non-http(s) schemes.
 */

import { domainToASCII } from "node:url";

export interface GeoInput {
  ok: boolean;
  url?: string;
  hostname?: string;
  error?: string;
}

const BLOCKED_TLDS = /(^|\.)(local|internal|home|lan|corp|invalid|test|localhost)$/;

function looksLikeIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

export function normalizeGeoInput(raw: string): GeoInput {
  let s = (raw ?? "").trim();
  if (!s) return { ok: false, error: "Enter a website URL." };

  // Accept a bare domain: prepend https://
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(s);
  } catch {
    return { ok: false, error: "Enter a valid website URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are supported." };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.+$/, "");
  if (!host) return { ok: false, error: "Enter a valid website URL." };
  if (host === "localhost" || host.endsWith(".localhost")) {
    return { ok: false, error: "localhost is not a valid target." };
  }
  if (looksLikeIp(host)) {
    return { ok: false, error: "Enter a domain name, not an IP address." };
  }
  if (BLOCKED_TLDS.test(host)) {
    return { ok: false, error: "Enter a public website URL." };
  }

  // IDN → punycode
  let asciiHost: string;
  try {
    asciiHost = domainToASCII(host);
  } catch {
    return { ok: false, error: "Invalid internationalized domain." };
  }
  if (!asciiHost || asciiHost.length > 253) {
    return { ok: false, error: "Invalid domain name." };
  }

  const labels = asciiHost.split(".");
  if (labels.length < 2 || labels.some((l) => !l || l.length > 63 || l.startsWith("-") || l.endsWith("-"))) {
    return { ok: false, error: "Invalid domain name." };
  }

  parsed.hostname = asciiHost;
  parsed.protocol = parsed.protocol as "http:" | "https:";
  // Normalize: always analyze a clean page URL (keep path; drop hash, keep query only if present)
  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  if (parsed.pathname === "") parsed.pathname = "/";

  return { ok: true, url: parsed.toString(), hostname: asciiHost };
}
