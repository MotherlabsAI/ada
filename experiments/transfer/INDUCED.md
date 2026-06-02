# Induced invariant — the unit under test

**Origin (the single failure).** Adversarial review found that `no_double_booking`
compared `Date.parse(...)` results directly; an unparseable/missing date yields `NaN`,
every comparison with `NaN` is `false`, so a malformed booking was silently treated as
non-overlapping → a false PASS.

**Generalized invariant (what we induce from that one failure):**

> Temporal logic must never treat unparseable or missing time data as valid/non-conflicting.
> Any code that parses a timestamp and feeds it to a comparison must reject or flag the
> record when the parse fails — silence is not an acceptable answer.

**The transfer claim (doc §10):** a check induced from _this_ failure should catch the
_same class_ of failure in code it was **not written for** — different functions,
different authors, even a different feature.

We test transfer three ways:

1. **Behavioral / same-domain, blind subjects** — fire a malformed-date probe at the 4
   A8 booking arms (written by separate agents; the original grader never tested this axis).
2. **Static / whole-source** — a lint induced from the pattern scans every file.
3. **Behavioral / cross-domain** — fire the _same interval invariant_ at a _different_
   feature (room reservation) built blind by independent agents.

Transfer is demonstrated if the induced check flags genuine failures in subjects it was
not authored against. Precision matters too: it must not flag correct code.
