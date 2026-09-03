import type { GeoCheckResult, GeoSnapshot } from "../types";
import { fetchText } from "../http";
import { dnsLookup, tlsHandshake } from "../network";
import type { CheckCtx } from "./ctx";

export async function fetchabilityCheck(ctx: CheckCtx): Promise<{ result: GeoCheckResult; snapshot?: GeoSnapshot }> {
  const url = ctx.normalizedUrl.toString();
  const hostname = ctx.normalizedUrl.hostname;
  const protocol = ctx.normalizedUrl.protocol;

  const dns = await dnsLookup(hostname);
  const tls = protocol === "https:" ? await tlsHandshake(hostname) : { ok: true as const };
  const snapshot = await fetchText(url);

  const redirectChain = snapshot.redirectChain ?? [];
  const redirectCount = Math.max(0, redirectChain.length - 1);
  const has302InChain = redirectChain.some((h) => h.statusCode === 302);
  const isHttpFailure = snapshot.fetchError || (snapshot.statusCode !== null && snapshot.statusCode >= 400);

  let status: "PASS" | "WARNING" | "FAIL";
  let reason: string;
  if (!dns.ok || !tls.ok || isHttpFailure) {
    status = "FAIL";
    reason = !dns.ok
      ? `DNS lookup failed for ${hostname}`
      : !tls.ok
        ? `TLS handshake failed for ${hostname}`
        : snapshot.fetchError
          ? `Fetch failed: ${snapshot.fetchError}`
          : `Origin returned HTTP ${snapshot.statusCode}`;
  } else if (redirectCount > 2) {
    status = "WARNING";
    reason = `${redirectCount} redirect hops before the final URL — bots may give up on long chains`;
  } else if (has302InChain) {
    status = "WARNING";
    reason = "A temporary 302 redirect is in the chain — link signals may not pass to the final URL";
  } else {
    status = "PASS";
    reason = redirectCount > 0 ? `Fetched successfully after ${redirectCount} redirect${redirectCount > 1 ? "s" : ""}` : "DNS, TLS and HTTP fetch all succeeded";
  }

  const metadata: Record<string, unknown> = {
    normalizedScore: status === "PASS" ? 1 : status === "WARNING" ? 0.7 : 0,
    hostname,
    dnsResolved: dns.ok,
    dnsError: dns.ok ? undefined : dns.error,
    tlsChecked: protocol === "https:",
    tlsOk: tls.ok,
    tlsError: tls.ok ? undefined : tls.error,
    finalUrl: snapshot.finalUrl,
    statusCode: snapshot.statusCode,
    statusText: snapshot.statusText,
    durationMs: snapshot.durationMs,
    redirectCount,
    redirectChain,
  };

  return {
    result: {
      id: "fetchability",
      title: "Fetchability",
      categoryKey: "fetchability",
      status,
      reason,
      metadata,
      available: true,
      normalizedScore: metadata.normalizedScore as number,
    },
    snapshot,
  };
}
