# AXIOMS — Ada by Motherlabs

VERSION: frozen-v1 (2026-06-02)
STATUS: immutable. Downstream work treats these as hard constraints.
SOURCE: compiled from the Ada world-model schema graph (`ADA_WORLD_MODEL_SCHEMA_GRAPH.md`)
and the founder goal brief. Every axiom traces to a spec section.

> To change an axiom, propose an explicit AXIOMS delta. Do not silently drift.

---

## A1 — Determinism boundary (the spine)

The graph and wiki are **exploratory**: they may be broad, creative, and
non-deterministic, because their job is to explore the working world of a request.
The blueprint and C checks **must be deterministic**: their job is to constrain
execution. This separation is the product's spine and may not be blurred.

> trace: Product invariant §1; `STREAM.014`; `QUALITY.014`.

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

> trace: `CHECKCLASS.016`; `C.*`; MVP must-not §16; Semantic decoration Rule 8.

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

> trace: §16.

## A8 — The bounded claim (single validation gate)

A pack must make Claude Code **measurably better than a raw prompt**. This is the one
claim the product rests on, and it is an untested hypothesis until proven by an A/B
experiment (pack vs no-pack on the showcase booking feature). All other work is in
service of this gate.

> trace: MVP boundary §16; Showcase §15 "First trust moment".

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
