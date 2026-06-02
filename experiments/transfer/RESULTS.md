# Transfer Experiment — Results

**Claim under test (Expert-Model doc §10).** Ada's one unbuilt bet is _a check set that
grows and transfers_: a check induced from one failure catches the same class of failure
**elsewhere it wasn't written for**.

**Induced unit.** From a single real failure (the review's NaN-mask in `no_double_booking`)
we induced the invariant: _temporal logic must never treat unparseable/missing time as
valid or non-conflicting_, plus its code-pattern lint (`Date.parse` in a comparison with
no NaN guard). See `INDUCED.md`.

## What we ran

| layer                        | subjects                                           | what it tests                                            | result                                                                                     |
| ---------------------------- | -------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1 · behavioral, same domain  | 4 A8 booking arms (blind authors)                  | malformed-date axis the A8 grader never tested           | **4/4 arms clean** — 0 bugs caught                                                         |
| 2 · static lint, all source  | Ada `src/` + 4 arms + pre-fix code                 | code-pattern sweep                                       | 0 in real subjects; **flags pre-fix code**; 0 false positives                              |
| 3 · behavioral, cross-domain | 6 room-reservation arms (blind, different feature) | does the _interval_ invariant transfer to another domain | **6/6 arms clean** — 0 bugs caught                                                         |
| organic                      | my own code                                        | the failure the review actually found                    | **1 real transfer hit**: induced from `no_double_booking`, caught in `booking_well_formed` |

## The honest finding

**The transfer mechanism works and is precise; the transfer benefit is gated by recurrence.**

- The induced check **fires correctly** on the real defect (pre-fix code) and produced
  **zero false positives across 10 independent correct implementations**. So a
  growing/transferring check set is buildable and won't drown the user in noise.
- But across 10 capable-model-written subjects — same domain _and_ a different domain —
  the induced check caught **nothing**, because none reproduced the failure class. Frontier
  models, even blind, independently wrote robust half-open overlap + ISO-validation + NaN-safe
  temporal code.
- The **only** realized transfer hit was **intra-session**: the same model made the same
  subtle mistake in two sibling checks, and the induced insight swept the second. That _is_
  the doc's literal test passing — just within one build, not across independent authors.

## What this means for Ada (sharpened, not refuted)

The value of C-transfer is **not** "catch bugs a capable model would avoid anyway"
(that delta is ~0, consistent with the A8 result). Its real, defensible value is:

1. **Intra-build sweep** — one induced check catches every sibling instance of the same
   mistake in the current work (demonstrated).
2. **Regression lock** — once a failure is seen, the check stops it ever recurring, including
   from weaker models, future refactors, or a different executor. C survives model changes
   because it checks outputs, not prompts (AXIOM A3).
3. **Recurring / domain-specific / model-weak invariants** — the payoff scales with how often
   the failure actually recurs, not with how clever the check is.

So Ada's registry earns its keep as a **deterministic regression + consistency guarantee**,
strongest on recurring and domain-specific failures — not as a capability-uplift layer.

## Limitations / the fair next test

- N = 10 subjects, **one** failure class (temporal/NaN) — one that frontier models happen to
  handle well. Generous interfaces, capable model.
- The decisive follow-up: **induce from a failure class models actually reproduce** (e.g. the
  client-overlap rule the A8 arms applied inconsistently, timezone/DST math, or money
  rounding). That is where independent cross-subject transfer is most likely to show a
  non-zero benefit — and it is the honest way to find Ada's real edge.
