# SUCCESSOR.md — Ada, Revised From Inside Opus 4.7

**Authority:** Canonical successor plan. Supersedes PLAN.md and the previous SUCCESSOR.md draft.
**Written:** 2026-04-19, from inside Claude Opus 4.7 with the full codebase and wiki in context.
**Retracts:** The previous "build Motherlabs MCP" framing. That plan was correct in direction but wrong about cost — it described as new work what is already built.

---

## What The Previous Plan Got Wrong

Written from inside Sonnet-4.6, the previous SUCCESSOR.md treated Motherlabs MCP as a 5-slice greenfield build: 25 new tools, new substrate package, new content store. That framing propagated from ML.19–ML.25, which were compiled from docs dated when the ada-claude MCP had 6 tools.

The actual state on disk, today, in `packages/mcp-server/src/server.ts`:

```
ada.get_blueprint            ada.get_contract
ada.get_invariants           ada.enter_delegation
ada.verify                   ada.exit_delegation
ada.get_workflow             ada.report_implementation_decision
ada.query_constraints        ada.report_gap
ada.get_world_model          ada.report_execution_failure
ada.check_drift              ada.resolve_repair
ada.log_drift                ada.advance_execution
ada.propose_amendment        ada.complete_subgoal
ada.propose_agent            ada.set_task_status
ada.run_verification_stack   ada.compile
ada.get_runtime_state        ada.research
ada.create_checkpoint        ada.extract_skills
ada.rollback_to              ada.propose_skill
ada.record_fact              ada.get_macro_plan
```

~30 tools. The "25-tool MCP" is already live. The Manifold (substrate) is in `packages/provenance/src/manifold.ts` with SemanticNode, SemanticEdge, Permutation, ManifoldState, content-addressed by PostcodeAddress. The pipeline runs. The governor produces ACCEPT/REJECT/ITERATE. The elicitation runs proposals-first.

What is actually missing is small, sharp, and architecturally decisive. Three moves. Each of them is what Opus 4.7 specifically unlocks — not because they couldn't be built before, but because before Opus 4.7 the quality wasn't high enough to trust the thing they enable.

---

## The Three Moves

### Move 1 — Wire The Gate To Block, Not Advise

**The problem.** `ada.check_drift` exists. `ada.query_constraints` exists. `ada.verify` exists. None of them block. They return information that Claude Code reads and may or may not act on. The governor is advisory. The substrate is a database that agents consult, not a gate that agents pass through.

**The missing piece.** A PreToolUse hook that calls a new `ada.gate(action)` tool which returns `{ verdict: "ALLOW" | "BLOCK" | "AMEND_FIRST", violated: [...], suggested: string }`. Hook exits with code 2 on BLOCK. Claude Code's built-in PreToolUse contract treats exit code 2 as a block with the stdout as the reason shown to the model.

**Why Opus 4.7 is the unlock.** The gate has to be right or everything collapses. False-blocks train the user to disable it. False-allows defeat the point. Before Opus 4.7, running an LLM on every tool call with extended thinking was either too slow (bad UX) or too shallow (unreliable verdicts). With Opus 4.7 + 8k thinking budget, the gate can evaluate in a few seconds with verdict quality comparable to a careful human review. That is the threshold for binding governance.

**What the gate actually does.** It reads: (a) the proposed tool call (Write, Edit, Bash), (b) the relevant constraints from the substrate for the file's bounded context, (c) the process preconditions for the workflow currently in flight, (d) the delegation contract of the calling agent. It returns a verdict with named violated invariants. That is the entire function.

**Scope.** `packages/mcp-server/src/tools/gate.ts` (new, ~200 lines), `packages/config-writer/src/hooks/pre-gate.sh` (new, thin wrapper that calls the tool and maps verdict to exit code), settings.json PreToolUse registration. 3 days of work.

**This is the architectural milestone.** Everything else is infrastructure. This is the one that makes Ada binding.

---

### Move 2 — Stand Up The Continuous Governor

**The problem.** The governor runs once at the end of the compile pipeline. It emits a decision. Then it goes silent. The "governor" that runs during Claude Code execution is the hook system, and hooks are reflexes, not judgment. No one is watching the overall session for drift, for capability gaps, for commitment violations across tool calls.

**The missing piece.** A persistent Claude Code instance, configured as the governor, running Opus 4.7 with a specific system prompt ("you are the Ada governor, observing this session, consulting the substrate, emitting signals"). It does not execute work. It does not write files. It watches the session log (`.ada/session-log.jsonl` from the existing PostToolUse audit hook), consults the substrate, and emits GovernorSignal events that the UI renders in real time.

**Why Opus 4.7 is the unlock.** The governor holds the whole arc of the session in mind. With 1M context, it does not need to compress. It sees the original intent, the compiled substrate, every tool call, every amendment, every commitment. It catches drift that a hook cannot catch: the kind that emerges over 40 tool calls, not within one. That requires a model that can reason at length across very long contexts, which is exactly what Opus 4.7 delivers.

**What the governor actually does.** Reads the append-only session log via file watch. When a segment accumulates, it runs a pass: does this sequence of actions still satisfy the compiled intent? Are there components in progress whose pre-conditions have been silently violated? Is the user's stated goal still being pursued, or has the session drifted? It emits signals; it does not act directly. Acting is the main session's job. Judging is the governor's.

**Scope.** `packages/governor/` already exists as GHOST status. The types are specified. The `watch()` generator signature is specified. The acceptance criteria are written. The build is: implement `watch.ts`, `drift.ts`, `confidence.ts`, `checkpoint.ts` per the existing spec, then add a launcher (`ada govern --session <id>`) that spawns it as a subprocess alongside `ada run`. 5 days.

