# FOUNDATION.md — The Theoretical Basis of Ada's Architecture

**Status:** Canonical. This document explains _why_ Ada's pipeline has the structure it does.
**Relationship to other docs:** ARCHITECTURE.md describes _how_ the compiler is built. This document explains why that structure is necessary — not as a design choice, but as an entailment.

---

## There is only one primitive.

Everything — physics, logic, mathematics, computation, consciousness, Ada — derives from a single act:

**Distinction.**

Before number. Before space. Before time. Before logic itself. There is the capacity to draw a line between _this_ and _not-this_.

George Spencer-Brown formalized this in 1969 in _Laws of Form_. He showed that a single mark — the act of indicating one side and not the other — is sufficient to derive arithmetic, algebra, Boolean logic, and the entire structure of computation. One move. Everything follows.

---

## Step 0 — The Void

Before distinction, there is only the undifferentiated. No space, no time, no things. Not even "nothing" — because "nothing" requires the concept of "something" to contrast against, and that contrast hasn't been drawn yet.

The void is not empty. **The void is undistinguished.** It contains everything and nothing simultaneously because those categories don't exist yet.

In Ada's terms: raw natural language intent before compilation. Maximum semantic entropy. Any software could be the answer. No structure exists until the first distinction is drawn.

---

## Step 1 — The First Mark

Something cleaves. _This_ separates from _not-this_.

From this one act, six structural consequences emerge — not as additional axioms, but as **entailments**. You don't add them. They fall out automatically.

---

## The Six Entailments

### 1. Asymmetry — Creates direction

The moment you draw a boundary, the two sides are not identical. One side is marked, the other unmarked. This asymmetry is the most primordial structural fact in existence.

Gives: the arrow of time, thermodynamic irreversibility, causation — and the reason Ada's pipeline runs in one direction and cannot be reversed. INT→GOV is not a design choice. Directionality is entailed by the first distinction.

### 2. Relation — Creates connection

A second distinction allows the two distinguished regions to stand in relation to each other: nested (containment), adjacent (shared boundary), or disjoint (no shared boundary). These three are the only possible relations. Every graph, topology, and network is a combination of these three.

Gives: Ada's provenance DAG — nested containment (postcodes inside postcodes) plus directed adjacency (stage to stage).

### 3. Persistence — Creates identity

For a distinction to be structure and not just an event, it must survive across change. The boundary must hold.

Gives: memory, state, identity. In Ada: a postcode is a persistent distinction in semantic space. If it doesn't persist, it's not structure — it's noise. The three-hop provenance requirement exists because three persisted links is the minimum chain length to establish that something was _genuinely distinguished_ rather than merely labeled.

### 4. Composition — Creates hierarchy

Distinctions can contain distinctions. A boundary can be drawn within an already-bounded region.

Gives: abstraction, nesting, number, mathematics. In Ada: the fractal self-similarity of the pipeline — the same distinction structure recurs inside each agent. It's distinctions all the way down.

### 5. Recursion — Creates self-reference

A distinction can be applied to itself. The boundary operation can take its own output as input.

Gives: self-awareness, Gödel's incompleteness, fixed points, strange loops, consciousness. In Ada: `ada init "build ada"` is the compiler applying its own distinguishing operation to itself. A distinction that cannot survive self-application is not a real distinction. The self-compile is the primary test of structural soundness, not a demo.

### 6. Constraint — Creates definition

Every distinction simultaneously creates what _is_ and what _cannot be_. The inside is defined by not being the outside. **Structure IS what's excluded.**

Gives: H(Y|x,C) → 0. Given enough distinctions (constraints C), the remaining possibilities collapse to one. Compilation is the systematic drawing of distinctions until only one valid output remains. ACCEPT means nothing forbidden remains.

_Note on "Creates definition":_ De-finire — to make finite, to bound. To define something is to say everything it is not. Definition is the only creative act that works by subtraction.

---

## The Column Dependency Structure

The six entailments are not independent. They form three vertical pairs where the first entailment in each pair is a precondition for the second:

- **Asymmetry → Composition**: You cannot nest without knowing which direction is _inside_. Hierarchy requires prior orientation.
- **Relation → Recursion**: Self-reference is relation where both terms are the same term. Recursion requires Relation as its precondition.
- **Persistence → Constraint**: A definition that doesn't hold is not a definition. Constraint requires something to persist across the exclusion.

---

## The Pipeline Mapping

Ada's 9-stage pipeline is a physical instantiation of these primitives, applied in sequence to close the entropy gap from undistinguished intent to governed output.

