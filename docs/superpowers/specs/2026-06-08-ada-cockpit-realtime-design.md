# Ada cockpit: real-time compile in the Claude Code transcript

**Date:** 2026-06-08
**Status:** Design approved — ready for planning
**Topic:** Make `ada` a control panel where the user gives intent and Claude monitors the
compile live, in the Claude Code transcript. Plus recommendations for better output.

---

## 1. Problem

A Claude Code user can already give Ada an intent (`/ada compile`), and afterwards read the
result (`view` / `deeper` / `pom` / `list`). What they **cannot** do is _watch the compile run_.

`engineCompile()` runs ~10–30 model calls synchronously and is **opaque**: no callbacks, no
progress events, no file an observer can read. The CLI prints one dense summary at the end
(`cli.ts:359–418`); the Ink TUI's `Compiling` component gets a single static `phase` string the
parent never updates during execution. So a compile is a black box from launch to completion —
for the CLI, the TUI, and any Claude Code session alike.

Everything the user asked for (give intents · watch agents run · see schema-graph trees · read
context · see info real-time) already half-exists **except the real-time spine**. The keystone
is therefore not UI — it is _making the engine emit progress as it runs_. Once that stream
exists, the transcript view, a watch command, and "better output" all fall out of it.

## 2. Decisions (resolved during brainstorming)

| Fork                          | Decision                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which surface is the cockpit? | **The Claude Code transcript.** No standalone Ink app work.                                                                                                |
| Who drives the live render?   | **Claude polls & re-renders** in the transcript (the user explicitly wants to "monitor ada compiling using claude"). A cheap CLI snapshot backs each poll. |
| Scope shape                   | **Keystone-first**, 3 slices. Slice 1 is independently useful.                                                                                             |

## 3. Non-goals (YAGNI)

- **No Ink TUI changes.** The user chose the transcript surface.
- **No new graph-browsing UI.** `view` / `deeper` / `pom` already read context; they inherit the
  better renderer, not a rewrite.
- **No change to the compile pipeline semantics** (FREEZE.md §4 contract: seed → propose (1 call)
  → excavate (N calls) → assemble (gated, model-free) → write). We only _observe_ it.

## 4. Architecture — three layers, built bottom-up

### Layer ① — The progress spine (keystone) · `src/compile/engine/`

`engineCompile()` gains an optional `onProgress(event: ProgressEvent) => void` sink, defaulted to
a no-op so existing callers are unaffected. It is threaded through the phases the engine already
has: `normalize → propose → excavate (per-cluster) → assemble → write`.

**Event types** (`ProgressEvent`, discriminated union on `kind`):

| kind          | payload                                              | emitted from                                       |
| ------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `phase_start` | `{ phase, label, callsTotal? }`                      | each phase boundary                                |
| `phase_done`  | `{ phase, nodes? }`                                  | each phase boundary                                |
| `call_start`  | `{ phase, index, total }`                            | model client wrapper                               |
| `call_done`   | `{ phase, index, inTok, outTok, cacheTok, costUsd }` | hooked at the existing `meter` in `model.ts:50–87` |
| `node_added`  | `{ id, label, cluster, truth }`                      | excavate/assemble                                  |
| `residue`     | `{ count }`                                          | assemble                                           |
| `done`        | `{ totals }`                                         | end of `write`                                     |
| `error`       | `{ phase, message }`                                 | catch path                                         |

**Token/cost source:** the model client already accumulates usage in `meter` (`model.ts:50–87`).
We hook the same point to emit `call_done` — no new accounting, just surfacing what's measured.

**The sink → two files**, written into the pack dir (`src/pack/layout.ts` `paths()`):

- `.compile-progress.json` — a **single snapshot**, rewritten atomically (write temp + rename) on
  each event. This is what watchers read; cheap to poll, no parsing of a growing log.
- `.compile-progress.jsonl` — append-only event log, for replay/audit.

Both are **gitignored** (add to `.gitignore` alongside the existing `.ada` rules; same treatment
as the volatile `.state.json`).

**Snapshot schema** (`.compile-progress.json`):

```jsonc
{
  "slug": "support-ticket-triage",
  "intent": "a tool that triages support tickets",
  "status": "running", // running | done | error
  "startedAt": "2026-06-08T...", // ISO; engine is normal Node code, Date is fine here
  "updatedAt": "2026-06-08T...",
  "phase": "excavate",
  "phases": [
    {
      "id": "propose",
      "label": "propose clusters",
      "status": "done",
      "calls": 1,
      "callsTotal": 1,
      "nodes": 6,
    },
    {
      "id": "excavate",
      "label": "excavate",
      "status": "running",
      "calls": 4,
      "callsTotal": 7,
      "nodes": 31,
      "clusters": [
        {
          "id": "INTAKE",
          "status": "done",
          "calls": 2,
          "callsTotal": 2,
          "nodes": 9,
        },
        {
          "id": "ROUTING",
          "status": "running",
          "calls": 2,
          "callsTotal": 3,
          "nodes": 12,
        },
        {
          "id": "SLA",
          "status": "queued",
          "calls": 0,
          "callsTotal": 2,
          "nodes": 0,
        },
      ],
    },
  ],
  "totals": {
    "nodes": 31,
    "edges": 44,
    "residue": 3,
    "calls": 5,
    "inTok": 0,
    "outTok": 0,
    "cacheTok": 0,
    "costUsd": 0.41,
  },
  "lastError": null,
}
```

