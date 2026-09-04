/**
 * llms.txt Validator — deterministic analysis of a site's llms.txt file.
 *
 * What it does and nothing more:
 *  1. Finds the file (/llms.txt, then /llms-full.txt, then /ai.txt).
 *  2. Validates structure: single H1 title, blockquote summary, curated H2
 *     sections, described markdown links.
 *  3. Flags the common failure mode (an unsorted link dump used as a sitemap).
 *  4. Resolves the file's own-site links and reports broken ones.
 *
 * No opinions about whether llms.txt helps or matters. Just the analysis.
 */

import { fetchStatus, fetchText } from "@/lib/shared/http";

export type LStatus = "PASS" | "WARN" | "FAIL";

export interface LCheck {
  id: string;
  label: string;
  status: LStatus;
  detail: string;
}

export interface LSection {
  heading: string;
  linkCount: number;
}

export interface LLinkRecord {
  label: string;
  url: string;
  description?: string;
  inSection: boolean;
}

export interface LLMSTxtResult {
  found: boolean;
  /** Path of the file that was validated, when one was found. */
  filePath: string | null;
  fileSize: number | null;
  checks: LCheck[];
  title: string | null;
  summary: string | null;
  sections: LSection[];
  totalLinks: number;
  describedLinks: number;
  uncategorizedLinks: number;
  /** true when the file is a big unsorted link dump rather than curated content. */
  dumpSignal: boolean;
  linkCheck: {
    fetched: number;
    ok: number;
    broken: number;
    externalSkipped: number;
    brokenLinks: { url: string; status: number | null; error?: string }[];
  };
  rawContent: string | null;
}

const CANDIDATE_PATHS = ["/llms.txt", "/llms-full.txt", "/ai.txt"];
const MAX_LINKS_TO_RESOLVE = 24;
const LINK_TIMEOUT_MS = 6000;
const CONCURRENCY = 6;
/** llms.txt files are plain text; allow up to 8 MB when reading the file itself. */
const FILE_MAX_BYTES = 8_000_000;

interface ParsedFile {
  title: string | null;
  summary: string | null;
  sections: { heading: string; links: LLinkRecord[] }[];
  strayLinks: LLinkRecord[];
}

export function parseLlmsTxt(content: string): ParsedFile {
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
  const summary = content.match(/^>\s*(.+)$/m)?.[1]?.trim() ?? null;

  const sections: { heading: string; links: LLinkRecord[] }[] = [];
  const strayLinks: LLinkRecord[] = [];
  let currentSection: { heading: string; links: LLinkRecord[] } | null = null;

  const linkRe = /^[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)\s]+|[^)\s]+)\)(?:\s*:\s*(.+))?$/;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^#\s+/.test(line)) continue; // H1 already captured
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      currentSection = { heading: headingMatch[1].trim(), links: [] };
      sections.push(currentSection);
      continue;
    }
    if (/^###\s+/.test(line)) continue; // sub-headings: treat as part of the current section

    const linkMatch = line.match(linkRe);
    if (linkMatch) {
      const record: LLinkRecord = {
        label: linkMatch[1],
        url: linkMatch[2],
        description: linkMatch[3]?.trim() || undefined,
        inSection: !!currentSection,
      };
      if (currentSection) currentSection.links.push(record);
      else strayLinks.push(record);
    }
  }

  return { title, summary, sections, strayLinks };
}

