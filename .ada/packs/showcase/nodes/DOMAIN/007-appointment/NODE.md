# κ ● ∴ κ ⇒ DOMAIN.007 — Appointment

- cluster: DOMAIN · depth: L5 · truth: ∴ inference
- checkability: C4 (property-based)
- compiles to: code, blueprint, c

**Summary.** A booked slot: a client, a staff member, a service, a start and end time, and a lifecycle state.

**Why.** The central transactional object; the double-booking invariant lives here.

**Failure if missing.** Overlapping or malformed bookings corrupt the calendar and the day-of-service flow.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
