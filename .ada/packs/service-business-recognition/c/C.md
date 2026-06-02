# C — Deterministic Verification Layer

C is the set of executable checks that state what *correct* means for the
checkable parts of this domain. A C check is a runnable pass/fail predicate —
not a prompt, not a model, not subjective judgment (AXIOM A3).

## Registry

| check | class | invariant |
|---|---|---|
| `no_double_booking` | C4 | No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped. |
| `non_negative_payment` | C5 | Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount. |
| `booking_well_formed` | C5 | Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends. |

## Run it

```bash
# from this pack's c/checks directory:
node verify.mjs            # all checks against the clean dataset (expect all pass)
node verify.mjs --defect   # against a planted double-booking (expect no_double_booking to FAIL)
node verify.mjs --json     # machine-readable report
```

## How C grows

A missed failure is the source of new C. When the executor produces output that
current checks pass but is still wrong, that defect is generalized into a new
invariant, scope-critiqued (too narrow / too broad), and added here.
