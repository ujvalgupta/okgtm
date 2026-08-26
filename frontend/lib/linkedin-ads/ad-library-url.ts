/**
 * mindcase's ads-library API takes a LinkedIn Ad Library *search* URL, not a plain
 * company name. Confirmed live against linkedin.com/ad-library/search: the advertiser
 * filter is the `accountOwner` query param (plain company name, not an ID) — `keyword`
 * is a full-text search over ad copy and matches unrelated advertisers who merely
 * mention the name.
 */
export function buildAdvertiserSearchUrl(companyName: string): string {
  const params = new URLSearchParams({ accountOwner: companyName });
  return `https://www.linkedin.com/ad-library/search?${params.toString()}`;
}
