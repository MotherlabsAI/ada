# ◇ ● ∴ κ ⇒ DATA.006 — Appointment Table

## ⟡ Summary
bookings(id, staff_id, client_id, service_id, starts_at, ends_at, status).

## ∴ Why it matters
The transactional heart; the overlap and well-formedness checks run against this.

## ! Failure if missing
Overlapping or orphaned bookings.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: derived_from_intent

## ⊢ Compiles to
- code
- blueprint
- c

## κ Checkability
Class **C5** — static/db. Static, type, or database-level constraint is possible.

## ↔ Links
- **Parents:** DATA.002
- **Guarded by:** CHECK.001, CHECK.003
