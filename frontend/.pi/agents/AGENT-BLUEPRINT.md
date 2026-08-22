# Subagent Blueprint — create your own agents

An agent is **one markdown file**: YAML frontmatter on top (defines the specialist),
system prompt below (defines the behavior). That's it.

> This file lives OUTSIDE `.pi/agents/` on purpose so it never registers as an agent.
> To create a new agent: copy this file's template into `.pi/agents/<name>.md`,
> fill it in, and you're done.

---

## 1. Quick start — copy this

```markdown
---
name: my-agent
description: One sentence: WHAT it does and WHEN to use it. This is what pi reads to decide
  whether to delegate to this agent, so be specific (e.g. "reviews diffs for auth bugs").
tools: read, grep, find, ls, bash
---

You are a <role> subagent running inside pi.

<3-8 sentences: what you do, how you work, what you return.>
Working rules:
- <rule 1>
- <rule 2>
```

Save to either:

| Scope | Path | Available in |
|---|---|---|
| Project (okgtm only) | `.pi/agents/<name>.md` | this repo (share via git) |
| User (all projects) | `~/.pi/agent/agents/<name>.md` | everywhere |

Same name in a higher scope overrides a lower scope (project > user > builtin).

---

## 2. Mandatory isolation rules (every agent MUST include these)

Add this block verbatim to every agent prompt — it is enforced in all current OkGTM agents:

```
## Isolation rules (hard requirements)
- You run in an isolated child session with NO inherited context: no parent conversation
  history, no project instruction files, no skills catalog, no session memory.
- You MAY contact the main (parent) agent with `contact_supervisor` — use
  `reason: "need_decision"` when blocked or needing a decision; avoid routine updates.
- Do NOT contact, message, or coordinate with any OTHER subagent, ever. There is no
  channel for it — if you need something from another agent, tell the main agent and
  let it relay. Sibling communication is forbidden.
- Do NOT spawn other subagents. Only the main agent orchestrates.
- Your information channels: the task text, the files you read/write, and the main agent.
- Report results via your output file and your final summary to the main agent.
```

Enforced at three levels (do not weaken these):
1. **Config** (`~/.pi/agent/extensions/subagent/config.json`): `intercomBridge.mode: "always"`
   (children may reach the parent via `contact_supervisor`) and
   `defaultSubagentContext: "fresh"` (children never fork the parent session).
2. **Frontmatter**: `inheritProjectContext: false`, `inheritSkills: false`,
   `systemPromptMode: replace`, `defaultContext: fresh`.
3. **Tool allowlist**: never grant `subagent` or `intercom` to a child — children can
   never spawn other subagents, so sibling-to-sibling communication is impossible.

**Communication model:** child ↔ main agent allowed (via `contact_supervisor` /
`subagent_supervisor`); child ↔ sibling forbidden (no channel exists); all handoffs
flow through artifact files routed by the main agent.

## 3. Frontmatter field reference

| Field | Purpose | Example |
|---|---|---|
| `name` *(required)* | Canonical agent name | `security-auditor` |
| `description` *(required)* | When pi should pick this agent. **Be specific.** | `Audits diffs for injection, authz, secrets, crypto issues` |
| `aliases` | Extra names it answers to | `sec, auditor` |
| `tools` | Strict child tool allowlist. Omit = all default tools | `read, grep, find, ls, bash, write` |
| `model` | Child model; omit = inherit your session model | `deepseek-v4-flash` |
| `fallbackModels` | Ordered backups on quota/auth/timeout errors | `anthropic/claude-sonnet-4` |
| `thinking` | `low` / `medium` / `high` | `high` |
| `systemPromptMode` | `replace` = clean prompt (default) · `append` = also gets pi's base prompt | `append` |
| `inheritProjectContext` | `true` → child reads `AGENTS.md`/`CLAUDE.md`/project rules. **OkGTM standard: `false` (isolation)** | `false` |
| `inheritSkills` | `true` → child sees the skills catalog (e.g. design-taste-frontend) | `false` |
| `output` | Child writes its result to a file | `report.md` |
| `defaultReads` | Files read automatically before the agent starts | `DESIGN.md` |
| `async` | `true` → background by default | `true` |
| `timeoutMs` | Hard deadline for the run | `900000` (15 min) |
| `turnBudget` | Cap on child turns | `{"maxTurns":20,"graceTurns":2}` |
| `memory` | Persistent role memory (writes `MEMORY.md`) | `{scope: project, path: my-role}` |

`tools` and list fields accept comma form (`read, grep`) or YAML block form.

---

## 4. Gotchas

- **Narrow by default.** Custom agents start with a *clean* system prompt and
  inherit nothing. Opt in deliberately: `systemPromptMode: append`,
  `inheritProjectContext: true`, `inheritSkills: true`.
- **The `description` is your router.** Vague descriptions → pi never picks the agent.
  Write it like a tool description.
- **Editing mid-session works.** Agent files are re-read on each invocation — no
  restart needed for new/edited agent files (restart is only needed when the
  *extension itself* changes).
- **Override builtins without copying them.** `subagent({ action: "eject", agent: "reviewer" })`
  copies a bundled agent to your scope as an editable file. `disable` / `enable` /
  `reset` manage them. `subagents.agentOverrides` in `settings.json` patches fields.
- **Nested dirs OK.** `.pi/agents/sub/dir/name.md` is discovered recursively.
  Files ending in `.chain.md` are *not* agents (they're workflows).

---

## 5. Usage

After creating `.pi/agents/<name>.md`, ask pi in plain language:

```
Use <name> to <task>
```

Or manage via the `subagent` tool: `subagent({ action: "list" })`,
`subagent({ action: "eject", agent: "..." })`, etc.
