/**
 * LinkedIn URL normalization shared by the tool pipeline.
 * Accepts profile/company/school URLs (with or without protocol/query) and
 * returns the bare `https://www.linkedin.com/in/...` (or /company/, /school/)
 * shape mindcase expects.
 */

const ALLOWED_PATH_PREFIXES = ["/in/", "/company/", "/school/"];

export function normalizeLinkedInUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter a LinkedIn profile or company page URL");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid LinkedIn URL");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host.endsWith("linkedin.com")) {
    throw new Error("Enter a LinkedIn profile or company page URL");
  }

  const path = url.pathname;
  const allowed = ALLOWED_PATH_PREFIXES.some((p) => path.startsWith(p));
  if (!allowed) {
    throw new Error("Enter a LinkedIn profile, company, or school URL");
  }

  return `https://www.linkedin.com${path}`;
}
