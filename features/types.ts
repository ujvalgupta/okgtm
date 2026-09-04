/**
 * Registry contract for /tools. Facts about each tool stay colocated in its
 * own folder (features/<slug>/meta.ts); this file only defines the shared
 * vocabulary of those facts.
 */

export type ToolFamily = "instant" | "email";

export interface ToolGate {
  inputLabel: string;
  inputPlaceholder: string;
  inputType?: "url" | "name";
}

export interface ToolMeta {
  slug: string;
  /** ISO date (YYYY-MM-DD) the tool shipped. */
  addedAt: string;
  /** Lower = shown closer to the top. Newest tool gets the lowest number. */
  sortOrder: number;
  name: string;
  tagline: string;
  features: string[];
  heroH1: string;
  heroSubhead: string;
  whatItDoes: string;
  howItWorks: { title: string; body: string }[];
  whatYouGet: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  metaDescription: string;
  /** instant: results render on the page. email: results are emailed after an async run. */
  family: ToolFamily;
  /** email tools only: what the shared gate form asks for. */
  gate?: ToolGate;
}

/**
 * The per-tool module interface. Each features/<slug>/index.ts exports
 * `meta` plus the family-appropriate surface; features/tools.ts enumerates
 * them. Form components are exported separately from features/<slug>/form.tsx
 * (they are client modules and must not be pulled into server route bundles).
 */
export interface ToolModule {
  meta: ToolMeta;
}
