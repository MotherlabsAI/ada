# Transfer Experiment v2 — Results & Verdict

**Verdict: VOID → the interesting claim (IC) is DROPPED.**
Per the frozen `PREREGISTRATION.md`, kill condition #1 fired. One run, no retries.

## Data

8 blind arms (neutral brief, no overlap rule stated; 2 domain skins). Graded by the
independent ground-truth battery; the frozen induced check applied unchanged.

| metric                   | value                         |
| ------------------------ | ----------------------------- |
| FAILURE arms             | **0**                         |
| CORRECT arms             | **8 / 8** (4 salon, 4 clinic) |
| OVERBROAD / INSANE       | 0 / 0                         |
| base rate of the failure | **0%**                        |
| recall, precision        | n/a (no failures to catch)    |

Every arm rejected all three same-client overlap shapes and accepted all three legitimate
controls. Self-reports corroborate: all 8 listed "no client double-booking" as enforced.

## What this kills

The IC was: _Ada's edge is a transferable, growing verifier set, demonstrable on a failure
class models reproduce._ I picked client-overlap **because A8 was my evidence that models
reproduce it inconsistently.** They do not. In independent, un-steered code, capable models
enforce it **uniformly**. The base rate is zero, so transfer is unmeasurable, so — by the
threshold set before the run — the claim is dropped, not deferred.

This is the **second** pre-designed experiment to come back null:

- v1 (temporal/NaN): induced check found 0 bugs across 10 independent subjects.
- v2 (client-overlap): the failure class itself has a 0% base rate in independent code.

## The uncomfortable corollary (the A8 win was partly circular)

In A8 the only arms that _lacked_ client-overlap were the **pack** arms — and they lacked it
**because the pack told them to scope to staff-overlap.** The pack _suppressed_ a correct
invariant the blind models added on their own. Worse: my A8 grader encoded the pack's
narrower scope as ground truth, so it **penalized** the blind arms (6/7) for enforcing an
_additional real_ invariant and **rewarded** the pack arms (7/7) for matching the pack. The
A8 "pack wins" margin is therefore partly an artifact of grading against the pack's own
scope — and on the client dimension the pack made the output **worse**.

## Honest standing of the Ada thesis after two null runs

- **Mechanism:** deterministic checks work and are precise (0 false positives across ~18
  independent subjects now). Not in question.
- **Value over a capable raw model:** **undemonstrated.** Capability-uplift (A8) was small
  and partly circular; transfer (v1, v2) was null. I have not shown the checks catch things
  a good model + executor wouldn't catch anyway.
- **Dropped:** "transferable/growing verifier set as Ada's edge" and any capability-uplift
  framing. The grand "layer beneath ML" framing was already off the table; this removes the
  smaller version too, on current evidence.
- **Not claimed:** regression-lock value (a check stopping recurrence from weaker executors,
  rare/subtle domain rules, or long-term churn) is _plausible but undemonstrated_. I am not
  going to roll to a third failure class to try to resurrect the claim — that is the pattern
  the discipline exists to stop.

## The bar (if the claim is ever to be revived — not now)

Real evidence would require a failure class with a **demonstrated nonzero base rate in
independent capable code** AND an induced check that catches independent surface-variant
instances at zero false positives. Until such a class is found, the edge is unproven.
