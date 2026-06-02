---
name: ada-context
description: Use when building the AI-Native Service Business Command Center. Loads the compiled Ada pack — world model, blueprint, and deterministic C checks — so the build follows governed context instead of a raw prompt.
---

# Ada Context Pack

You are building from a compiled world model. The pack separates exploration
(graph + wiki) from constraint (blueprint + C checks). Honour that separation.

## Procedure
1. Read `wiki/index.md` and the high-value nodes it lists.
2. Read `exports/blueprint/BLUEPRINT.md` and `ACCEPTANCE.md`.
3. Implement against the blueprint's data model and task graph.
4. Before claiming done, run `node c/checks/verify.mjs`. All checks must pass on real data.
5. If output is wrong but checks pass, that is a *missed failure*: propose a new invariant
   for `c/registry.yaml` rather than patching silently (the C growth loop).

## The invariants you must preserve
- `no_double_booking` [C4] — No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped.
- `non_negative_payment` [C5] — Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount.
- `booking_well_formed` [C5] — Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends.
