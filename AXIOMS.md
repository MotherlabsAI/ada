# AXIOMS — Ada by Motherlabs

VERSION: frozen-v2 (2026-06-03)
STATUS: immutable. Downstream work treats these as hard constraints.
DELTA: frozen-v2 ratifies the FREEZE.md proposal (Alex sign-off, 2026-06-03) —
A3 +D1/+D2 clarifications, A1/A2 +D3 clarification, A7 scope amendment (any
knowledge), and new A9 (sovereignty). See `docs/FREEZE.md` §3.
SOURCE: compiled from the Ada world-model schema graph (`ADA_WORLD_MODEL_SCHEMA_GRAPH.md`)
and the founder goal brief. Every axiom traces to a spec section.

> To change an axiom, propose an explicit AXIOMS delta. Do not silently drift.

---

## A1 — Determinism boundary (the spine)

The graph and wiki are **exploratory**: they may be broad, creative, and
non-deterministic, because their job is to explore the working world of a request.
The blueprint and C checks **must be deterministic**: their job is to constrain
execution. This separation is the product's spine and may not be blurred.

**Clarify (D3, frozen-v2) — editable-playground boundary.** The exploratory layer
(graph + wiki) is **user-editable**: the user may manipulate edges, spawn nodes, and push
deeper, co-excavating alongside the compile-time engine. User-authored nodes/edges are
provenance-tagged `∵ source` (A2); engine output is `∴ inferred` or `Ω residue`. User
editing of the exploratory layer **never reaches the deterministic layer directly** —
changes flow into the blueprint + C only by **re-compile**, never by live mutation of a
frozen artifact.

> trace: Product invariant §1; `STREAM.014`; `QUALITY.014`; frozen-v2 D3 (Drop 6-a).

## A2 — Excavation over generation (provenance)

Every node and artifact must trace back to input — SEED, a source, or an explicit
inference. Output is never hallucinated. Each claim carries a truth class:
`∵ source-backed`, `∴ inferred`, or `Ω residue` (known gap). Unsupported claims are
not promoted into execution context.

> trace: `SOURCE.*`; `QUALITY.016`; `GOV.012`.

## A3 — C contains no model

A C check is a runnable pass/fail predicate. It contains no LLM, no model, no
subjective judgment. Subjective taste, tone, strategy, and aesthetics are **never**
disguised as deterministic C — they may be rubric-scored (C2) or human-gated (C1),
but they do not enter the C registry. Checkable meaning must look different from
subjective meaning.

**Clarify (D1, frozen-v2) — neuro-symbolic boundary.** The model is invoked at **compile
time only**, to lower intent into the typed graph + blueprint. From that point every C
check is purely symbolic: a runnable pass/fail predicate, no model, no LLM in the
evaluation path. Identical compiled inputs yield identical verdicts (referential
transparency). Compile-time = neural / non-deterministic (A1's exploratory side);
check-time = symbolic / deterministic. **No model may re-enter after compile** — an
LLM-as-judge in the verification path is an A3 violation.

**Clarify (D2, frozen-v2) — defeasibility routing.** A3 forbids a model _in the checker_,
not exceptions _in the data_. Hard invariants compile to pure C (C4/C5); soft, non-binary,
or defeasible rules route to C0–C2 + honest residue + blueprint guidance + A4 gating; any
stochastic edge-case resolution lives in the executor, never in a C check. Forging a
non-binary rule into a brittle deterministic predicate is itself the A3 violation.

> trace: `CHECKCLASS.016`; `C.*`; MVP must-not §16; Semantic decoration Rule 8; frozen-v2 D1/D2 (Drops 1, 4).

## A4 — Humans govern, agents execute

C0–C2 nodes (uncheckable / human-review / rubric) are human-gated. High-risk actions
(destructive file ops, secrets, payments, customer data, external sends, repo
mutations, env changes) are gates. A hole is better than a lie. A deferred question
is better than a fabricated answer. A small verified step beats a confident wrong
build.

> trace: `GOV.*`; `ROOT.011`; Governance §0/§15.

## A5 — Filesystem-backed world model

The graph is not only a visualization. Every node exists as a real object on disk
under `.ada/packs/<slug>/`, with markdown, metadata, edges, sources, checkability,
C candidates, export paths, and quality state. Packs are inspectable, versionable,
and portable.

> trace: `PACK.*`; §12; `ROOT.013`.

## A6 — Ada sits before execution

Ada is **not** a coding agent. It expands intent, structures context, draws the
graph, writes the wiki, maps language to code, extracts checkable invariants, and
emits Claude Code artifacts. Claude Code (or another executor) executes. Exports are
ordinary inspectable files first — `CLAUDE.md`, `SKILL.md`, subagents, prompts,
blueprint. MCP / hooks / plugins come later, not in P0.

> trace: `IDENTITY.011`, `IDENTITY.012`; `ROOT.010`; `CLAUDE.*`.

## A7 — MVP boundary is frozen

P0 includes: `ada init`, `ada compile`, local `.ada/packs` generation, `graph.json`,
markdown node files, basic TUI navigation (open/flag/deeper/resume), node capsule
schema, wiki projection, Claude `SKILL.md` + subagent export, a C candidate registry,
and ≥3 runnable deterministic checks in the showcase pack.

P0 excludes: SaaS marketplace, account system, cloud sync, enterprise governance,
advanced hooks, fully autonomous execution, complex webapp, background-work promises,
and subjective taste disguised as deterministic C.

**Amend (frozen-v2) — domain scope opened.** The MVP is **not** restricted to
software-context. Ada compiles **any knowledge domain** the user brings (Drop 6-c): the
engine, rubric, gate, and emitters are domain-agnostic by construction. The booking
showcase remains the proof exemplar and the A8 experiment target, but it is an _example_,
not the boundary. The P0 excludes above still hold.

> trace: §16; frozen-v2 A7 amendment (Drop 6-c).

## A8 — The bounded claim (single validation gate)

A pack must make Claude Code **measurably better than a raw prompt**. This is the one
claim the product rests on, and it is an untested hypothesis until proven by an A/B
experiment (pack vs no-pack on the showcase booking feature). All other work is in
service of this gate.

> trace: MVP boundary §16; Showcase §15 "First trust moment".

## A9 — Sovereignty / no phone-home

Ada is a local CLI/TUI that **runs and exits**. It must not transmit, harvest, or persist
the user's intent, packs, interview answers, or any derived semantics to an external
service for any purpose (telemetry, training corpus, analytics, "flywheel"). The **only**
outbound call permitted is the single compile-time model invocation required by A1;
everything else stays on the user's filesystem (A5). A pack is the user's property. No
background process, no session server, no exfiltration.

> trace: frozen-v2 delta D4; hardens A5/A6 + zero-dep; forecloses the Drop 5 telemetry fork.

---

## Human-gate map (where Ada must stop and ask Alex)

| Surface                                                      | Checkability | Who decides                       |
| ------------------------------------------------------------ | ------------ | --------------------------------- |
| Pack filesystem, graph.json, node markdown, manifest         | C3–C5        | Ada (autonomous, self-verifying)  |
| Deterministic C checks + their run reports                   | C4–C5        | Ada (autonomous)                  |
| Export scaffolding (CLAUDE.md/SKILL.md/subagents/blueprint)  | C3           | Ada (autonomous)                  |
| "First node must impress" / anti-generic / taste             | C0–C2        | **Alex**                          |
| C _correctness_ (does the check encode the RIGHT invariant?) | —            | **Alex** (scope critic + gate)    |
| The bounded claim A8 (does the pack actually help?)          | —            | **Alex** (reviews the experiment) |
