# Context engineering for a local service-business recognition system — executor instructions

This project has a compiled Ada context pack. Build from it, not from a raw prompt.

## What to load first
- `wiki/index.md` — the map and the high-value nodes
- `exports/blueprint/BLUEPRINT.md` — the deterministic build contract
- `exports/blueprint/ACCEPTANCE.md` — the must-pass conditions
- `c/C.md` — the deterministic checks

## Hard rules (from the pack's axioms)
- Every active booking MUST satisfy the C checks before code is accepted:
- `no_double_booking` [C4] — No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped.
- `non_negative_payment` [C5] — Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount.
- `booking_well_formed` [C5] — Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends.
- Money is integer minor units (cents). Never floats.
- Do not invent constraints that are listed as open questions — see `wiki/open-questions.md`.
- Payment, customer-data, and destructive actions are human-gated. Ask before doing them.

## Definition of done
Run the pack's own verification before claiming done:

```bash
node c/checks/verify.mjs                 # bundled clean dataset → all pass
node c/checks/verify.mjs --defect        # planted double-booking → no_double_booking FAILS
node c/checks/verify.mjs --data DATA.json # YOUR data, exported as {staff,clients,services,bookings,payments}
```

A feature is done when the code satisfies ACCEPTANCE.md AND the C checks pass when run
against your real data via `--data` (export your records to JSON), not just the fixtures.
