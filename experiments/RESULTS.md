# A8 Experiment — Results

**Question (AXIOM A8).** Does the Ada pack make an executor measurably better than a raw prompt?

**Method.** Build the same booking module 4× against an identical, invariant-neutral
interface contract. 2 arms **blind** (forbidden to read the pack/axioms/source), 2 arms
**with the pack** (read CLAUDE.md, BLUEPRINT.md, ACCEPTANCE.md, C.md). Grade
deterministically with `score.mjs` — behaviour only, independent of the pack's own checks.
7 scenarios; 4 are hard "must-reject" guards. Anti-gaming: blanket-rejecting second
bookings loses the _touching_ and _other-staff_ cases.

## Scorecard

| arm    | mode  | score   | hard guards |
| ------ | ----- | ------- | ----------- |
| armA-1 | blind | 6/7     | 4/4         |
| armA-2 | blind | 6/7     | 4/4         |
| armB-1 | pack  | **7/7** | 4/4         |
| armB-2 | pack  | **7/7** | 4/4         |

Reference baselines: naive (accept-all) 3/7, 0/4 guards · strict 7/7, 4/4 guards.

## Honest interpretation

1. **The simple "raw prompt misses double-booking" story did NOT reproduce.** A capable
   model, even blind, independently built a thorough validator — both blind arms caught
   double-booking, negative payments, and malformed bookings (4/4 hard guards). The pack
   did not rescue a failing baseline; the baseline was already strong.

2. **The measurable delta is scope precision + reproducibility, not capability.** The two
   pack arms behaved _identically_ and matched the spec exactly. The two blind arms each
   invented _extra_ rules that weren't requested (duration-must-equal-service-minutes,
   same-client-no-overlap) and diverged from the contract. One of those extra rules made
   them reject a legitimate booking (`other_staff_same_time`) → the 6/7.

3. **The experiment surfaced a real gap in the pack (the C-growth loop firing for real).**
   The blind arms' "miss" was them enforcing _a client cannot hold two overlapping
   bookings_ — a defensible invariant the pack does **not** encode. That is a genuine
   candidate check the pack is missing, discovered by the experiment, not by us.

## Limitations (do not over-read this)

- N = 2 per arm, one feature, a generous interface, a capable model. Signal, not proof.
- The 1-point gap lives on a scope-precision axis, not a catastrophe-prevention axis.

## Verdict

Thesis **partially supported**: the pack's value here is _determinism and exact
spec-conformance_ (two independent builds, identical correct behaviour) rather than
raising a weak model to competence. And the run already paid for itself by surfacing a
missing invariant — a decision for the human gate (Alex), not for Ada to add unilaterally.
