/**
 * Client-side LinkedIn URL validation (mirrors convex/profileUrl.ts).
 * The server is authoritative — this only prevents advancing to the email
 * gate with an obviously wrong URL.
 */

const ALLOWED_PATH_PREFIXES = ["/in/", "/company/", "/school/"];

export function isValidLinkedInUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host.endsWith("linkedin.com")) return false;

  return ALLOWED_PATH_PREFIXES.some((p) => url.pathname.startsWith(p));
}
