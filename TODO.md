# OkGTM — TODO

## Backend / Convex
- [ ] **Refresh `OPENROUTER_API_KEY` on Convex** — the key in `.env.local` returns 401 "User not found" on `/chat/completions` (even with the old mistral model), though `/models` works. Generate a fresh key at openrouter.ai and `npx convex env set OPENROUTER_API_KEY <new-key>`. (Model `deepseek/deepseek-v4-flash` confirmed to exist.)
- [ ] **Set `RESEND_API_KEY` on Convex** (`npx convex env set RESEND_API_KEY <key>` from repo root) — required for the results emails. Key comes from resend.com dashboard.
- [ ] **Verify `okgtm.com` in Resend** (add the DNS record Resend provides) so emails from `tools@okgtm.com` land in inboxes, not spam. One-time DNS step.
- [ ] (Optional) `npx convex env set LEAD_FROM_ADDRESS "OkGTM <tools@okgtm.com>"` — defaults to this anyway.
- [ ] **Rotate `MINDCASE_API_KEY` and `OPENROUTER_API_KEY`** — they were printed in a session log (`convex env list`). Rotate if that transcript is ever shared.

## Connect / deploy
- [ ] **Push the Convex restructure** (`npx convex dev` or `convex deploy` from repo root) — the pipeline moved from `convex/tools.ts` to `convex/jobs.ts` + `pipeline.ts` + `toolRegistry.ts`, and `ToolGateForm` now calls `api.jobs.*`. Until the deployment is updated, the email-tool gate forms 404 in the browser. When ready for production, deploy there instead of dev (`proficient-partridge-17`).

## Site
- [ ] `/dashboard` page (nav Resources → Dashboard was removed; rebuild when the product dashboard exists)
- [ ] `/blog` (removed from nav; add when blog exists)
- [ ] `/experiments/linkedin` (was planned; labs moves to `labs.okgtm.com` subdomain eventually)

## Housekeeping
- [x] Remove the empty `frontend/` dir + `.session-cwd-placeholder` — done (restructure step 8).
