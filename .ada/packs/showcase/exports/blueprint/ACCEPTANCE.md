# Acceptance Criteria

Must-pass conditions (from must-language → acceptance, L2C.011):

- MUST: No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped. (`no_double_booking`)
- MUST: Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount. (`non_negative_payment`)
- MUST: Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends. (`booking_well_formed`)
- MUST: a cancelled booking never blocks its slot and is never charged.
- MUST: a reschedule never creates an overlap and never loses the deposit.

Verify with the pack's own harness — see `VERIFY.md`.
