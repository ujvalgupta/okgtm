/**
 * The filesystem registry of /tools. Pointers only: the facts about each tool
 * (copy, gate config, family) live colocated in features/<slug>/meta.ts —
 * never duplicated here. A dynamic route needs a slug→module map somewhere;
 * this is that map, and the one place a new tool is registered.
 *
 * To add a tool: create features/<slug>/ (meta.ts, index.ts, form.tsx or
 * pipeline config) and add one import line + one entry below.
 */

import type { ToolMeta, ToolModule } from "./types";
import { meta as emailAudit } from "./email-audit/meta";
import { meta as emailPredict } from "./email-predict/meta";
import { meta as geoAudit } from "./geo-audit/meta";
import { meta as llmsTxt } from "./llms-txt/meta";
import { meta as linkedinAdSpy } from "./linkedin-ad-spy/meta";
import { meta as linkedinPostSpy } from "./linkedin-post-spy/meta";
import { meta as stealCompetitorLeads } from "./steal-competitor-leads/meta";
import { meta as findLostLeads } from "./find-lost-leads/meta";
import { meta as competitorEngagementSpy } from "./competitor-engagement-spy/meta";
import { meta as leadJourneyFinder } from "./lead-journey-finder/meta";

const MODULES: ToolModule[] = [
  { meta: emailAudit },
  { meta: emailPredict },
  { meta: geoAudit },
  { meta: llmsTxt },
  { meta: linkedinAdSpy },
  { meta: linkedinPostSpy },
  { meta: stealCompetitorLeads },
  { meta: findLostLeads },
  { meta: competitorEngagementSpy },
  { meta: leadJourneyFinder },
];

/** Newest tool first — every consumer renders latest tools at the top. */
export const tools: ToolModule[] = [...MODULES].sort((a, b) => a.meta.sortOrder - b.meta.sortOrder);

/** Tool metas in display order, for listing pages and metadata. */
export const toolMetas: ToolMeta[] = tools.map((t) => t.meta);

/** Lookup helper. */
export function getToolBySlug(slug: string): ToolMeta | undefined {
  return toolMetas.find((t) => t.slug === slug);
}
