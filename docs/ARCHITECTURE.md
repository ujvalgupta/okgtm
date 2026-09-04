# Architecture — OkGTM

> **Status: complete.** Steps 1–8 landed (docs, lib/shared, features/, Convex split, home
> data, copy records, agent-file fixes, cleanup) and the map was verified against the tree
> by a fresh-eyes review (step 9). The map below matches reality.

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
├── index.ts                the module's interface: exports { meta } (+ Form/engine wiring for instant tools)
├── meta.ts                 code-required strings: slug, title, description, labels, FAQ data
├── copy.md                 authoritative marketing copy (see §Copy)
├── engine/…                instant tools only: pure, side-effect-free logic
├── form.tsx                instant tools only: client form + result UI
└── __tests__/              tests cross the engine seam (Vitest)
features/tools.ts           enumeration of tool folders (~10 import lines, pointers only —
                            NOT a data registry; facts stay colocated in each folder)

lib/shared/                 cross-tool infrastructure, each module exactly once
├── http.ts                 SSRF-safe fetcher (policy knobs: same-site page audits vs strict same-host MTA-STS)
├── cache.ts                TtlCache primitive (tool caches layer their TTL policy on it)
├── rate-limit.ts  api-route.ts   rate limiter · route boilerplate (clientIp, JSON parse, cleanup, 429 shapes)
├── site-input.ts           website-URL input validation (GEO audit + llms.txt)
├── domain-input.ts         domain input validation (email audit + email predict)
└── dns.ts                  DNS access layer: resolver types · NodeDNSResolver · DNSCache · CachedResolver

app/                        thin shell — Next.js forces routes to live here
├── tools/page.tsx          listing: reads features/tools.ts, renders from meta
├── tools/[slug]/page.tsx   resolves slug → tool module (features/tools.ts) and renders its
│                           Form when the family is instant, else the shared gate from meta.gate
└── api/<slug>/route.ts     instant tools: thin adapters (validate → rate-limit → engine) —
                            email-predict's is app/api/email-predict/domain/route.ts (MX probe)
components/                 shared UI only: chrome (navbar, footer, …), ToolGateForm (the
                            email-tool gate), ui/ (shadcn). The instant tools' result UI
                            (StatusBadge/ScoreHero/phase lists) is currently duplicated per
                            form — known debt, not yet extracted into a shared kit.

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

1. Create `features/<slug>/` with `meta.ts`, `index.ts`, `copy.md`.
2. **Instant tool**: add pure `engine/` logic + `form.tsx` + `__tests__/`, and a thin adapter at
   `app/api/<slug>/route.ts` (validate → rate-limit → engine via the feature's `api` export).
3. **Email tool**: no per-tool engine — add its `{ name, strategy }` config to
   `convex/toolRegistry.ts` (the mirror test keeps it in lockstep with `meta.ts`); the shared
   pipeline (`convex/pipeline.ts` + `convex/jobs.ts`) picks it up.
4. Register the tool in `features/tools.ts`: one meta import + (instant tools) one Form import,
   and one `MODULES` entry. That is the only registration point — pages and routes read it.
5. Tests for the engine; `pnpm typecheck && pnpm test && pnpm build`.

## Documentation map

- `CONTEXT.md` — glossary of product terms (tool, instant tool, email tool, result, lead, GEO).
- `docs/ARCHITECTURE.md` — this file (supersedes the deleted, stale `FRONTEND.md`).
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
| 5 | Home page data extraction | done |
| 6 | Copy consolidation into tracked markdown | done |
| 7 | `.pi/agents/*.md` corrected (diff-approved) | done |
| 8 | Cleanup: delete `frontend/`, `FRONTEND.md`, stale comments | done |
| 9 | Fresh-eyes verification | done |