export function analyzeParsed(parsed: ParsedFile, fileSize: number, content: string): Pick<LLMSTxtResult, "checks" | "dumpSignal" | "totalLinks" | "describedLinks" | "uncategorizedLinks"> {
  const checks: LCheck[] = [];
  const allLinks = [...parsed.sections.flatMap((s) => s.links), ...parsed.strayLinks];
  const totalLinks = allLinks.length;
  const describedLinks = allLinks.filter((l) => !!l.description).length;
  const uncategorizedLinks = parsed.strayLinks.length;
  const sectionCount = parsed.sections.length;
  const h1Count = (content.match(/^#\s+/gm) ?? []).length;

  // Title
  if (!parsed.title) {
    checks.push({ id: "title", label: "Title (single H1)", status: "FAIL", detail: "No top-level # heading found. The file should start with one H1 with the site name." });
  } else if (h1Count > 1) {
    checks.push({ id: "title", label: "Title (single H1)", status: "WARN", detail: `More than one H1 present (${h1Count}). The first is used as the title.` });
  } else {
    checks.push({ id: "title", label: "Title (single H1)", status: "PASS", detail: `Found: "${clip(parsed.title, 80)}"` });
  }

  // Summary blockquote
  if (!parsed.summary) {
    checks.push({ id: "summary", label: "Summary line (blockquote)", status: "WARN", detail: "No > blockquote summary found. A one-line description under the title helps readers pick the right pages." });
  } else if (parsed.summary.length > 600) {
    checks.push({ id: "summary", label: "Summary line (blockquote)", status: "WARN", detail: `Summary is ${parsed.summary.length} characters, which is very long for a one-liner.` });
  } else {
    checks.push({ id: "summary", label: "Summary line (blockquote)", status: "PASS", detail: "Present." });
  }

  // Sections
  if (sectionCount === 0) {
    checks.push({ id: "sections", label: "Curated sections (H2)", status: "FAIL", detail: "No ## sections found. llms.txt files should organize links under named sections." });
  } else if (sectionCount === 1) {
    checks.push({ id: "sections", label: "Curated sections (H2)", status: "WARN", detail: `Only one H2 section ("${clip(parsed.sections[0].heading, 50)}"). Consider splitting topics into separate sections.` });
  } else {
    checks.push({ id: "sections", label: "Curated sections (H2)", status: "PASS", detail: `${sectionCount} sections found.` });
  }

  // Link descriptions
  const descRatio = totalLinks === 0 ? 0 : describedLinks / totalLinks;
  if (totalLinks === 0) {
    checks.push({ id: "links", label: "Links", status: "FAIL", detail: "The file contains no links." });
  } else if (descRatio < 0.3) {
    checks.push({ id: "links", label: "Links with descriptions", status: "WARN", detail: `Only ${describedLinks} of ${totalLinks} links (${Math.round(descRatio * 100)}%) have a description. Bare links are harder to use.` });
  } else {
    checks.push({ id: "links", label: "Links with descriptions", status: "PASS", detail: `${describedLinks} of ${totalLinks} links have descriptions (${Math.round(descRatio * 100)}%).` });
  }

  // Uncategorized links (sitemap-dump signal)
  if (uncategorizedLinks > 0 && totalLinks > 0 && uncategorizedLinks / totalLinks > 0.2) {
    checks.push({ id: "organized", label: "Links inside sections", status: "WARN", detail: `${uncategorizedLinks} links (${Math.round((uncategorizedLinks / totalLinks) * 100)}%) sit outside any section.` });
  } else {
    checks.push({ id: "organized", label: "Links inside sections", status: uncategorizedLinks === 0 ? "PASS" : "WARN", detail: uncategorizedLinks === 0 ? "All links are inside sections." : `${uncategorizedLinks} link${uncategorizedLinks > 1 ? "s" : ""} outside sections.` });
  }

  // Sitemap-dump failure mode
  const avgPerSection = sectionCount === 0 ? 0 : totalLinks / sectionCount;
  let dumpSignal = false;
  if (totalLinks >= 150 && (sectionCount === 0 || avgPerSection > 100)) {
    dumpSignal = true;
    checks.push({ id: "dump", label: "Not a link dump", status: "FAIL", detail: `${totalLinks} links with ${sectionCount} section${sectionCount === 1 ? "" : "s"} reads like a sitemap export, not a curated file. Cut it to the most valuable pages and organize them.` });
  } else if (totalLinks > 400) {
    dumpSignal = true;
    checks.push({ id: "dump", label: "Not a link dump", status: "WARN", detail: `${totalLinks} links is far beyond a curated set. Most useful llms.txt files stay well under a few hundred links.` });
  } else {
    checks.push({ id: "dump", label: "Not a link dump", status: "PASS", detail: `File size looks curated (${totalLinks} links).` });
  }

  if (fileSize > 200_000) {
    checks.push({ id: "size", label: "File size", status: "WARN", detail: `${(fileSize / 1024).toFixed(0)} KB. Keep the file lean for fast parsing.` });
  }

  return { checks, dumpSignal, totalLinks, describedLinks, uncategorizedLinks };
}

export async function runLlmsTxtAudit(siteUrl: string): Promise<LLMSTxtResult> {
  const origin = new URL(siteUrl).origin;

  // 1. Locate the file
  const candidates: { path: string; ok: boolean; statusCode: number | null; body: string | null; size: number; fetchError?: string }[] = [];
  for (const path of CANDIDATE_PATHS) {
    const resp = await fetchText(`${origin}${path}`, { maxBytes: FILE_MAX_BYTES });
    candidates.push({ path, ok: !resp.fetchError && resp.statusCode === 200 && !!resp.body, statusCode: resp.statusCode, body: resp.body, size: resp.body?.length ?? 0, fetchError: resp.fetchError });
    if (resp.statusCode === 200 && resp.body) break; // llms.txt preferred, then llms-full.txt, then ai.txt
  }

  const found = candidates.find((c) => c.ok);
  if (!found || !found.body) {
    const reasons = candidates.map((c) => `${c.path}: ${c.fetchError ?? c.statusCode ?? "no response"}`).join(" · ");
    return {
      found: false,
      filePath: null,
      fileSize: null,
      checks: [{ id: "file", label: "File present", status: "FAIL", detail: `No llms.txt found at ${origin}. Checked: ${reasons}` }],
      title: null,
      summary: null,
      sections: [],
      totalLinks: 0,
      describedLinks: 0,
      uncategorizedLinks: 0,
      dumpSignal: false,
      linkCheck: { fetched: 0, ok: 0, broken: 0, externalSkipped: 0, brokenLinks: [] },
      rawContent: null,
    };
  }

  const parsed = parseLlmsTxt(found.body);
  const analysis = analyzeParsed(parsed, found.size, found.body);

  // 2. Resolve links (own-site links first, bounded)
  const allLinks = [...parsed.sections.flatMap((s) => s.links), ...parsed.strayLinks];
  const siteHost = new URL(siteUrl).hostname.toLowerCase();
  const siteSuffix = siteHost.startsWith("www.") ? siteHost.slice(4) : siteHost;
  const isOwn = (u: string): boolean => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return h === siteHost || h.endsWith(`.${siteHost}`) || h.endsWith(`.${siteSuffix}`);
    } catch {
      return false;
    }
  };
  const own = allLinks.filter((l) => isOwn(l.url));
  const external = allLinks.filter((l) => !isOwn(l.url));

  // Own-site links are resolved first; external links fill the remaining budget.
  const fetchedExternal = Math.min(external.length, Math.max(0, MAX_LINKS_TO_RESOLVE - own.length));
  const toResolve = [...own, ...external].slice(0, MAX_LINKS_TO_RESOLVE);
  const results: { url: string; status: number | null; error?: string }[] = [];
  for (let i = 0; i < toResolve.length; i += CONCURRENCY) {
    const chunk = toResolve.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (l) => {
        try {
          // Status-only check — no page body is downloaded.
          const raced = await Promise.race([
            fetchStatus(l.url),
            new Promise<{ status: null; error: string }>((resolve) =>
              setTimeout(() => resolve({ status: null, error: "timed out" }), LINK_TIMEOUT_MS)
            ),
          ]);
          if (raced.error) return { url: l.url, status: raced.status, error: raced.error };
          if (raced.status !== null && raced.status >= 400) {
            return { url: l.url, status: raced.status, error: `HTTP ${raced.status}` };
          }
          return { url: l.url, status: raced.status };
        } catch (err) {
          return { url: l.url, status: null, error: err instanceof Error ? err.message : "error" };
        }
      })
    );
    results.push(...chunkResults);
  }

  const brokenLinks = results.filter((r) => r.error || (r.status ?? 0) >= 400);
  return {
    found: true,
    filePath: found.path,
    fileSize: found.size,
    checks: [{ id: "file", label: "File present", status: "PASS", detail: `${found.path} (${(found.size / 1024).toFixed(1)} KB)` }, ...analysis.checks],
    title: parsed.title,
    summary: parsed.summary,
    sections: parsed.sections.map((s) => ({ heading: s.heading, linkCount: s.links.length })),
    totalLinks: analysis.totalLinks,
    describedLinks: analysis.describedLinks,
    uncategorizedLinks: analysis.uncategorizedLinks,
    dumpSignal: analysis.dumpSignal,
    linkCheck: {
      fetched: results.length,
      ok: results.length - brokenLinks.length,
      broken: brokenLinks.length,
      externalSkipped: Math.max(0, external.length - fetchedExternal),
      brokenLinks,
    },
    rawContent: found.body,
  };
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 3)}…`;
}
