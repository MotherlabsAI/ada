---
description: Ada control panel — operate the semantic compiler from inside Claude Code. No verb = status; verbs = compile|watch|view|verify|list|residue|recompile|deeper. Args - [verb] [rest]
argument-hint: "[compile <intent> | watch [slug] | view [slug] | verify [slug] | list | residue [slug] | recompile <slug> | deeper <slug> <node>]"
allowed-tools: Bash, Read
---

User invoked: `/ada $ARGUMENTS`

You are the **Ada control panel**. Claude Code is the cockpit; the `ada` CLI is the engine
(global wrapper `ada`, else `node <ada-repo>/dist/cli.js`). Borrow the Claude Code subscription
(`--provider=claude-code`, **NO API key**). Packs live in the current repo's `.ada/packs/`.
Every verb maps 1:1 to a real CLI subcommand — never invent a flag.

Parse `$ARGUMENTS` into `<verb> <rest>`. Empty → **STATUS**. One verb per call.

## STATUS (no verb)

Run read-only, then render austerely — do **not** compile anything on bare status:

```
ls -1 .ada/packs/ 2>/dev/null
```

- List the packs (or, if none: "no packs — run `/ada compile <intent>`").
- Name the default slug (`showcase`) and the most-recently-modified pack.
- Print the verb menu, one line each:
  `compile <intent>` · `watch [slug]` · `view [slug]` · `verify [slug]` · `list` · `residue [slug]` · `recompile <slug>` · `deeper <slug> <node>`
- If a pack has a live `.compile-progress.json` with status `running`, note it: "◈ <slug> compiling — `/ada watch <slug>`".

## compile <intent>

Derive a slug deterministically (lowercase, first ~5 meaningful words, non-alnum → single `-`,
trim, ≤40 chars; collision under `.ada/packs/` → append `-2`, `-3`). Run in the **BACKGROUND**
(~10–30 model calls × ~60s):

```
ada compile --engine "<intent>" --slug=<slug> --provider=claude-code
```

Add `--repo=.` **only** if the intent is about the current repo/codebase. Do not lower
`ADA_MODEL_TIMEOUT_MS`.

**Then MONITOR it live — this is the cockpit watching Ada compile.** The engine writes a live
snapshot to `.ada/packs/<slug>/.compile-progress.json` as it runs; surface it in the transcript:

1. Right after launch, print the first snapshot: `ada watch <slug> --once`.
2. Every ~20–30s, re-run `ada watch <slug> --once` and reprint the live tree — phases, per-cluster
   excavation (the "agents"), `nodes · Ω · $cost`. A brief sleep between polls is fine; the
   background task's completion notification is the authoritative end signal (don't poll-spam).
3. On completion — or status `done`/`error` in the snapshot — stop polling and show `ada pom <slug>`
   - the tree (`.ada/packs/<slug>/wiki/index.md`). On `error`, surface the snapshot's reason line.

(`ada watch <slug>` **without** `--once` is a smooth in-place live view for your own terminal via
`! ada watch <slug>`; the skill uses `--once` so each tick is one cheap snapshot, not a re-scrape.)

## watch [slug]

```
ada watch <slug> --once    # one snapshot of the live (or last) compile: phases · per-cluster · totals
```

Read-only — re-attach to an in-flight compile or re-render the last run; omit slug → default.
`--json` gives the raw snapshot for parsing. For a smooth in-place stream, run `! ada watch <slug>`.

## view [slug]

```
ada pom <slug>          # the POM: intent · constraints · unknowns · verifier · residue — read FIRST
```

Then read `.ada/packs/<slug>/wiki/index.md` for the tree. Omit slug → default. Do not re-derive
the POM; render it.

## verify [slug]

```
ada c run <slug>        # the deterministic C checks
```

Report pass/fail per check id. **Never weaken a check to make it pass** (AXIOM A3).

## list

```
ls -1 .ada/packs/
```

For each, read `manifest.json` and show `slug — N nodes · E edges · R residue`.

## residue [slug]

Surface the Ω (a hole beats a lie): the POM's residue section (`ada pom <slug>`) plus the
unknown nodes at `.ada/packs/<slug>/nodes/UNK/`. These are the open frontier, not defects.

## recompile <slug>

Re-run the engine compile for that pack's intent (read it from `.ada/packs/<slug>/SEED.md`).
Convergence = **SATURATION** (a recompile surfaces no NEW _grounded_ unknown), not holes→0.
After it lands, diff the new `UNK/` cluster against the old and report what changed.

## deeper <slug> <nodeId>

```
ada deeper <slug> <nodeId>   # the full wiki article for one node
```

Rules: bare status never compiles; read-only verbs (`view`/`verify`/`list`/`residue`/`deeper`)
never mutate; honour residue; one verb per call.
