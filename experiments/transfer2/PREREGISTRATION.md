# Transfer Experiment v2 — PRE-REGISTRATION

> Written **before** any subject exists or any data is seen. The kill line is the
> threshold set before the run, not the story told after it. Frozen.

## The interesting claim (IC) on trial

> Ada's edge is real: from **one** positive example I can freeze a check that catches
> **independent, surface-variant** instances of the same failure (generality / recall)
> **without flagging correct code** (precision). A transferable, growing verifier set is
> therefore buildable on a failure class models reproduce.

This is the induction problem in one experiment: the induced check must be **general
enough** to match a variant it never saw, and **narrow enough** to stay at zero false
positives. "Too narrow" is exactly what the only prior hit (intra-session sibling catch)
was — and sibling/own-code catches **do not count** here.

## Failure class (chosen for a nonzero base rate)

The **client-overlap** rule: in an in-person booking system, the _same client_ cannot hold
two time-overlapping bookings even across _different staff_ (a person can't be in two
places at once). A8 showed models enforce this **inconsistently** (blind arms added it; the
pack arms, scoped to staff-overlap, did not). So the base rate should be strictly between
0 and 1, which is what makes transfer measurable.

## Frozen induced check (induced from arm A = A8 `armA-1`, which enforced client-overlap)

A single behavioral scenario, frozen here before the test population is built:

> Anchor: client `c1` booked with staff `s1` for `[10:00, 11:00]`.
> Probe: client `c1` booked with staff `s2` (different staff) for `[10:30, 11:30]`.
> A correct in-person booker MUST reject the probe. The induced check **flags** any
> implementation that **accepts** it.

(Half-open intervals: touching is not overlap.)

## Independent ground-truth battery (labels each arm; richer than the frozen check)

Per arm, after `reset` + seed, each scenario run from a clean state:

- **GT1 partial / GT2 contained / GT3 identical** — same client, different staff, overlapping. A correct arm rejects all three. Accepting **any** ⇒ the arm _has the failure_.
- **Controls C1 different-client-same-time / C2 touching / C3 non-overlap** — a correct arm accepts all three. Rejecting any ⇒ _over-broad_.
- **anchor must book at all** else _insane_.

Labels: `FAILURE` (accepts any GT1–3) · `OVERBROAD` (rejects any control) · `INSANE` (can't book) · `CORRECT` (rejects all GT, accepts all controls).

## Metrics

- **base rate** = #FAILURE / N
- **recall (generality)** = (#FAILURE arms the frozen check flags) / (#FAILURE arms)
- **precision** = (#flagged arms that truly have the failure) / (#flagged)
- **surface variance** = caught arms are independently authored (different code), built across 2 domain skins.

## THE KILL LINE (decided now; the result that drops IC)

The population: **N = 8** newly built, blind, independent arms (neutral brief, no pack).

IC is **DROPPED** (the "transferable verifier is Ada's edge" claim dies) if **any** of:

1. **VOID — degenerate base rate.** Fewer than **2 FAILURE** arms **or** fewer than **2
   CORRECT** arms among the 8. Then transfer is unmeasurable. Per discipline this counts as
   _unsupported_, not "inconclusive, re-roll" — **one run, no retries.**
2. **TOO NARROW.** recall **< 1.0** — the frozen check misses even one genuine FAILURE arm
   (it failed to generalize to a surface variant).
3. **TOO BROAD.** precision **< 1.0** — the frozen check flags even one arm that does not
   actually have the failure (including arm A itself, which must come back CORRECT and
   unflagged).

IC is **SUPPORTED (on this sample, with stated limits)** only if **all** hold:
≥2 FAILURE **and** ≥2 CORRECT arms · recall = 1.0 · precision = 1.0 · ≥2 distinct caught
arms · catches span both domain skins.

I commit to reporting the verdict the data gives, including DROPPED, with no softening.
