# FRONTEND_PLAN.md — OkGTM frontend build pipeline

Status: **approved 2026-08-22**. This is the contract the pipeline runs on. If a
decision changes, update this file.

## 1. Goal

Build **any specific page** of the OkGTM project, one page at a time, as needed.
Each page goes through the full pipeline below. **The final deliverable is one
production-ready page at a time**, accumulating into the frontend app.

## 2. Inputs

| File | Owner | Contents |
|---|---|---|
| `BUSINESS.md` (repo root) | human | Value prop, problem/solution, audience, differentiators, tone, primary CTA, competitor site list |
| `frontend/docs/DESIGN.md` | human | Design intent & brand direction |
| `frontend/docs/FRONTEND_PLAN.md` | this doc | Pipeline contract — agents read it for ordering/gates |

## 3. Tech stack

- **Final code:** Next.js (App Router) + Tailwind CSS + shadcn/ui
- **Design phase:** static mockup (`index.html` + `styles.css` + `script.js`) using
  **Tailwind utility classes via CDN** — no build step, opens directly in a browser,
  minimizes mockup → Next translation drift
- **Motion:** restrained; `prefers-reduced-motion` respected

## 4. Web access (reference agent)

- Helper script: `frontend/.pi/scripts/fetch-page.mjs` (Playwright, headless Chromium)
  - `node fetch-page.mjs <url> <outdir>` → writes `screenshot.png` (full-page),
    `page.html` (rendered DOM), `page.txt` (visible text)
  - Handles JS-rendered/SPA sites that plain fetch cannot
  - Screenshots let the agent do real visual analysis (layout, "soul")
- Installed locally in `frontend/.pi/scripts/` (own `package.json` + node_modules) so
  it never interferes with the Next.js app

## 5. Repo layout

```
okgtm/
├── BUSINESS.md              ← root (business doc only)
├── backend/                 ← backend code
└── frontend/                ← NEXT.JS APP ROOT (package.json, app/, components/ …)
    ├── .pi/
    │   ├── agents/          ← agent definitions (7 + dummy + blueprint)
    │   └── scripts/fetch-page.mjs
    ├── docs/                ← common markdown: DESIGN.md, FRONTEND_PLAN.md
    └── artifacts/<page>/    ← per-page build-flow artifacts
        ├── brief.md
        ├── refs/            ← per-competitor captures
        ├── refs.md          ← merged final reference
        ├── copy.md
        ├── design-spec.md
        └── mockup/          ← index.html, styles.css, script.js
```

## 6. Agents (project-scoped, `frontend/.pi/agents/`)

| Agent | Purpose | Output |
|---|---|---|
| `reference` | Given target page + competitor site, fetches that page via Playwright script; extracts structure, copy, CTAs, strategy, "soul" | `artifacts/<page>/refs/<competitor>.md` |
| `copywriter` | Writes best-in-class copy from brief + merged refs + proven frameworks | `artifacts/<page>/copy.md` |
| `ui-designer` | Token-explicit design spec + static mockup (Tailwind via CDN); uses `design-taste-frontend` skill | `artifacts/<page>/design-spec.md` + `mockup/` |
| `design-qa` | Audits spec + mockup vs brief + approved copy; drives revision rounds | report to main agent |
| `frontend-coder` | Implements page in the Next.js app (scaffolds app on first page) | page code in `frontend/` |
| `code-qa` | Audits implementation vs spec; build/lint/typecheck; no regressions | report to main agent |
| `animator` | **Explicit request only.** Adds restrained motion to a finished page | motion edits in `frontend/` |

## 7. Pipeline (per page)

```
STEP 0  MAIN: target page P from the human's request → reads BUSINESS.md + DESIGN.md
        → artifacts/<P>/brief.md (sections, per-section goals, audience, primary CTA)
STEP 1  REFERENCE — parallel, one run per competitor; each finds page P on that site
        via fetch-page.mjs → artifacts/<P>/refs/<competitor>.md
        → merged by MAIN into artifacts/<P>/refs.md
STEP 2  COPYWRITER → copy.md               [GATE A: manual, light review]
STEP 3  UI DESIGNER → design-spec.md + mockup/
STEP 4  DESIGN-QA loop (≤3 rounds)         [GATE 1: manual — open mockup in browser]
STEP 5  FRONTEND CODER → implements page P in the Next app
STEP 6  CODE-QA loop (≤3 rounds)           [GATE 2: manual — view page running]
STEP 7  ANIMATOR — only if the human explicitly asks
```

## 8. Gates & revision rules

- **Gate A (copy):** human reads `copy.md`; approves or marks inline edits (≤2 copy rounds)
- **Gate 1 (design):** human opens the mockup in a browser
- **Gate 2 (code):** human views the page in the running app
- Revision cap: **max 3 rounds per phase** → escalate to human with a numbered list of
  unresolved issues
- **"Not satisfied" rule:** re-run the failed phase only — never a full restart

## 9. Communication & isolation model

- **Child ↔ main agent: ALLOWED.** Children may raise `contact_supervisor`
  (`reason: "need_decision"` when blocked); the main agent replies via
  `subagent_supervisor`. Every agent prompt carries the isolation block.
- **Child ↔ sibling (same hierarchy level): FORBIDDEN.** Children have no `subagent`
  or `intercom` tools, so they cannot spawn or reach each other. No channel exists.
- **Inheritance: NONE.** All agents run with `defaultContext: fresh`,
  `inheritProjectContext: false`, `inheritSkills: false`, `systemPromptMode: replace`
  (enforced in `~/.pi/agent/extensions/subagent/config.json` + agent frontmatter).
- **Handoffs** flow through artifact files (`frontend/artifacts/<page>/`), routed
  exclusively by the main agent.

## 10. QA checklists

**Design-QA** — all brief sections present · headline/subhead/CTAs match approved copy ·
token-explicit (hex colors, type scale, spacing, radius, breakpoints) · responsive at 3
breakpoints · a11y basics (contrast, focus, semantics) · primary CTA clear & repeated
appropriately · no LLM-default aesthetics (anti-slop).

**Code-QA** — `npm run build` + lint + typecheck pass · tokens match spec · page sections
present & ordered · responsive at spec breakpoints · semantic HTML + a11y (alt, labels,
contrast) · no dead code/unused deps/console errors · content matches approved `copy.md` ·
existing pages still build (no regressions).

## 11. Orchestration

- Phase-by-phase, driven by the main agent, pausing at each gate. No workflow script
  initially; may be added later for one-shot re-runs.
- On agent failure/timeout: retry once with a narrower scope; artifact files preserve
  partial work.

## 12. Pre-steps

1. ✅ Repo restructured (frontend/, backend/, DESIGN.md moved)
2. ⬜ `BUSINESS.md` written by human (competitor site list required)
3. ✅ Playwright + fetch-page.mjs installed (or ⬜ verify)
4. ✅ 7 agent files created
5. ⬜ pi restarted so the subagents extension is active
