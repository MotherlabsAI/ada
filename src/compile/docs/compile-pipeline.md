# Compile pipeline — operator runbook

> Where this lives: kept under `src/compile/` to respect the track's file
> ownership. It documents how `ada compile` turns one intent into a gated pack.

## The pipeline, end to end

```
SEED ─► cluster excavation ─► rubric gate ─► model critic ─► assemble ─► write
        (workforce, A1)        (C, A3)        (C2)             (kept)     (disk)
```

1. **SEED** — normalize the root intent into a `Seed` (domain, objectives,
   known/unknown context, assumptions, constraints, risks). See `assemble.ts`.

2. **Cluster excavation (the workforce).** Per cluster (`ATT`, `COPY`, `SEO`,
   `UNK`, …), a worker excavates candidate `NodeSpec`s using
   `prompts/excavator.md`. **This step is non-deterministic by design (AXIOM A1):**
   the meaning being surfaced is mostly judgment; the same intent can yield
   different-but-valid capsules. We do not pretend otherwise.

3. **Rubric gate (deterministic — the checkable sliver).** `scoreNode` in
   `rubric.ts` scores six structural proxies of each spec and returns
   `impress | pass | reject`. `assemblePackGated` drops every `reject` before it
   becomes a capsule. This is the **only deterministic step in meaning-quality** —
   the C of "is this node good" (AXIOM A3, and `docs/POSITIONING.md`: _C is
   tests-for-meaning_). It is a proxy, not the whole truth: it catches
   provably-generic nodes (filler, no intent-trace, dishonest checkability,
   too-low specificity) and nothing subtler.

4. **Model critic (C2).** `prompts/anti-generic-critic.md` runs on the nodes the
   rubric _passed_. Its scope is explicitly the complement of the rubric: the
   **subtler generic-but-well-formed** nodes — true-but-obvious, intent-restated,
   numbers-as-costume, wrong-altitude. The prompt instructs the critic that
   rubric-rejected nodes are already auto-killed, so it never re-litigates them.
   This is the layer of judgment structure cannot mechanize.

5. **Assemble.** `assemblePackGated(slug, intent, specs)` builds the `PackModel`
   from surviving specs, stamps each capsule's `quality` from its rubric score,
   wires edges, and returns `{ model, kept, rejected }` (the rejected list is the
   audit trail). `assemblePack` is the back-compat wrapper returning just `model`.

6. **Write.** The pack writer projects graph, wiki, exports to disk.

## The trust ladder (who decides what)

| Layer         | Mechanism                       | Catches                                    |
| ------------- | ------------------------------- | ------------------------------------------ |
| Rubric (C3)   | `scoreNode`, deterministic      | provably-generic, dishonest, untraced      |
| Critic (C2)   | model, `anti-generic-critic.md` | subtle generic-but-well-formed non-insight |
| Human (C0–C1) | Alex opens the first node       | "does this actually impress me"            |

The rubric is the floor, not the ceiling. "First node must impress" is enforced by
all three together: the rubric kills the obviously-bad, the critic kills the
subtly-bad, and the human gate is the final, un-automatable taste check.

## Calibration is the rubric's regression suite

`calibration.ts` holds 5 impressive exemplars lifted verbatim from a real compiled
pack (ATT.004, ATT.005, COPY.055, SEO.124, UNK.001) and 5 deliberately generic
rewrites. `calibration.test.ts` asserts the rubric never rejects a real exemplar and
always rejects a generic one. If you change `rubric.ts` or `quality-signals.ts`,
this suite is what proves the rubric still discriminates.

## Acceptance (the honest gate)

1. `pnpm test` — build + all node:test green, **including calibration**.
2. Recompile the showcase intent (`build-from-specs`) and confirm the pack writes.
3. **Alex opens the first node.** The rubric cannot replace this; it only earns the
   right to put a node in front of him.
