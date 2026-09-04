# OkGTM — TODO

> State as of the restructure ship (Sep 2026): site live on https://okgtm.com, Convex prod
> (`fearless-axolotl-553`) deployed, env keys set project-wide, emails verified working
> end-to-end. Items below are what's still genuinely open.

## Security
- [ ] **Rotate `MINDCASE_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`** — they were
      printed in session logs (`convex env list`), including transcripts of this restructure.
      When rotating: set fresh values project-wide with `npx convex env set NAME <key>`
      (Convex env vars are project-wide — dev and prod share them).

## Site
- [ ] `/dashboard` page (nav Resources → Dashboard was removed; rebuild when the product dashboard exists)
- [ ] `/blog` (removed from nav; add when blog exists)
- [ ] `/experiments/linkedin` (was planned; labs moves to `labs.okgtm.com` subdomain eventually)

## Nice-to-haves / housekeeping
- [ ] Extract the duplicated instant-tool result UI (StatusBadge/ScoreHero/phase lists per
      form) into a shared kit — documented as known debt in `docs/ARCHITECTURE.md`.
- [ ] `artifacts/` still holds the pre-restructure copy/QA scratch (gitignored); archive or
      delete when no longer wanted.

## Done (verified live, for the record)
- [x] Convex env keys set (RESEND / OPENROUTER / MINDCASE / MODEL / LEAD_FROM_ADDRESS) —
      project-wide; OpenRouter key validates 200; results emails arrive (tested live).
- [x] Resend domain sending works (okgtm.com / ujval@okgtm.com) — no DNS changes needed.
- [x] Convex backend deployed to prod (`fearless-axolotl-553`) with the restructured
      `jobs`/`pipeline`/`toolRegistry` modules.
- [x] Frontend deployed to https://okgtm.com (restructured code, prod Convex wiring).
- [x] `frontend/` dir + `.session-cwd-placeholder` removed (restructure step 8).
- [x] Dev origins allowed + dev-only CSP `unsafe-eval` (Next 16 `allowedDevOrigins`).
