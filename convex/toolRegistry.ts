/**
 * Email-tool registry for the Convex pipeline — the ONLY per-tool facts the
 * backend needs. Convex is a self-contained deployment unit (its tsconfig
 * covers convex/ only, and it cannot import across the repo), so this mirrors
 * the display names already colocated in features/<slug>/meta.ts.
 *
 * tests/convex/email-tools-config.test.ts enforces that this registry matches
 * the features side exactly (same slugs, same names, instant tools absent) —
 * if the two drift, the test fails. Do not add a tool here without adding it
 * to features/ first.
 */

/** How the shared pipeline gathers raw data for a tool. */
export type EmailToolStrategy =
  | "posts" // 5 most recent posts
  | "ads" // active ads from the Ad Library
  | "posts-comments" // posts first, then 1 commenter per post
  | "profile-comments"; // posts a profile has recently commented on

export interface EmailToolConfig {
  name: string;
  strategy: EmailToolStrategy;
}

export const EMAIL_TOOL_CONFIG: Record<string, EmailToolConfig> = {
  "linkedin-post-spy": { name: "LinkedIn Post Spy", strategy: "posts" },
  "linkedin-ad-spy": { name: "LinkedIn Ad Spy", strategy: "ads" },
  "steal-competitor-leads": { name: "Steal Competitor Leads", strategy: "posts-comments" },
  "find-lost-leads": { name: "Find Lost Leads", strategy: "posts-comments" },
  "competitor-engagement-spy": { name: "Competitor Engagement Spy", strategy: "profile-comments" },
  "lead-journey-finder": { name: "Lead Journey Finder", strategy: "profile-comments" },
};

export function emailToolConfig(tool: string): EmailToolConfig | undefined {
  return EMAIL_TOOL_CONFIG[tool];
}

/** All email tools take a LinkedIn URL as their gate input. */
export function isEmailTool(tool: string): boolean {
  return tool in EMAIL_TOOL_CONFIG;
}
