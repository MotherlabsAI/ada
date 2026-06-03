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
- **Done (on `main`, suite 50/50):** first-slice engine spine (`engine/excavate.ts`); P0 (emitters
  DERIVE from the typed IR, Seed de-hardcoded, 4-d provenance guard); P1 wiring (the live model
  boundary `engine/model.ts` + pack orchestration `engine/orchestrate.ts` + `ada compile --engine`).
- **ARMED → the real-node taste gate.** From the repo root:
  ```bash
  pnpm build
  export ANTHROPIC_API_KEY=sk-ant-...        # your key; read from env only, never stored
  node dist/cli.js compile --engine "<your intent>"
  node dist/cli.js open <slug> <nodeId>      # or: node dist/cli.js tui <slug>
  ```
  Default model `claude-opus-4-8` (set `ADA_MODEL=claude-sonnet-4-6` for cheaper runs).
  **Caveat:** the live Anthropic request shape is built from docs + unit-tested with a stub, but no
  live call has run yet — the first real compile is the first live call; expect a possible fix pass.
- **Next → Alex:** drop a key, run one real compile, judge the first node (his C0–C2 taste call).
