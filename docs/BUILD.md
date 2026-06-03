# BUILD — how Ada gets built (the loop)

The repeatable mechanism that turns the frozen plan into the base. Re-runnable and
fork-friendly: this is the "loop mode" the build runs under, and the durable record of how
to build on top later.

## Inputs

- **Plan:** [`docs/FREEZE.md`](./FREEZE.md) — the one build, 6 phases, the first slice.
- **Law:** [`../AXIOMS.md`](../AXIOMS.md) frozen-v2 — hard constraints + the human-gate map.

## The loop (loop mode)

Build proceeds as a continuous subagent-driven loop. Per task:

> implement (TDD: red → green) → spec-compliance review → code-quality review → commit

**No check-in between mechanical tasks.** The loop stops ONLY at the `AXIOMS.md` human-gate
map:

| Surface                                                                           | Who                  |
| --------------------------------------------------------------------------------- | -------------------- |
| Pack filesystem, `graph.json`, node markdown, manifest, C checks, exports (C3–C5) | **Ada — autonomous** |
| "First node must impress" / anti-generic / taste (C0–C2)                          | **Alex**             |
| C _correctness_ (does the check encode the RIGHT invariant?)                      | **Alex**             |
| The bounded claim A8 (does the pack actually help?)                               | **Alex**             |

So Alex is pulled back in only for: the **first impressive node**, an **MVP he can test**, a
**genuine fork**, or a **BLOCKED** state. Everything else runs without him.

## Bootstrap → dogfood → scale (honest sequencing)

You cannot dogfood an engine that does not exist. So:

1. **Bootstrap** (conventional build): first slice → P0 typed-IR contract → P1 U2F engine.
2. **Dogfood:** once the engine produces quality nodes, run **Ada on Ada's own intent** → it
   compiles Ada's own pack → that pack drives P2–P5. This run is **also the A8 proof**.
3. **Scale:** thereafter every refinement / fork is compiled **through Ada itself**.

## State

- **frozen-v2 ratified** (2026-06-03): A3 D1/D2, A1/A2 D3, A7 amended (any knowledge), new A9.
- **Mechanical spine COMPLETE on `main`, suite 111/111:** engine spine (`engine/excavate.ts`) · P0
  derive-from-IR (Seed de-hardcoded, 4-d provenance) · P1 live wiring (`engine/model.ts`,
  `engine/orchestrate.ts`, `ada compile --engine`) · depth (many nodes/cluster, global dedup) · P3
  guardrails (salience budget + model-free density C, defeasible edge, compaction shape) · P5 Obsidian
  `[[wikilinks]]` portability · P6 runnable-from-any-cwd + `--depth`/`--model` · P7 domain-adaptive
  clustering (areas derived from the intent; the "compile any knowledge" unlock).
- **Real compiles work, from any directory** (after `pnpm build`):
  ```bash
  ANTHROPIC_API_KEY=sk-ant-... node <repo>/dist/cli.js compile --engine "<intent>" [--depth=N] [--model=…] [--clusters=A,B,C]
  node <repo>/dist/cli.js tui <slug>     # explore the pack; or open it as an Obsidian vault
  ```
  Default model `claude-opus-4-8`; `--depth`/`--model`/`ADA_MODEL` control cost.
- **Verified-live dogfood artifacts on disk** (`.ada/packs/`, untracked — regenerate on demand):
  `ada-website` (21 nodes, marketing-domain clusters fit) · **`ada` (Ada-on-Ada, 22 nodes** — the engine
  chose its own areas `ROOT/EXCAV/GRAPH/EMIT/RUBRIC/RUNTIME/UNK`, almost all with real κ checks; nodes map
  onto the axioms; `UNK.003` independently named the "needs an external witness" self-model gap).
- **Autonomous runway spent** — the remaining work is taste-gated or executor-side.
- **PARKED for Alex (C0–C2 taste / verdict):** P2 `ctx init` interview _feel_ (picture-questions ready) ·
  P4 editable graph playground · the **A8 verdict** (does the pack make Claude Code measurably better —
  the experiment runs on an executor, not inside Ada).
