# FRONTEND_PLAN.md — OkGTM frontend build pipeline

Status: **approved 2026-08-23**. This document is a *summary contract* — the
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

## 4. Web access & search (agents)

Two mechanisms, both installed:

- **Playwright capture script** — `frontend/.pi/scripts/fetch-page.mjs` (used by
  `reference`): `node fetch-page.mjs <url> <outdir>` → `screenshot.png` (full-page),
  `page.html` (rendered DOM), `page.txt` (visible text). Handles JS-rendered/SPA sites;
  the screenshot powers visual analysis. Lives in the `@okgtm/agent-tools` workspace member.
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
        ├── refs/            ← raw captures per competitor (screenshot.png, page.html, page.txt)
        ├── refs/<competitor>.md  ← per-competitor consolidated analysis (design + copy)
        ├── refs_design.md   ← merged DESIGN insights for the page (→ frontend-coder)
        ├── refs_copy.md     ← merged COPY insights for the page (→ copywriter)
        ├── copy.md          ← approved copy (content contract; Gate A)
        └── code-qa-report.md← QA verdict + issues (Gate 2 input)
```

## 6. Agents (project-scoped, `frontend/.pi/agents/`)

| Agent | Model | Thinking | Purpose & Output |
|---|---|---|---|
| `reference` | sonnet-5 | medium | Finds/captures competitor pages for the target page (fetch script + web_search). Writes `refs/<competitor>.md` (structure, verbatim copy inventory, hierarchy/flow, social proof, objection handling, design notes, psychology tags, verdict/steal/avoid, soul read) and consolidates into `refs_design.md` + `refs_copy.md`. Never invents content — quotes only. |
| `copywriter` | sonnet-5 | high | Writes `copy.md` from `refs_copy.md` + BUSINESS.md. Beats competitors on a named axis; facts traceable to BUSINESS.md or cited sources (`[NEEDS: …]` for gaps — never fabricate). Never copies competitor phrasing. |
| `frontend-coder` | opus-4-6 | medium | Builds the page at `app/<page>/page.tsx` from `refs_design.md` + `copy.md` per DESIGN.md + SKILL.md. Scaffolds app if missing; pnpm; verbatim copy; self-audit before finishing. |
| `code-qa` | sonnet-5 | medium | Independent quality gate: pnpm build/lint/typecheck, copy fidelity, section coverage, SKILL.md anti-slop rules, responsive, a11y, hygiene, regressions. Writes `code-qa-report.md` (PASS/FAIL, severity, file:line). Round cap 3 → **FAIL — ESCALATE**. |
| `animator` | opus-4-6 | medium | **Explicit request only.** Adds restrained motion (CSS first, Framer Motion when needed) to an approved page. Reduced-motion mandatory; scope changes reported, never silently implemented. |

## 7. Pipeline (per page)

```
STEP 0  MAIN: target page P from the human's request → reads BUSINESS.md + DESIGN.md
        → defines the page contract IN THE TASK TEXT (sections, per-section goals,
          audience, primary CTA) — no brief.md file; every child gets it inline
STEP 1  REFERENCE — parallel, one run per competitor:
        via fetch-page.mjs + web_search → refs/<competitor>.md
        → consolidated by the reference agent itself into refs_design.md + refs_copy.md
STEP 2  COPYWRITER → copy.md from refs_copy.md     [GATE A: manual, light review]
STEP 3  FRONTEND CODER → page at app/<P>/page.tsx from refs_design.md + copy.md
                                                    [GATE 1: manual — screenshots in chat + running page]
STEP 4  CODE-QA loop (≤3 rounds, then ESCALATE)     [GATE 2: manual — final review of running site]
STEP 5  ANIMATOR — only if the human explicitly asks
```

## 8. Gates & revision rules

- **Gate A (copy):** human reads `copy.md`; approves or marks inline edits (≤2 copy rounds)
- **Gate 1 (design, on real code):** human views the running page — main agent posts
  Playwright screenshots at 3 breakpoints in chat; human can also open the dev server
- **Gate 2 (final):** human reviews the code-qa'd page in the running app
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
   `prefers-reduced-motion`, dark-mode contrast
7. **Hygiene**: no dead code, unused imports/deps, console errors, broken links
8. **No regressions**: previously built pages still build and render

Severity: **blocker** = build/lint/typecheck failure, missing/misordered section, copy
drift, any SKILL.md violation, a11y failure · **minor** = everything else (never blocks).

## 11. Orchestration

- Phase-by-phase, driven by the main agent, pausing at each gate. No workflow script
  initially; may be added later for one-shot re-runs.
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
