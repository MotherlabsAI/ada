# C Checks

Deterministic invariants (AXIOM A3 — no model inside a check).

- **no_double_booking** [C4] — No active booking may overlap another active booking for the same staff member.
- **non_negative_payment** [C5] — Every payment amount is non-negative; refunds are a refund kind with a positive amount.
- **booking_well_formed** [C5] — Every active booking references a staff, client, and service, and starts before it ends.
