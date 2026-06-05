# A8 head-to-head — knowledge graph: Ada vs. a frontier chat model

**Date:** 2026-06-04 · **Domain:** "Everything a first-time tattoo client needs to understand to get a tattoo safely and well — before, during, after." · **Judge:** Alex (tattoo-domain expert).

This is the first real test of the product bet. It was set up by Alex specifically to see whether
the claim would be allowed to die if it lost. **It lost. This records that honestly.**

## Setup

- **Shared intent** (same for both arms). Deliberately under-specified, so each arm has to surface
  what a safe first tattoo requires.
- **Arm A — Ada:** `ada compile --engine --slug=tattoo --depth=3` (Opus 4.8). Zero-dep, **no web /
  no retrieval** — works from the model's parametric knowledge through a deterministic anti-generic
  rubric gate. Emits a graph + 3 runnable checks + CLAUDE.md.
- **Arm B — frontier chat model, no Ada** (ChatGPT/Gemini), lightly edited by Alex from his expertise.
- **Pre-registered kill line (written before the run):** _if Arm B is as grounded, as honest about
  unknowns, and as non-obvious as Ada's graph, Ada added no delta — record it as a loss, do not spin._

## What each produced

|                 | Arm A — Ada                                                            | Arm B — frontier model + expert                                          |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Nodes           | 25 (8 areas), gate rejected 3 generic                                  | **240** (12 areas)                                                       |
| Grounding       | accurate, mechanism-specific, **uncited** (no retrieval)               | **externally cited** (Health Canada, FDA, AAD, BC guidance, HCV)         |
| Honest unknowns | per-node `unknowns` on every node + UNK area                           | dedicated `?` section + `?` nodes + an explicit incompleteness invariant |
| Non-obvious     | high **density** per node (gate kills generics)                        | high **count**; mixed with some standard/obvious entries                 |
| Extra           | runnable `graph.json` + 3 deterministic C checks + emitted `CLAUDE.md` | a (strong, static) markdown document                                     |

## Scorecard (5 criteria)

| Criterion                       | Winner                                                     |
| ------------------------------- | ---------------------------------------------------------- |
| Grounded (true, no fabrication) | **B** — citations + breadth                                |
| Honest about unknowns           | ~tie (B slightly — more explicit/sectioned)                |
| Non-obvious                     | ~tie (Ada denser per node; B higher absolute count)        |
| Structured / useful             | **B** for coverage; Ada for being an _executable_ artifact |
| No fluff / redundancy           | **Ada** — every node gate-earned its place                 |

## Verdict — Ada loses this round

As a _knowledge graph about the domain_, **Arm B is more complete and better grounded.** 240 cited
nodes beat 25 uncited ones for anyone who wants a comprehensive, sourced reference. Per the
pre-registered kill line, **that is a loss, and it is called as one.** No re-run of Ada at higher depth
to inflate the result after seeing Arm B — that would be moving the goalposts, which is the exact
failure this experiment was built to catch.

## Honest texture (not a rescue of the claim)

- The loss is mostly **breadth + citations** — exactly what Ada at depth-3 with **no retrieval** cannot
  match by construction. Ada is not built to out-breadth a frontier model.
- On the qualitative axes Ada _was_ built for — non-obvious density, no-fluff, mechanism-first, honest
  per-node uncertainty, provenance (`∵ source` / `∴ inference`) — Ada's 25 nodes are competitive with
  B's best, because the rubric **rejected 3 generic candidates** rather than padding.
- Ada uniquely produced what B did not: a runnable graph, **3 deterministic checks an executor can
  run**, and an emitted `CLAUDE.md`. But that is _not what this experiment judged_, so it does not move
  the verdict.
- Confounds (named, not used as excuse): Arm B was expert-edited; Ada had no retrieval and ran at a
  low depth; the criteria were author-set. Even controlling for these, B's breadth + grounding win.

## The real lesson

This experiment tested **"whose markdown knowledge-graph is better"** — which plays to a frontier chat
model's strength (broad parametric knowledge + retrieval) and **away from Ada's actual bet.** Ada's
claim was never "out-write ChatGPT's graph." It is **A8**: a compiled pack makes a downstream _executor_
(Claude Code) **measurably safer/better at building**, via deterministic checks + governed context —
which this experiment did not test.

So the honest takeaways:

1. **Do not position Ada as "better knowledge graphs than a frontier chat model."** It loses that, and
   it should — that is not its lane.
2. **The untested, load-bearing claim is still A8-downstream:** give an executor the pack vs the raw
   intent, have each build the feature, and measure whether the pack's invariants get enforced. That is
   the experiment that can actually validate (or kill) the product.

## Next move

Run **A8 proper**: pack-guided build vs raw-prompt build of a feature with checkable invariants; the
deterministic checks (not a vibe) decide. That is where Ada either earns its existence or doesn't.
