# North-Star Spec — the Anatomy Ada Compiles Toward

> Source: a single-shot compilation by Alex ("you are a semantic compiler … no depth or
> breadth limit … recursive self-improving intent-driven development"). It produced a full
> anatomy + constraints graph + functions anatomy — externally validated (MCP, A2A, AGENTS.md,
> LangGraph, DSPy, SWE-bench, OWASP LLM Top-10, NIST AI RMF, W3C PROV). It is, in effect, **Ada's
> own blueprint**, deeper than Ada is today. This file is the target the engine builds toward and
> the bar every compile is measured against. The full artifact lives in the session transcript;
> this is the governed extraction.

## The one governing sentence (Alex's K0)

> **Self-improvement is artifact improvement under verification — not unconstrained
> self-modification.** The improvement target is the compiler _harness_ (prompts, schemas, evals,
> tool contracts, memory rules), never the model's hidden mind. A system that writes more prompts
> after failure is not improving; it improves only when future failures measurably drop **without
> weakening a gate.**

## Kernel laws → Ada's axioms (what we already hold vs the gap)

| Blueprint law                                           | Ada today                     |
| ------------------------------------------------------- | ----------------------------- |
| K1 a hole beats a lie                                   | ✓ A2                          |
| K2 compile before execute                               | ✓ A6                          |
| K3 unknowns → gates / assumptions / residue             | ◑ residue yes; **gates** weak |
| K4 verifier outranks executor                           | ✓ A3 + the rubric gate        |
| K5 provenance outranks confidence                       | ✓ A2 (∵/∴/Ω)                  |
| K6 human intent is authority, model fluency is not      | ✓ A4                          |
| **K7 every repeated correction becomes infrastructure** | ✗ **missing**                 |
| K8 no action without scope/permission/rollback          | ⟂ borrowed (the runtime, A6)  |
| **K9 recursive improvement requires evidence**          | ✗ **missing**                 |
| **K10 memory is a candidate until promoted**            | ✗ **missing**                 |
| K11 context packs are execution surfaces                | ✓ the pack                    |
| K12 artifacts survive model changes                     | ✓ A5 (filesystem packs)       |

**Ada holds the kernel — except the recursive-improvement triad (K7, K9, K10).** That triad is
the literal meaning of "recursive self-improving," and it is absent.

## The 12 organs → Ada's coverage

| Organ                                                                            | Status for Ada                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 00 KERNEL (laws/authority/safety/uncertainty)                                    | ✓ AXIOMS.md                                                             |
| 01 HUMAN_INTERFACE (ADHD panels: today / decision-queue / learning)              | ◑ the TUI exists; the _panels_ don't                                    |
| 02 INTENT_INGRESS (goals/non-goals/time/risk/authority context)                  | ◑ seed + the new `normalizeIntent`                                      |
| 03 SEMANTIC_NORMALIZATION (terms/contradiction/scope/residue)                    | ◑ just shipped (`normalize.ts`)                                         |
| 04 CONTEXT_GRAPH (node + **edge ontology**, layers, diff)                        | ◑ graph yes; **typed nodes/edges = the depth gap**                      |
| 05 COMPILER_PASSES                                                               | ✓ the 9-stage pipeline                                                  |
| 06 ARTIFACT_EMITTER (context pack)                                               | ✓ exports/                                                              |
| 07 AGENT_RUNTIME (planner/executor/governor agents)                              | ⟂ **borrowed** (Claude Code; A6 — Ada emits contracts, never runs them) |
| 08 GOVERNANCE (gates/risk/rollback/audit)                                        | ◑ the C-gate on-spine; live-action governance ⟂ borrowed                |
| 09 VERIFICATION (V0 structural … V6 recursive)                                   | ◑ C-checks exist; the V0–V6 ladder is thin                              |
| **10 MEMORY (candidate → promotion → decay)**                                    | ✗ **missing**                                                           |
| **11 RECURSIVE_IMPROVEMENT (failure → patch → shadow → regression → successor)** | ✗ **missing — the defining gap**                                        |
| **12 TIME (epochs, decay, recompile triggers)**                                  | ✗ **missing**                                                           |

## The axiom filter (what's Ada vs the borrowed harness)

The artifact describes a _whole system_ (compiler + runtime + live governance + memory + time).
Ada is the **compiler before execution (A6)**. So:

- **ON Ada's spine — build into Ada:** the kernel, intent ingress + normalization, the **typed
  context graph** (node + edge ontology), the compiler passes, the artifact/context-pack emitter,
  verification (the C-layer + the V-ladder), residue + **gates**, **memory-as-candidate**,
  **time/decay**, the **ADHD human interface** (the TUI is this), and — the headline —
  **recursive improvement _of the compiler itself_** (Ada improving Ada's prompts/schemas/evals
  under shadow-compile + regression + a promotion gate).
- **OFF spine — borrowed, A6:** the agent **runtime** (planner/executor/governor agents running),
  live **tool execution**, and **action governance** (deploy/email/payment/delete gates). Ada
  _emits the contracts_ for these (AGENTS.md, tool*contracts, gates) — the harness (Claude Code
  `/loop`) \_runs* them. Building a competing runtime is the off-spine mistake.

## The two things to adopt that close the gaps the work keeps hitting

### 1. Typed nodes + typed edges (the depth/breadth gap)

A folder-tree of capsules is not a graph. The blueprint's ontology makes it one:

- **Node types** — Intent · Constraint · Claim · Evidence · Assumption · Unknown · Risk ·
  Mechanism · Invariant · Decision · Action · Artifact · Tool · Eval · Memory.
- **Edge types** — semantic (`defines/refines/contradicts/supersedes`), dependency
  (`requires/blocks/gates`), evidence (`supports/falsifies/verified_by`), execution
  (`emits/consumes/invokes_tool`), governance (`requires_approval/forbidden_by`), memory
  (`promoted_to/decays_after`), recursive (`failure_caused_by/correction_updates/…replaces`).
- Recursive depth (children of nodes, 3–4 levels) instead of the flat cluster→node, 2-level tree.
  This is what makes Ada's output read as an _anatomy_, not a list — and it's checkable
  (`typed_nodes_required`, `typed_edges_required` become C-invariants).

### 2. The recursive-improvement loop (the thesis, made real)

```
OBSERVE failure / repeated correction
 → classify → infer infrastructure patch (prompt | schema | eval | tool-contract | memory-rule)
 → SHADOW-COMPILE (old compiler vs new, same seed) → diff
 → regression suite → checkGateWeakening (no gate may be removed)
 → promotion gate (human for medium+) → emit SUCCESSOR pack
```

Run on **Ada itself** this is the "bounded self-application" we've circled all along — and the
design-contract checks + the golden-frame we just shipped are its first regression rungs.

## Roadmap, by leverage

1. **Typed node/edge ontology + recursive depth** (organ 04) — closes the breadth gap directly;
   foundational for the constraints-graph and the verification ladder. Enforce with `typed_*` C-checks.
2. **Recursive-improvement engine** (organ 11 + K7/K9) — the defining missing organ; the literal
   "self-improving." Shadow-compile + regression + no-gate-weakening, applied to Ada's own harness.
3. **Memory-as-candidate** (organ 10 + K10) and **time/decay** (organ 12) — the supporting organs 11 needs.
4. **ADHD interface panels** (organ 01) — grow the TUI into the today / decision-queue / learning surfaces.
5. **Gates as first-class** (K3/K8 on-spine) and the **V0–V6 verification ladder** (organ 09).

## The honest framing

A single LLM pass produced this blueprint because it is **unconstrained, ungrounded synthesis** —
it cannot verify itself, cite Ada's real files, or actually self-improve. Ada's job is not to
_describe_ this anatomy but to **be it, grounded and checkable and recursively improving** — which
the single-shot is not. The blueprint is the map; Ada is the governed, self-correcting territory.
That is strictly more than either the single-shot or today's Ada alone.

## The unique function (Alex, 2026-06-07): epistemic action compilation

The durable wedge is not generation or execution — both already exist (a model answers, an agent
runs). It is **context governance BEFORE reasoning and execution**: separating what is _known_ /
_assumed_ / _unknown_ / _must-be-verified_ / _safe-to-act_, so action is never taken before the
system knows what is true. The output is not prose — it is a **Problem Operating Model (POM)**: a
structured, inspectable, verifiable problem _state_ that humans, agents, and tools operate on
without losing truth, constraints, or uncertainty.

**Hold this bounded claim** (it is the defensible one): Ada _improves_ novel problem-solving by
turning vague problems into structured, inspectable, verifiable search spaces — NOT "solves all
novel problems."

**The POM output shape (richer than today's pack):** `intent_kernel` · `current_state`
(known / weak / assumed / contradictions / missing) · `constraint_graph` · `unknowns_graph` ·
`solution_space` (candidate + rejected paths, tradeoffs, reversibility) · `execution_plan` ·
`verifier` (tests, evidence, stop-conditions) · `memory` (residue, promoted).

**Map to Ada today:** the typed-node ontology just shipped (Intent · Constraint · Claim · Evidence
· Assumption · Unknown · Risk · Invariant · Decision · Action · Tool · Eval · Memory) IS the POM's
vocabulary — the substrate now exists. The gap is **projection**: surface `constraint_graph` /
`unknowns_graph` / `verifier-gates` / `solution_space` / `memory` as first-class POM _sections_ of
the emitted pack, not buried inside the graph. (These are the same organs 04/09/10/11/12.)

**The one genuinely new capability this names — the `distinguish` operator.** Most bad reasoning is
_conflation_; the highest-leverage move is to **split fused concepts before deriving** —
idea≠product, usage≠retention, automation≠autonomy, context≠truth, output≠outcome, novelty≠value,
users≠customers. A `distinguish` compile pass (surface a conflation, emit the separated concepts as
distinct typed nodes joined by a `contradicts`/`disambiguates` edge) is not in the pipeline today
and is cheap, novel, and broadly applicable. Strong candidate brick.

**First-principles discipline (the reasoning posture):** reduce to the _lowest **useful** primitive
for action_ — controlled reduction, not infinite philosophy. Convert vague wisdom into operational
primitives ("quality matters" → "fewer defects on the user's actual success path"; "trust is
important" → "calibrated belief the system behaves correctly under relevant conditions"). A claim is
a first principle only if it is non-derivative, generative, bounded/falsifiable, and **can change
what we do**. The 10 semantic-compiler primitives in the source ≈ Ada's frozen axioms already
(compile-before-execute, context≠truth, unknowns-are-state, verification-outranks-generation,
action-requires-governance, memory-requires-promotion, corrections-become-infrastructure,
output-must-be-operable) — confirming the kernel is aligned; the build is the projection + the
recursive loop.
