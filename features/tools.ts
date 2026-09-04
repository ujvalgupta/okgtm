/**
 * The filesystem registry of /tools. Pointers only: the facts about each tool
 * (copy, gate config, family) live colocated in features/<slug>/meta.ts —
 * never duplicated here. A dynamic route needs a slug→module map somewhere;
 * this is that map, and the one place a new tool is registered.
 *
 * To add a tool: create features/<slug>/ (meta.ts, index.ts, copy.md and —
 * instant tools only — form.tsx, engine/, __tests__), add its API route
 * adapter under app/api/<slug>/route.ts (instant tools), then register it
 * below: one meta import, one Form import (instant only), one MODULES entry.
 */

import type { ToolMeta, ToolModule } from "./types";
import { meta as emailAuditMeta } from "./email-audit/meta";
import EmailAuditForm from "./email-audit/form";
import { meta as emailPredictMeta } from "./email-predict/meta";
import EmailPredictForm from "./email-predict/form";
import { meta as geoAuditMeta } from "./geo-audit/meta";
import GeoAuditForm from "./geo-audit/form";
import { meta as llmsTxtMeta } from "./llms-txt/meta";
import LlmsTxtForm from "./llms-txt/form";
import { meta as linkedinAdSpyMeta } from "./linkedin-ad-spy/meta";
import { meta as linkedinPostSpyMeta } from "./linkedin-post-spy/meta";
import { meta as stealCompetitorLeadsMeta } from "./steal-competitor-leads/meta";
import { meta as findLostLeadsMeta } from "./find-lost-leads/meta";
import { meta as competitorEngagementSpyMeta } from "./competitor-engagement-spy/meta";
import { meta as leadJourneyFinderMeta } from "./lead-journey-finder/meta";

const MODULES: ToolModule[] = [
  { meta: emailAuditMeta, Form: EmailAuditForm },
  { meta: emailPredictMeta, Form: EmailPredictForm },
  { meta: geoAuditMeta, Form: GeoAuditForm },
  { meta: llmsTxtMeta, Form: LlmsTxtForm },
  { meta: linkedinAdSpyMeta },
  { meta: linkedinPostSpyMeta },
  { meta: stealCompetitorLeadsMeta },
  { meta: findLostLeadsMeta },
  { meta: competitorEngagementSpyMeta },
  { meta: leadJourneyFinderMeta },
];

/** Newest tool first — every consumer renders latest tools at the top. */
export const tools: ToolModule[] = [...MODULES].sort((a, b) => a.meta.sortOrder - b.meta.sortOrder);

/** Tool metas in display order, for listing pages and metadata. */
export const toolMetas: ToolMeta[] = tools.map((t) => t.meta);

/** Full module lookup (meta + form, when the tool has one). */
export function getToolModule(slug: string): ToolModule | undefined {
  return tools.find((t) => t.meta.slug === slug);
}

/** Meta lookup. */
export function getToolBySlug(slug: string): ToolMeta | undefined {
  return toolMetas.find((t) => t.slug === slug);
}
