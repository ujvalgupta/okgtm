# FRONTEND_PLAN.md — OkGTM frontend build pipeline

Status: **approved 2026-08-23** (revised same day — single final gate; the old
Gate A / Gate 1 / Gate 2 model was removed). Revised again 2026-08-23 (evening):
**text-first capture** (`fetch-page.mjs` v4), **`refs_design.md` removed** from the
flow (the coder does not read competitor design files — DESIGN.md is the sole
design authority), and **OkGTM pages are cream/light-only — no dark mode**
(per DESIGN.md; SKILL.md's dark-mode default does not apply). This document is a *summary contract* — the
**operational source of truth is the agent files in `frontend/.pi/agents/`**.
If an agent file and this plan disagree, the agent file wins; update this plan after
changing agents.

## 1. Goal

Build **any specific page** of the OkGTM project, one page at a time, as needed.
Each page goes through the full pipeline below. **The final deliverable is one
production-ready page at a time**, accumulating into the frontend app.

## 2. Inputs

| File | Owner | Contents |
|---|---|---|
| `BUSINESS.md` (repo root) | human | Value prop, problem/solution, audience, differentiators, tone, primary CTA, competitor site list |
| `frontend/docs/DESIGN.md` | human | Design intent, brand direction, tokens, motion guidance |
| `frontend/docs/SKILL.md` | human-maintained | Anti-slop design skill (design-taste-frontend) — read by frontend-coder, code-qa, animator |
| `frontend/docs/FRONTEND_PLAN.md` | this doc | Pipeline summary — see §6 note: agents are the contract |
| `frontend/.pi/agents/*.md` | human-maintained | **Source of truth** — per-agent system prompts, tools, models |

**Note:** there is **no `refs_design.md`** anywhere in the flow. Competitor design
files are not consumed by the coder; DESIGN.md is the sole design authority for
every page.

## 3. Tech stack

- **Final code:** Next.js (App Router) + Tailwind CSS + shadcn/ui — this IS the design.
  No separate spec/mockup phase: the frontend-coder declares a Design Read and ships the
  real page. Human gates run on the real implementation (screenshots + running page).
- **Package management:** **pnpm workspaces at the repo root** — ONE install
  (`pnpm install` at root), one lockfile, shared content-addressed store. Members:
  `frontend` (Next app), `frontend/.pi/scripts` (`@okgtm/agent-tools` — Playwright),
  `backend` when it materializes as a Node package (Python would use its own ecosystem).
  Agents run pnpm, never npm, and never create extra package.json files.
- **Models:** Anthropic via Claude subscription OAuth — `anthropic/claude-opus-4-6`
  (frontend-coder, animator) and `anthropic/claude-sonnet-5` (reference, copywriter,
  code-qa). Thinking levels per agent (medium/high).
- **Motion:** restrained; `prefers-reduced-motion` respected.
- **Theme:** OkGTM is cream/light-only (DESIGN.md). No dark mode on any page —
  SKILL.md's "dark mode mandatory" default does not apply to this brand.

## 4. Web access & search (agents)

Two mechanisms, both installed:

- **Capture script** — `frontend/.pi/scripts/fetch-page.mjs` (used by `reference`):
  `node fetch-page.mjs <url> <outdir> [--screenshot] [--html] [--browser]`.
  **Text-first by default:** plain HTTP fetch → strips markup/entities → `page.txt`
  (no browser, no screenshot, ~1s). Falls back to a Playwright pass only when the
  direct text is too sparse (JS-rendered/SPA sites, Cloudflare challenges).
  `--screenshot` (full-page PNG) and `--html` (raw response / rendered DOM) are
  **opt-in** — no agent requires them by default; reference analysis is text-based.
  Lives in the `@okgtm/agent-tools` workspace member.
- **QA capture script** — `frontend/.pi/scripts/qa-capture.mjs` (used by `code-qa`):
  `node qa-capture.mjs <url> <outdir> [--breakpoints 375,768,1440] [--no-full]`.
  Implements the visual-QA capture protocol: (a) full-page screenshots per breakpoint
  (LAYOUT pass), (b) every `<section>` plus `<header>`/`<footer>` captured individually
  at 1:1 — scrolled into view first (fires scroll-reveal), clipped to its own bounds
  (DETAIL/legibility pass). Writes a `manifest.json`. Also in the
  `@okgtm/agent-tools` workspace member.
- **pi-web-access tools** — `web_search`, `fetch_content`, `get_search_content`
  (extension installed; keyless default). Available where an agent's `tools` allowlist
  declares them. `web_search` = search engine; `fetch_content` = page/repo/PDF/YouTube
  fetch; `get_search_content` = retrieve cached content from prior searches/fetches.

## 5. Repo layout

```
okgtm/
├── BUSINESS.md              ← root (business doc only)
├── package.json             ← workspace root (private, pnpm)
├── pnpm-workspace.yaml      ← members: frontend, frontend/.pi/scripts
├── pnpm-lock.yaml           ← single lockfile for the whole repo
├── backend/                 ← backend code (own ecosystem if Python)
└── frontend/                ← NEXT.JS APP ROOT (workspace member: package.json, app/, components/ …)
    ├── .pi/
    │   ├── agents/          ← agent definitions (5 + blueprint) — SOURCE OF TRUTH
    │   └── scripts/         ← @okgtm/agent-tools workspace member (Playwright helper)
    ├── docs/                ← common markdown: DESIGN.md, SKILL.md, FRONTEND_PLAN.md
    └── artifacts/<page>/    ← per-page build-flow artifacts
        ├── refs/            ← raw captures per competitor (page.txt by default; page.html / screenshot.png only when flags asked)
        ├── refs/<competitor>.md  ← per-competitor analysis (structure + copy insights, text-based)
        ├── refs_copy.md     ← merged COPY insights for the page (→ copywriter)
        │                    ← NOTE: refs_design.md does NOT exist — DESIGN.md is the sole design source
        ├── copy.md          ← final copy (content contract — verbatim for coder)
        └── code-qa-report.md← QA verdict + issues (final-gate input)
```

## 6. Agents (project-scoped, `frontend/.pi/agents/`)

| Agent | Model | Thinking | Purpose & Output |
|---|---|---|---|
| `reference` | sonnet-5 | medium | Finds/captures competitor pages for the target page (text-first capture script + web_search). Writes `refs/<competitor>.md` (structure, verbatim copy inventory, hierarchy/flow, social proof, objection handling, psychology tags, verdict/steal/avoid, soul read) and consolidates into `refs_copy.md` only. **No `refs_design.md`** — analysis is text-based; screenshots are not required. Never invents content — quotes only. |
| `copywriter` | opus-4-6 | medium | Writes `copy.md` from `refs_copy.md` + BUSINESS.md. Beats competitors on a named axis; facts traceable to BUSINESS.md or cited sources (`[NEEDS: …]` for gaps — never fabricate). Never copies competitor phrasing. |
| `frontend-coder` | opus-4-6 | medium | Builds the page at `app/<page>/page.tsx` from `copy.md` per DESIGN.md + SKILL.md. **DESIGN.md is the sole design authority; `refs_design.md` is not read (does not exist).** OkGTM is cream/light-only — no dark mode. Scaffolds app if missing; pnpm; verbatim copy; self-audit before finishing. |
| `code-qa` | sonnet-5 | medium | Independent quality gate: pnpm build/lint/typecheck, copy fidelity, section coverage, SKILL.md anti-slop rules, responsive, a11y, hygiene, regressions. Writes `code-qa-report.md` (PASS/FAIL, severity, file:line). Round cap 3 → **FAIL — ESCALATE**. |
| `animator` | opus-4-6 | medium | **Explicit request only.** Adds restrained motion (CSS first, Framer Motion when needed) to an approved page. Reduced-motion mandatory; scope changes reported, never silently implemented. |

## 7. Pipeline (per page)

```
STEP 0  MAIN: target page P from the human's request → reads BUSINESS.md + DESIGN.md
        → defines the page contract IN THE TASK TEXT (sections, per-section goals,
          audience, primary CTA) — no brief.md file; every child gets it inline
STEP 1  REFERENCE — parallel, one run per competitor. **ALL competitors in the
        BUSINESS.md table must be captured — never a subset** (a previous run
        captured only the two "closest" competitors and lost the rest; the whole
        table is the job, including the not-closest ones — their patterns still
        inform the copy). Batch the fanout into waves of 3-4 concurrent runs to
        avoid OOM on small machines (each browser-mode capture holds a Chromium;
        direct text-first captures are cheap).
        via fetch-page.mjs (text-first) + web_search → refs/<competitor>.md
        → consolidated by the reference agent itself into refs_copy.md only
        (no refs_design.md — the coder does not read competitor design files).
STEP 2  COPYWRITER → copy.md from refs_copy.md. No human review here — the main
        agent applies the contract (omits sections with no real content rather than
        shipping placeholders) and moves on. Unresolved `[NEEDS: …]` gaps stay in
        copy.md and are surfaced at the final review.
STEP 3  FRONTEND CODER → page at app/<P>/page.tsx from copy.md per DESIGN.md + SKILL.md.
        Agent verifies build/lint itself; main agent posts Playwright screenshots as
        a record, not as a gate.
STEP 4  CODE-QA loop (≤3 rounds, then ESCALATE). THE ONLY GATE: once code-qa
        PASSes, the human does a single final review of the running site. Nothing
        earlier stops the pipeline except a hard blocker (agent failure, unresolvable
        input contradiction) — not design taste, not copy preference.
STEP 5  ANIMATOR — only if the human explicitly asks
```

## 8. Review model (single gate at the end)

- **No intermediate gates.** Reference, copy, and build phases run to completion
  without manual stops. The main agent makes copy decisions per the contract
  (BUSINESS.md + task text): omit sections with no real content, never ship
  placeholders, never fabricate.
- **THE ONLY GATE (final):** after code-qa PASSes, the human reviews the running
  site once — main agent posts Playwright screenshots at 3 breakpoints + the
  code-qa report. Human says ship, or routes the failed phase back.
- **Manual intervention before the final gate happens only when something is
  actually broken**: agent failure/timeout, unresolvable contradiction in inputs,
  or a code-qa **FAIL — ESCALATE**. Taste/copy preference is not a reason to stop early.
- Revision cap: **max 3 rounds per phase** — code-qa reports **FAIL — ESCALATE** on
  round 3 instead of looping; escalate to human with a numbered list of unresolved issues
- **"Not satisfied" rule:** re-run the failed phase only — never a full restart

## 9. Communication & isolation model

- **Child ↔ main agent: ALLOWED.** Children raise `contact_supervisor`
  (`reason: "need_decision"` when blocked); the main agent replies via
  `subagent_supervisor`.
- **Child ↔ sibling: FORBIDDEN by construction.** No agent's `tools` allowlist includes
  `subagent`, `intercom`, or `subagent_supervisor` — no spawn or sideways-message channel
  exists. Children only talk up to the parent.
- **Context isolation** is enforced at the extension-config level
  (`~/.pi/agent/extensions/subagent/config.json`: `defaultSubagentContext: "fresh"`,
  `intercomBridge: "always"`) plus the per-agent `tools` allowlists. The agent bodies no
  longer carry an explicit isolation block; the mechanism is config + allowlists.
- **Handoffs** flow through artifact files (`frontend/artifacts/<page>/`), routed
  exclusively by the main agent.

## 10. Code-QA checklist (from the code-qa agent)

1. **Build & tooling**: `pnpm run build`, lint, typecheck — run them, never assume
2. **Copy fidelity**: visible text matches `copy.md` verbatim; meta title/description set
3. **Section coverage**: every page-contract section present, ordered, rendered
4. **Design quality**: SKILL.md anti-slop rules in full (layout/hero/accent/CTA/eyebrows)
5. **Responsive**: sm/md/lg/xl; explicit mobile collapse; nav single-line at desktop
6. **a11y**: semantic HTML, heading order, alt, labels, contrast, focus,
   `prefers-reduced-motion`. Dark mode: n/a — OkGTM pages are cream/light-only
   per DESIGN.md (any dark-mode UI added is a blocker, not a feature).
7. **Hygiene**: no dead code, unused imports/deps, console errors, broken links
8. **No regressions**: previously built pages still build and render

**Visual capture protocol (mandatory — use `qa-capture.mjs`, never ad-hoc scripts):**
- Full-page captures at 375/768/1440 — judge LAYOUT only (rhythm, spacing, alternation,
  composition)
- Every section captured individually at 1:1 (`sec-*` files) — judge DETAIL and
  legibility; scroll first so scroll-reveal fires; view EVERY capture (no skipping)
- Vision rules: if text cannot be read in a 1:1 section capture → illegible (blocker);
  never infer content from code or from prior rounds
- Judge every section through the ICP lens (founder/CMO scrolling on phone/laptop):
  would they call it pathetic/cheap/AI-generated, or would it persuade them?
- Visual bans (BLOCKER, unless the user explicitly provided a reference design to
  build): diagrams/charts/graphs, progress bars/stat dials, illustrations/decorative
  artwork, workflow/arrow diagrams, fake product-UI mockups — message carried by
  type, color, and spacing alone

Severity: **blocker** = build/lint/typecheck failure, missing/misordered section, copy
drift, any SKILL.md violation, a11y failure · **minor** = everything else (never blocks).

## 11. Orchestration

- Phase-by-phase, driven by the main agent, no pausing except at the final gate. No
  workflow script initially; may be added later for one-shot re-runs.
- On agent failure/timeout: retry once with a narrower scope; artifact files preserve
  partial work.
- Keep this plan in sync with agent files — agents win on conflict.

## 12. Pre-steps

1. ✅ Repo restructured (frontend/, backend/, DESIGN.md moved)
2. ⬜ `BUSINESS.md` written by human (competitor site list required)
3. ✅ pnpm workspaces at repo root — one `pnpm install` installs Playwright + agent tooling
4. ✅ 5 agent files (reference, copywriter, frontend-coder, code-qa, animator) — source of truth
5. ✅ Models configured (Anthropic Claude OAuth: opus-4-6 + sonnet-5)
6. ✅ pi-web-access installed (web_search / fetch_content / get_search_content available)
7. ✅ Subagents extension active (verified via `subagent list`)
