# Architecture — OkGTM

> **Status: target structure, migration in progress.** Code is being moved to match this map
> (Step 1 of the restructure). Until migration completes, some files still live at their old
> homes (`lib/free-tools.ts`, `components/*-form.tsx`, scattered `lib/<tool>/`). The migration
> status table at the bottom tracks what has landed.

## Stack & conventions

- **Next.js 16 (App Router, React 19, RSC by default)**, Tailwind v4, shadcn/ui base, `@phosphor-icons/react` only, Cabinet Grotesk (display) + Inter (body).
- **Convex** backend (functions in `convex/`), **Resend** for email, **Vitest** for tests.
- This is not the Next.js from training data — read `node_modules/next/dist/docs/` before writing routes.
- Design tokens, motion layer, radius/spacing rules: `docs/DESIGN.md` is the single source. Visual behavior is never changed during refactors (code-qa agent verifies).
- Server components by default; `"use client"` only where interactivity is needed. Icons: Phosphor only.
- "Module" follows the codebase-design vocabulary: interface + implementation, depth over spread.

## The two tool families

Every tool is one of two kinds, and the kind determines where its code lives:

| | **Instant tool** | **Email tool** |
|---|---|---|
| Delivery | Result renders on the page | Result emailed after async run |
| Backend | Pure engine + Next API route | Convex job pipeline (shared by all email tools) |
| Slice | Rich: engine, form, meta, copy, tests | Thin: meta + pipeline config only |
| Tools | `geo-audit`, `email-audit`, `email-predict`, `llms-txt` | `linkedin-ad-spy`, `linkedin-post-spy`, `steal-competitor-leads`, `find-lost-leads`, `competitor-engagement-spy`, `lead-journey-finder` |

The Convex pipeline is **one deep shared module**, not six codebases: the email tools are
parameterized instances of it. Their folders hold only what differs: copy, labels, and the
pipeline config (which agent, what input).

## Module map (target)

```
features/<slug>/            one folder per tool — the filesystem is the registry
├── index.ts                the module's interface: exports { meta, Form? / pipelineConfig? }
├── meta.ts                 code-required strings: slug, title, description, labels, FAQ data
├── copy.md                 authoritative marketing copy (see §Copy)
├── engine/…                instant tools only: pure, side-effect-free logic
├── form.tsx                instant tools only: client form + result UI
└── __tests__/              tests cross the engine seam (Vitest)
features/tools.ts           enumeration of tool folders (~10 import lines, pointers only —
                            NOT a data registry; facts stay colocated in each folder)

lib/shared/                 cross-tool infrastructure, each module exactly once
├── http.ts                 SSRF-safe fetcher (merged from geo-audit/http.ts + email-audit/ssrf.ts)
├── cache.ts  rate-limit.ts api-route.ts   TTL cache · rate limiter · route boilerplate (clientIp, cleanup, error shapes)
└── validators.ts           pure LinkedIn-URL / email validators — imported by client AND Convex (no mirrors)

app/                        thin shell — Next.js forces routes to live here
├── tools/page.tsx          listing: reads features/tools.ts, renders from meta
├── tools/[slug]/page.tsx   resolves slug → tool module; renders whatever its index exports (no ternaries)
└── api/<slug>/route.ts     instant tools: 15-line adapters (validate → rate-limit → engine)
components/shared/          ToolGateForm (email-tool gate) + shared result-UI kit (StatusBadge, ScoreHero, phase hook)

convex/                     self-contained deployment unit — cannot import features/ or lib/
├── schema.ts               leads · emailRateLimits · apiUsage · analysisJobs
├── jobs.ts                 requestAnalysis / runAnalysis / job queries (was the old tools.ts)
├── pipeline.ts             the four raw-data strategies (posts, ads, posts-comments, profile-comments)
├── toolRegistry.ts         email-tool config mirror: slug → { name, strategy }
└── mindcase.ts llm.ts email.ts emailGate.ts profileUrl.ts rateLimits.ts newsletter.ts
```

## Rules of the shape

1. **One concept, one folder.** Browsing `features/` enumerates the product; `find geo-audit`
   means open `features/geo-audit/`.