The per-cluster breakdown under the `excavate` phase is what makes "watch agents run" legible —
each cluster excavation is the unit a user reads as "an agent."

### Layer ② — `ada watch <slug>` (new CLI subcommand) · `src/cli.ts`

A new `cmdWatch()` dispatched from `main()`'s switch:

- **default (TTY):** smooth in-place ANSI redraw — poll `.compile-progress.json` ~500ms, render
  the live tree using the **existing** `paint`/glyph palette and the SURFACE-DESIGN.md compile
  heartbeat. Exits when `status` is `done`/`error`.
- **`--once`:** print one snapshot of the live tree and exit. This is the cheap call Claude makes
  each poll tick.
- **`--json`:** print the raw snapshot JSON (deterministic parsing for the skill / scripts).
- **non-TTY:** degrade to line-appended updates (no cursor control), so it is safe in pipes/logs.
- **no progress file yet** (compile not started / never run): print a clear "no compile in
  flight for `<slug>`" and exit non-zero.

This subcommand is useful on its own: `! ada watch <slug>` in the user's own terminal gives a
true real-time view independent of any Claude loop.

### Layer ③ — The `/ada` monitor loop (the skill) · `scripts/ada-bootstrap.mjs` (+ generated `.claude/commands/ada.md`, `ada-compile.md`)

- **`compile` verb** (update existing): launch the engine compile in the **background** (as
  today), then enter a **monitor loop** — every ~20–30s via `ScheduleWakeup`, run
  `ada watch <slug> --once` and reprint the austere live tree in the transcript. The background
  task's completion notification ends the loop; on `done` → render `ada pom <slug>` + the tree
  (`wiki/index.md`), exactly as today. This is "monitor ada compiling using claude."
- **`watch <slug>` verb** (new, read-only): maps 1:1 to `ada watch <slug> --once` for
  re-attaching to an in-flight compile or re-rendering the last snapshot. Honors the
  read-only-verbs-never-mutate rule.
- Cadence is a deliberate token-cost trade: ~20–30s, not tighter. Each tick is one small tool
  result (the snapshot), not a re-scrape of stdout.

## 5. Better-output recommendations (folded into Slice 3)

1. **Shared live-tree renderer.** One function renders the `◈ compiling` tree; both `ada watch`
   and the `/ada` skill call it. Single source of truth for the live view.
2. **Restructured final report.** Replace the dense `console.log` block (`cli.ts:359–418`) with a
   scannable result: tree · totals · residue Ω · suggested next verbs. Reuses the live-tree
   renderer in its terminal state.
3. **`ada compile --json`.** Emit the final result as JSON in addition to the human report, so the
   skill renders deterministically instead of scraping stdout.
4. **Residue first-class** in the live view (`3 Ω open`), never buried — honoring "a hole beats a
   lie."

## 6. Scope — 3 slices

- **Slice 1 (keystone):** progress spine (`onProgress` seam + event types + snapshot/jsonl sink)
  and `ada watch <slug>`. **Independently shippable** — `! ada watch <slug>` works immediately.
- **Slice 2:** `/ada` monitor loop + the `watch` verb in the bootstrap/skill.
- **Slice 3:** better-output (shared live-tree renderer · restructured report · `--json`).

## 7. Risks & mitigations

| Risk                                           | Mitigation                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `onProgress` threading touches hot engine code | Default no-op sink; events are fire-and-forget; no behavior change when sink absent.                                                 |
| Snapshot file write races with a reader        | Atomic write (temp + rename); readers tolerate a momentarily-missing file.                                                           |
| Token cost of Claude polling a long compile    | ~20–30s cadence; each tick is one small `--once` snapshot; completion notification (not polling) is the authoritative "done" signal. |
| `callsTotal` unknown before propose runs       | `callsTotal` is optional; render a spinner/`?` until known, fill in once clusters are proposed.                                      |
| Skill lives in a generated file                | Source of truth is `scripts/ada-bootstrap.mjs`; edit there and re-bootstrap, do not hand-edit generated `.claude/commands/*.md`.     |

## 8. Acceptance (per slice)

- **Slice 1:** running an engine compile produces a live-updating `.compile-progress.json`;
  `ada watch <slug>` shows phases, per-cluster excavation, live token/cost, and exits on done.
  Existing callers of `engineCompile()` are unchanged (no-op sink).
- **Slice 2:** `/ada compile <intent>` launches in background and the transcript shows the live
  tree refreshing on cadence, ending with `pom` + tree on completion. `/ada watch <slug>` renders
  the current snapshot.
- **Slice 3:** `ada watch` and the skill share one renderer; the final report is the restructured
  format; `ada compile --json` emits valid JSON.
