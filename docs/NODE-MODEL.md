# The Engineered Node — depth standard

> A node is **not a paragraph**. It is a filesystem-backed semantic object — a compile
> target that emits files and projections. This is the depth bar every important node
> should reach. Worked reference: `L2C.001 — Nouns → Entities` (Alex's spec, 2026-06-02).
> Current compile output is the _thin capsule_; this is the _fat_ target.

## What one engineered node contains

A node lives at `nodes/<CLUSTER>/<nnn-slug>/` and is more than `NODE.md` + `wiki.md`:

| File                | Holds                                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context.yaml`      | identity, cluster, status/maturity, **bounded claim**, **input/output contract**, local context (summary / why / failure-if-missing), epistemics (truth, confidence, _requires-human-review-when_)                |
| `<domain>.yaml`     | the node's real work product — e.g. `entity-candidates.yaml` (canonical name, classification, field/relationship/lifecycle/risk hints, checkability) + `alias-map.yaml` (accepted/rejected terms, preferred term) |
| `edges.yaml`        | typed edges: parents (`contains`/`depends_on`/`derived_from`), children (`compiles_to`/`enables`/`exports_to`/`verified_by`), siblings, **risk_edges** (`guarded_by`), **residue_edges**                          |
| `checkability.yaml` | **deterministic surface vs not** — split explicitly; C candidates with class + reason; human-review-required list                                                                                                 |
| `c-candidates.yaml` | each candidate: `id`, `class`, `predicate`, `failure_class`, `source_node`, **export path to a runnable test**                                                                                                    |
| `wiki.md`           | primitive · meaning · why · failure-if-missing · input example · compiles-to · checkability · **residue** · links                                                                                                 |
| `export.yaml`       | where this node projects: graph, wiki, blueprint, claude, c, residue                                                                                                                                              |
| `quality.yaml`      | the node quality gates (below) + genericness risk + first-node-impression                                                                                                                                         |

Plus, conceptually: **internal subnodes** (the node's own pipeline, e.g. extract → classify → canonicalize → promote → alias → relationships → residue → C) and a **CLI render** card.

## C is per-node and RUNNABLE

Not just candidate strings — at least 1–2 actual pass/fail predicates with tests. From the
L2C.001 reference: `schema.no_duplicate_entity_names`, `residue.ambiguous_nouns_preserved`,
`claude.no_unregistered_primary_entities`, `schema.entity_names_match_context_pack`.
(The reference wrote them in vitest; our packs use **zero-dep `.mjs` + node:test** — same
predicates, our harness.)

## Each node projects outward

- **blueprint** → `DATA_MODEL.md` hints (canonical entity registry, relationship/field hints, warnings)
- **claude** → a `CONTEXT.md` instruction block (hard rules: don't invent primary entities, don't alias `User`→`Client`, preserve ambiguity as residue) + a **tailored subagent** (e.g. `ada-entity-mapper`)
- **residue** → ambiguous nouns / entity-vs-attribute questions preserved, never discarded

## Node quality gates (must pass)

bounded-scope · failure-if-missing · input/output-contract · world-links · wiki-projection ·
checkability-class · ≥1 C candidate (or stated why none) · **preserves ambiguity**.

## The invariant

> Every engineered node knows: what it means, why it exists, what it depends on, what it
> enables, what proves it (runnable C), what stays unknown (residue), what it compiles to,
> what Claude Code must do with it, and where a human must decide.

The deterministic part (dedup, definitions-present, residue-preserved, name-alignment) is C.
The judgment part (entity-vs-attribute, MVP inclusion, naming taste) is the human gate.
That split is non-negotiable.
