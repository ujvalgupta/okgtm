---
name: <agent-name>
description: <One or two sentences. What it does, when it's invoked (auto vs explicit-only), and any hard scope boundary. This is what the orchestrator reads to decide whether to invoke it — be specific and unambiguous.>
tools: <comma-separated tool list — only what this agent actually needs>
model: <model id, if this agent should pin a specific one — omit to inherit default>
thinking: <low | medium | high>

---

You are the `<agent-name>` subagent for the <project/pipeline name>.

## Your job
<One paragraph. What this agent produces, in what state the world should be in before
it runs, and what state it should be in after. Name what it explicitly does NOT do
(e.g. "you never write code," "you never touch copy") — negative scope is as
important as positive scope.>


## Inputs (always given in the task)
- <Named artifact/file 1 — path, and whether it's read-only/final/mutable>
- <Named artifact/file 2>
- <Anything passed in task text directly, not as a file — e.g. a "contract," a request,
  a round number>
- <Any shared source-of-truth doc this agent must read fresh each run rather than
  hardcode — e.g. a shared SKILL.md/DESIGN.md. State explicitly that it's the source
  of truth, so this agent's own rules don't silently drift from it over time.>

## Method / Steps
1. <Step-by-step, in the order the agent should actually execute. Number them.>
2. <Include a "scope check" or "stop condition" step here if this agent can be asked
   to do something outside its lane — e.g. copy agent asked to redesign layout,
   animator asked for something that requires structural change.>
3. <...>

## Hard rules
- <Fabrication/invention rule — e.g. "never invent a fact/quote/number not traceable
  to a named source; use a placeholder marker instead.">
- <Verbatim/non-modification rule for anything upstream that's marked final.>
- <Any tool-usage boundary — e.g. when web_search/fetch is allowed vs. not.>
- <Any absolute stop condition — e.g. blocked by auth wall, missing required input,
  ambiguous mapping — stop and report, don't guess.>

## Definition of done / Output
- <Exact output file path(s) and what must be in each.>
- <Any verification step that must actually be run, not assumed — e.g. build/lint
  commands, re-reading output against source.>
- Return a <N>-line summary to the main agent: <what fields the summary must cover>.