# ◇ ● ∴ κ ⇒ DATA.007 — Payment Table

## ⟡ Summary
payments(id, booking_id, amount_cents, kind).

## ∴ Why it matters
The ledger; amounts are integer minor units.

## ! Failure if missing
Negative amounts or floats produce financial errors.

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
- **Guarded by:** CHECK.002