2. **Engines are pure.** Side-effect-free, depend on nothing global; tests import them directly
   across the same seam callers use (the pre-restructure test pattern, preserved).
3. **Routes and pages are adapters.** `app/api/<slug>/route.ts` and `[slug]/page.tsx` add
   protocol only — validation, rate limiting, rendering. No business logic.
4. **Shared code lives in `lib/shared/` exactly once.** Never re-implement SSRF-safe fetching,
   caching, rate limiting, or validation inside a tool. (The deletion test: delete a shared
   module and complexity should reappear across callers, proving it earns its keep.)
5. **No central registry god-file.** Tool facts (copy, config) are colocated with each tool.
   `features/tools.ts` is an enumeration of imports — the minimum a dynamic route needs.
6. **No mirrors across the client/Convex seam — with one enforced exception.**
   Convex is a self-contained deployment unit (its tsconfig covers convex/ only and
   cannot import across the repo), so the few per-tool facts the backend needs
   (email-tool slugs + display names + strategy) live in `convex/toolRegistry.ts`
   as a deliberate mirror of `features/*/meta.ts`. The mirror is *enforced*:
   `tests/convex/email-tools-config.test.ts` fails if the two sides drift. Do not
   widen the mirror without adding a matching test. Validators duplicated for
   client vs server (`lib/email.ts` vs `convex/emailGate.ts`, etc.) are the same
   exception: Convex cannot import them, so both sides stay in sync by hand.
7. **Convex job pipeline is one deep module.** Email tools are parameterized
   instances of it — `convex/toolRegistry.ts` maps slug → strategy; strategies
   live once in `convex/pipeline.ts`; job lifecycle in `convex/jobs.ts`.

## Copy

Marketing copy is **authored as markdown**, tracked in the repo, colocated with what it
describes: `features/<slug>/copy.md` per tool, and `content/home/copy.md` for the home page.
It is the authoritative content source — the copywriter writes here.

Code renders only the strings it must (titles, labels, descriptions, FAQ bodies), kept in
`meta.ts`. Syncing `meta.ts` when `copy.md` changes is a **documented manual hand-off** — each
file carries a header note pointing at the other. This is a deliberate trade-off (see
`docs/adr/0002-copy-source-markdown-not-code.md`); do not "fix" it by single-sourcing copy in
code or by committing scraped competitor reference material.

Raw competitor references and QA screenshots stay in the gitignored `artifacts/`.

## Adding a tool

1. Create `features/<slug>/` with `index.ts`, `meta.ts`, `copy.md`.
2. Instant tool: add pure `engine/` logic + `form.tsx` + a 15-line adapter at `app/api/<slug>/route.ts`.
3. Email tool: add `pipelineConfig` to `index.ts`; register the agent in the Convex pipeline.
4. Add one import line to `features/tools.ts`.
5. Tests for the engine; `pnpm typecheck && pnpm test && pnpm build`.

## Documentation map

- `CONTEXT.md` — glossary of product terms (tool, instant tool, email tool, result, lead, GEO).
- `docs/ARCHITECTURE.md` — this file (supersedes the stale `FRONTEND.md`, which is deleted once this is accurate).
- `docs/DESIGN.md` — design system source of truth (tokens, radius, motion).
- `docs/adr/` — hard-to-reverse decisions.
- `docs/SKILL.md`, `docs/AGENT_TEMPLATE.md` — build-process rules for agents.

## Migration status

| Step | Work | Status |
|---|---|---|
| 1 | CONTEXT.md, ARCHITECTURE.md, ADRs | done |
| 2 | `lib/shared/` extraction + dedup | done |
| 3 | Instant tools → `features/` | done |
| 4 | Email tools → `features/` + Convex split | done |
| 5 | Home page data extraction | pending |
| 6 | Copy consolidation into tracked markdown | pending |
| 7 | `.pi/agents/*.md` corrected (diff-approved) | pending |
| 8 | Cleanup: delete `frontend/`, `FRONTEND.md`, stale comments | pending |
| 9 | Fresh-eyes verification | pending |
