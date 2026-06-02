# ◇ ● ∴ κ ⇒ L2C.015 — Relationship Language -> Foreign Keys

## ⟡ Summary
'Belongs to' / 'has many' becomes foreign keys and referential integrity.

## ∴ Why it matters
Relationships expressed in prose do not enforce integrity; keys do.

## ! Failure if missing
Orphaned bookings; payments pointing at deleted clients.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: derived_from_intent

## ⊢ Compiles to
- code
- blueprint
- c

## κ Checkability
Class **C5** — static/db. Static, type, or database-level constraint is possible.

Candidate checks:
- `schema.booking_references_existing_staff_and_client`

## ↔ Links
