# Bounded Self-Application — the bound, made enforceable

Ada applied to Ada (self-application) is safe only if the recursion **converges**
instead of diverging. Convergence requires a **frozen quotient** (a core the loop may
not rewrite), a **monotonic ratchet** (never regress below the last passing state), and
an **explicit stop**. This file binds each bound to its enforcing artifact, and marks —
honestly — which bounds are mechanical and which are human-gated. A human gate disguised
as a mechanical check is itself an AXIOM A3 violation, so we do not fake one.

> Validity here = the conjunction of B1–B7 holding. A bound with no enforcer is a hole,
> not a rule. §Coverage proves none is unenforced.

## The seven bounds

| #      | Bound                                                                                       | AXIOM  | Enforcing artifact                                                                                                                                    | What it blocks / does                                                                    | Kind                                       |
| ------ | ------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| **B1** | Frozen quotient — the AXIOMS are immutable under self-application                           | A1, A4 | `.claude/hooks/pretooluse-guard.mjs` blocks live edits to `AXIOMS.md`; a change requires an explicit, human-ratified **AXIOMS delta**                 | a silent agent rewrite of the fixed core (the thing that makes recursion converge)       | **mechanical** (block) + **human** (delta) |
| **B2** | Re-compile, not live mutation — the deterministic layer changes only by re-compile          | A1     | same guard, extended to artifacts marked `STATUS: immutable` / `<!-- ADA:FROZEN -->`                                                                  | editing a frozen blueprint/C artifact in place instead of recompiling                    | **mechanical** (block)                     |
| **B3** | Monotonic ratchet — never freeze a state below the last passing one                         | I7     | `.claude/commands/ratchet.md` (`/ratchet`): runs the suite + coherence verify; refuses (non-zero) on any red                                          | committing/freezing a regression                                                         | **mechanical** (gate)                      |
| **B4** | Provenance / no self-lie — every artifact traces to input; no claimed backing it lacks      | A2     | `src/export/coherence.ts` (`assertBackingHonest`, fail-closed in the writer) + `ada c` checks                                                         | writing a pack that claims a runnable backing it does not ship                           | **mechanical** (in-code, shipped)          |
| **B5** | Execution stays out — Ada compiles context; it never autonomously executes its own mutation | A6     | policy + the executor is the human-gated `/loop`, not Ada itself                                                                                      | Ada becoming a runaway self-builder (the MOTHER-OS failure mode)                         | **policy** + **human gate**                |
| **B6** | Depth + stop — the recursion has a deterministic convergence measure and halt-predicate     | I9     | `src/governance/mu.ts` — μ = #open holes within the frozen scope; `haltReason` halts on converged (μ=0) ∨ stalled (μ not strictly ↓) ∨ fuel-exhausted | unbounded re-entry / `Ω = (λx.xx)(λx.xx)` divergence; non-progress loops                 | **mechanical** (measure + predicate)       |
| **B7** | Human gate at the boundary — taste, AXIOM deltas, the value verdict are Alex's              | A4     | Alex. (An honest hole — not mechanizable, not faked.)                                                                                                 | promoting a C0–C2 judgment as if it were deterministic                                   | **human-gated**                            |
| **B8** | Preserve the quotient through compaction — the frozen core survives context loss            | I8     | `.claude/hooks/precompact-preserve.mjs` recites the AXIOM headers + thesis before compaction                                                          | a compactor diluting the frozen core (the research's _context rot_ / _recitation_ lever) | **mechanical** (inject)                    |

(B8 is the eighth rail — added because compaction is the one event that can silently
erase the frozen quotient; the research named recitation as the proven counter.)

## How a self-application turn runs through the rails

```
ingest ada-context (B-none)            Ada reads its own repo  (src/compile/engine/ingest.ts)
  → compile a self-pack (B4)           coherence guard fails closed on any self-lie
  → propose ONE change (B5)            emitted as context for /loop — Ada does not execute it
  → human applies via /loop (B5,B7)    executor + Alex's gate
  → /ratchet (B3)                      suite + coherence green, or the change is refused
  → commit the frozen point (B1,B2)    AXIOMS untouched; deterministic layer moved only by recompile
  → re-enter or stop (B6)              stop when a recompile yields no new structure
```

The frozen quotient (`AXIOMS.md`) is never on the write-path of the loop. That is the
whole reason ada-context is safer to self-apply than MOTHER-OS: its fixed core is
external to the recursion and human-ratified, not re-frozen per run.

## Coverage proof

Of B1–B8: **B1, B2, B3, B4, B6, B8 are mechanical** (`mu.ts` supplies B6's convergence
measure + halt-predicate); **B5 is policy + human gate**; **B7 is an honest human hole**.
So self-application now has **8 of 8 rails** — 6 mechanical, 1 policy, 1 honest human gate.
Two residues stay named, not faked (A2): the halt-predicate is _necessary, not sufficient_
— a `converged`/`stalled` halt is structural, so **A4 still gates whether the artifact is
right** (bounded ≠ correct); and the frozen quotient is a fail-open tripwire, not the
OS-managed layer, so it does not hold against an adversarial optimizer. ∎

## Re-verify before arming

The hook I/O contract (field names, exit-code semantics, PreCompact stdout injection) is
Claude-Code-version-volatile. The hooks here **fail open** on any parse error so a buggy
rail can never brick the workflow — they are tripwires, not a security boundary. Confirm
field names against current Claude Code docs before relying on a block.
