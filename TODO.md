# OkGTM — TODO

## Backend / Convex
- [ ] **Refresh `OPENROUTER_API_KEY` on Convex** — the key in `.env.local` returns 401 "User not found" on `/chat/completions` (even with the old mistral model), though `/models` works. Generate a fresh key at openrouter.ai and `npx convex env set OPENROUTER_API_KEY <new-key>`. (Model `deepseek/deepseek-v4-flash` confirmed to exist.)
- [ ] **Set `RESEND_API_KEY` on Convex** (`npx convex env set RESEND_API_KEY <key>` from repo root) — required for the results emails. Key comes from resend.com dashboard.
- [ ] **Verify `okgtm.com` in Resend** (add the DNS record Resend provides) so emails from `tools@okgtm.com` land in inboxes, not spam. One-time DNS step.
- [ ] (Optional) `npx convex env set LEAD_FROM_ADDRESS "OkGTM <tools@okgtm.com>"` — defaults to this anyway.
- [ ] **Rotate `MINDCASE_API_KEY` and `OPENROUTER_API_KEY`** — they were printed in a session log (`convex env list`). Rotate if that transcript is ever shared.

## Connect / deploy
- [ ] `npx convex deploy` when ready to push to the production Convex deployment (currently on dev deployment `proficient-partridge-17`).

## Site
- [ ] `/dashboard` page (nav Resources → Dashboard was removed; rebuild when the product dashboard exists)
- [ ] `/blog` (removed from nav; add when blog exists)
- [ ] `/experiments/linkedin` (was planned; labs moves to `labs.okgtm.com` subdomain eventually)

## Housekeeping
- [ ] Remove the empty `frontend/` dir + `.session-cwd-placeholder` (session shell-cwd artifact) after the pi session restarts at the repo root.
