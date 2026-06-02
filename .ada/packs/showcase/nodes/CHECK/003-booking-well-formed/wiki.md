# κ ● ∵ κ CHECK.003 — booking_well_formed

## ⟡ Summary
Every active booking references a staff, client, and service, and starts before it ends.

## ∴ Why it matters
Referential and temporal integrity for the core object.

## ! Failure if missing
Orphaned or inverted-interval bookings.

## ∵ Evidence
- Truth class: ∵ source
- Source status: user_or_spec_provided

## ⊢ Compiles to
- c

## κ Checkability
Class **C5** — static/db. Static, type, or database-level constraint is possible.

Candidate checks:
- `c.booking_well_formed`

## ↔ Links
- **Parents:** ROOT.008
- **Depends on:** DATA.006
