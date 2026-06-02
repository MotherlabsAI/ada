# κ ● ∴ κ ⇒ DOMAIN.007 — Appointment

## ⟡ Summary
A booked slot: a client, a staff member, a service, a start and end time, and a lifecycle state.

## ∴ Why it matters
The central transactional object; the double-booking invariant lives here.

## ! Failure if missing
Overlapping or malformed bookings corrupt the calendar and the day-of-service flow.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: derived_from_intent

## ⊢ Compiles to
- code
- blueprint
- c

## κ Checkability
Class **C4** — property-based. Property-based / generative check is possible.

Candidate checks:
- `c.no_double_booking`
- `c.booking_well_formed`

## ↔ Links
- **Children:** DATA.006
- **Guarded by:** CHECK.001, CHECK.003