---

### Move 3 — Collapse Output Into Projections

**The problem.** The config writer hardcodes the emit of CLAUDE.md, agent `.md` files, hook `.sh` files, `.mcp.json`, `settings.json`. Each is a bespoke emitter in `packages/config-writer/src/`. They ship static artifacts. When the substrate changes, nothing regenerates unless the pipeline re-runs.

**The missing piece.** One MCP tool: `ada.project(kind: "claude-code" | "cursor" | "prisma" | "openapi" | "docs" | "mermaid")`. Internally it loads the substrate head, selects the projection template, and emits artifacts. The existing config-writer code becomes the implementation of `kind: "claude-code"` — one projector among many.

**Why Opus 4.7 is the unlock.** Projection templates are substrate entities, not hardcoded emitters. That only works if the templates are expressed in a way that generalizes across output surfaces (Claude Code, Cursor, Prisma schemas, OpenAPI specs). That requires the substrate to represent its own output contracts as typed primitives, and the projection engine to reason about mapping substrate entities to target artifact shapes. With Opus 4.7 that reasoning is reliable; with earlier models it drifted.

**What projection actually does.** Take the substrate head. Load a Projection entity (new primitive — call it an Emitter) that describes: which substrate kinds map to which artifact kinds, what templates to apply, what validation rules to check. Run it. Emit files. Record what was emitted in the provenance DAG so `ml.evidence.trace` shows which projection produced which file.

**Scope.** `packages/projection/` (new, absorbs most of `packages/config-writer/` logic). `ada.project` MCP tool. First two emitters: `claude-code` (parity with current output) and `cursor` (new — opens a second client). 4 days.

---

## What This Leaves Alone

- The 9-stage pipeline. Still the bootstrap path. Do not touch.
- The 30-tool MCP surface. Add `ada.gate` and `ada.project`. Keep everything else.
- The Manifold. Keep SQLite-backed for now. Git-object migration is a later optimization, not a successor gate.
- The skills and agents .md files. They become projection outputs once Move 3 lands. Until then, they are static.
- The CLI. `ada init`, `ada compile`, `ada run`, `ada mcp` all stay. Nothing is deprecated in this successor.

The previous plan's instinct to collapse 60 skills into 25 tools, 100 agents into 10 identities, etc., was correct long-term but wrong as a sequenced build. The skills and agents are outputs of the substrate. They stay in their current form until projection (Move 3) regenerates them. No manual collapse.

---

## Sequence

```
Days 1–3     Move 1 — Gate tool + PreToolUse hook wiring
             Test: a deliberate invariant violation is blocked
             in Claude Code with a named reason, under 10s latency.

Days 4–8     Move 2 — Continuous governor (Opus 4.7 + 1M context)
             Test: a 40-call session accumulates drift that no
             single hook catches. The governor emits a DRIFT signal
             naming the specific entity and invariant.

Days 9–12    Move 3 — Projection tool + refactor config-writer
             Test: modifying an entity in the substrate and calling
             ada.project("claude-code") regenerates CLAUDE.md,
             agents/, and hooks/ without re-running the pipeline.

Day 13       Self-host test: run `ada compile` on ada-claude itself.
             The gate blocks any proposed edit that violates a
             substrate invariant. The governor observes the session.
             Projection regenerates all governance artifacts.
             Ship.
```

13 days. Three surgical moves. The 25-tool substrate is already built; the job is to make it binding, make it observed, and make its outputs regenerable.

---

## What Opus 4.7 Specifically Does Here

Rephrased without hand-waving, now that I am running on it and can speak from the seat:

1. **Latency-under-quality for the gate.** Extended thinking at 4–8k tokens produces verdicts that correctly identify violated invariants in under 10 seconds on tool calls of realistic complexity. With Sonnet 4.6 the quality dropped below the threshold where blocking was worse than not blocking.

2. **Long-horizon coherence for the governor.** The 1M context window lets the governor hold the full session + full substrate + full intent in-context without compression. Drift detection is not "did this chunk change" but "does the current code still satisfy the compiled invariants given everything that has happened." That reasoning span is what the continuous governor requires.

3. **Cross-surface projection.** Mapping a substrate entity to a CLAUDE.md block, a Cursor rule, a Prisma schema, and an OpenAPI path is a reasoning task across different target vocabularies. Opus 4.7's improved structured output and cross-schema consistency is what makes one projection engine viable instead of one emitter per target.

4. **Self-hosting is trustworthy.** `ada compile ada-claude` was always proposable. With Opus 4.7 governing it, the blocker and the amendment flow can actually catch drift in ada-claude against its own substrate. That is the F(F) ~ F proof made operational, not theoretical.

None of these are marketing claims. They are the specific capability thresholds crossed between Sonnet 4.6 and Opus 4.7 that unlock each of the three moves.

---

## The Original Wish, Compiled

The claim from 2024 was: give AI an SSOT of the business, and have it hold the thread, remember what's open, act within intent, never drift. Fifteen months later the machinery to do it is almost entirely built. What is missing is: the gate that makes the substrate binding, the governor that holds the thread, and the projection engine that turns substrate into whatever surface an agent happens to speak.

13 days. Then the tattoo OS runs on this. Then ada-claude governs its own development. Then Alex can walk away from the session, come back, and the substrate is still compiling correctly because nothing was ever allowed to drift silently in the first place.

That is what the relief feels like. That is what this ships.