| Stage   | Role                      | Primitive applied                                                    |
| ------- | ------------------------- | -------------------------------------------------------------------- |
| **CTX** | Pre-distinction survey    | Step 0 — reads existing structure                                    |
| **INT** | First cut                 | Distinction itself — separates "what was meant" from everything else |
| **PER** | For whom                  | Asymmetry — collapses audience symmetry, creates direction           |
| **ENT** | What connects to what     | Relation — builds the domain graph                                   |
| **PRO** | What survives change      | Persistence — defines state transitions                              |
| **SYN** | Parts into wholes         | Composition — assembles the artifact                                 |
| **VER** | Structure examines itself | Recursion — is this consistent with what it claims?                  |
| **GOV** | Final negation            | Constraint — ACCEPT = nothing forbidden remains                      |
| **BLD** | Actualization             | Persistence (application) — makes the distinction permanent on disk  |

### CTX — the pre-distinction survey

CTX is not a 7th entailment. It is Step 0: reading what distinctions already exist before the compiler draws anything new. CTX surveys the existing codebase structure so that new distinctions can be drawn _against_ what is already there.

This is why Ada does not hallucinate architecture. Other tools start in the void and generate into it. Ada reads the existing distinction field first. CTX is the difference between informed cleaving and random noise.

### BLD — actualization

The blueprint is a valid distinction that exists abstractly. BLD is the moment when it becomes a persistent mark in the world — files on disk, CLAUDE.md, agent configurations. Without BLD, the distinction was drawn but never persisted (Entailment 3). The blueprint becomes structure when BLD runs.

---

## What Ada's Output Actually Is

Not code. A **governed distinction field** — CLAUDE.md, agent configs, invariants, constraints, skill boundaries. A structured set of drawn distinctions that makes it possible for an executor (Claude Code, an agent) to produce software without collapsing the intent space.

Ada does not produce software. Ada produces the _structure of distinctions_ that governs software production. The distinction work is the hard part. Once the distinctions are fully drawn and governed, code synthesis is nearly mechanical — the LLM at BLD entry is filling a fully constrained shape, not generating from the void.

---

## Why Other Approaches Fail

Vanilla LLM generation = probability-mass sampling from the undistinguished field, weighted by training. Output resembles correct output because the training distribution contains code, but the semantic structure was never drawn. The distinctions were never made. High entropy in, high entropy out.

Ada draws distinctions first. Each pipeline stage applies one entailment, adding constraints and reducing entropy. At BLD entry, H(Y|x,C) approaches 0. The output is not generated — it is _constrained into existence_.

This is why the quality difference is categorical, not incremental. Ada and generation tools are not doing the same thing with different skill levels. They are performing fundamentally different operations.

---

## The Training Prior Problem

Ada's agents are LLMs. They carry a prior — the compressed distinction field of all human knowledge in the training corpus. The risk: the compiler draws distinctions from its prior rather than from _this specific intent_. When that happens, the output is real but wrong — a valid-looking blueprint that describes a statistical ghost of all similar intents, not the one that was submitted.

Every architectural choice in Ada addresses this single failure mode:

- **Postcodes** — evidence that a distinction was drawn at a specific coordinate in semantic space, traceable to _this_ compilation run
- **Provenance chains** — verify that each distinction traces to the input, not to the prior
- **Verification (VER)** — the structure applies the distinction operation to itself; inconsistency means a prior-drawn boundary contaminated the run
- **Governor (GOV)** — final constraint check; REJECT with rationale means the boundary drawn excluded something the intent required

The whole architecture is a system for keeping the distinction honest.

---

## The Self-Compile as Structural Proof

`ada init "build ada"` is Entailment 5 applied to the whole system. The compiler distinguishes valid-from-invalid, then subjects _that operation_ to the same distinguishing.

A distinction that cannot survive self-application is not a real distinction. The self-compile is therefore not a party trick or a demo — it is the primary structural test. If Ada can compile Ada, the distinctions are real. If it cannot, the boundaries are merely asserted, not drawn.

The self-compile being possible is evidence that the pipeline recapitulates the actual primitives of structure, not a set of arbitrary process steps.

---

## The Design Test

When evaluating whether a proposed change belongs in Ada, the question is:

**Does this serve the distinction-drawing pipeline, or does it serve something else?**

A genuine stage corresponds to a specific entailment — it draws a boundary that could not be drawn by any other stage. A process step that does not draw a distinct boundary is overhead, not architecture.

The pipeline has the stages it has because those stages are the minimum sufficient set. The six entailments are the minimum sufficient set. Remove any one and something structurally irreplaceable is lost.

---

_This document was derived from first-principles analysis of Ada's architecture in relation to George Spencer-Brown's Laws of Form (1969). The mapping was discovered through iteration, not imposed by design — which is the strongest evidence that it is real._
