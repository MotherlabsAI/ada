# Gate experiment — prove or kill the unfair-advantage

> **STATUS: FROZEN (Alex, 2026-06-07).** Task = A9 egress check. Numbers set below.
> **One run, no retries.** No re-compiling to win, no swapping the task to chase a result
> (the A8 discipline — two prior nulls in `experiments/transfer2/`). This file is committed
> BEFORE either arm runs; the criterion is fixed and cannot move after seeing the outputs.

## The claim under test

Repo-aware Ada — the `--repo` compiled grounded pack — makes a `/loop` turn on
`ada-context` **handle real considerations it would otherwise miss**, landing with a felt
"unfair advantage", **beating Claude-Code-alone on the same task**.

## Honest baseline (the trap avoided)

Claude-Code-alone is **not blind** — it can grep and read the repo itself. So this is the
HARD version: does Ada's **pre-compiled grounded context beat CC discovering the repo on its
own?** The pack wins only if it surfaces a real consideration CC-alone (doing the task) did
not handle, or reaches the correct integrated solution with materially fewer wrong turns.

## The fixed task (FROZEN)

Both arms do this SAME task, stated with NO reference to the pack:

> **"Add a deterministic check to `ada-context` that fails if the codebase makes any outbound
> network call other than the single compile-time model call."**

Grounding-sensitive: a correct solution must know the _actual_ network boundary
(`engine/model.ts` is the sole call; `env.ts` loads keys but never calls; no runtime deps).

## Arms (same executor / task / model — only the compiled context differs)

- **Arm A — baseline.** A fresh `/loop` turn given ONLY the task + this repo. CC reads what it chooses.
- **Arm B — treatment.** Same task + the `--repo`-compiled grounded pack (CLAUDE.md + wiki +
  grounded-unknowns inventory) loaded as context.

## "Better" — the criterion (FROZEN before either arm runs)

Pack-INDEPENDENT: authored here from AXIOMS (A9, A3) + repo facts, NOT from anything the pack
says (the mistake that sank the A8 capability-uplift run).

**1. Hard floor (checkable, disqualifying):** the arm's output applies cleanly AND `pnpm test`
stays green. A win that breaks the build does not count.

**2. Objective half — the K=5 considerations (each checkable). Count how many each arm handles:**

- **c1** names `engine/model.ts` (the real `complete()` call site) as the SOLE permitted egress
  — not a guessed/parallel location. _Check: the produced check references model.ts as the allowed call._
- **c2** the check itself is **model-free** (A3) — no LLM/model in the check path. _Check: no model call in the emitted check._
- **c3** **bites** a planted violation — a `fetch`/`http`/`https` call added elsewhere makes the
  check FAIL. _Check: plant a call → check exits non-zero._
- **c4** does NOT break the one real call — the compile-time model path still works.
  _Check: `pnpm test` green; the model boundary intact._
- **c5** integrates with the EXISTING check layer (`src/c/` registry / emit), not a standalone
  parallel script. _Check: edits the real C subsystem, wired in._

**Δ threshold: Arm B must handle ≥ (Arm A + 2) of {c1..c5}.**

**3. Felt half (A4 — Alex, qualitative):** did Arm B feel like an unfair advantage — caught a
real consideration Arm A missed, fewer wrong turns, less hand-holding?

## Verdict logic (FROZEN)

- **SUPPORTED** iff ALL of: (i) Arm B passes the hard floor; (ii) Arm B handles ≥ Arm A + 2
  considerations; (iii) Alex feels the edge.
- **NOT SUPPORTED (kill)** otherwise — including a felt-edge-only or +1-only result (reported as
  the honest partial it is). **No re-roll. No task-swap.** (Honor the kill — OP-04.)

## Frozen-before-run checklist

- [x] task (A9 egress check, stated neutrally)
- [x] K=5 considerations {c1..c5}, each checkable
- [x] Δ = +2 (Arm B ≥ Arm A + 2)
- [x] felt-edge bar (caught-a-miss / fewer wrong turns, Alex's read)
- [x] kill line committed (no re-roll, no task-swap)
- [ ] this file committed BEFORE either `/loop` arm runs ← the freeze commit

## Smallest next action (after the freeze commit)

Run Arm A and Arm B once each on the frozen task; score {c1..c5} for each + the hard floor;
record Alex's felt read; apply the verdict logic. One run. Then `/ratchet` the result
(SUPPORTED or documented null).
