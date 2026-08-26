const ALLOWED_PATH_PREFIXES = ["/in/", "/company/", "/school/"];

/**
 * Accepts a competitor's LinkedIn profile or company page URL (with or without protocol/query
 * string) and normalizes it to a bare `https://www.linkedin.com/in/...` or `/company/...` URL —
 * the shape mindcase's `linkedin/posts` agent expects for its `urls` param.
 */
export function normalizeLinkedInUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter a LinkedIn profile or company page URL");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid LinkedIn URL");
  }

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== "linkedin.com") {
    throw new Error("Enter a linkedin.com profile or company page URL");
  }
  if (!ALLOWED_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    throw new Error("Enter a LinkedIn profile (/in/...) or company page (/company/...) URL");
  }

  const cleanPath = url.pathname.replace(/\/+$/, "");
  return `https://www.linkedin.com${cleanPath}`;
}
