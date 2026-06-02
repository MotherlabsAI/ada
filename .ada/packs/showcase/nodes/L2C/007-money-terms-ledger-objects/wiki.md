# ◇ ● ∴ κ ⇒ L2C.007 — Money Terms -> Ledger Objects

## ⟡ Summary
Money words become ledger objects in integer minor units: deposits, balances, refunds.

## ∴ Why it matters
Floats and ad-hoc money math cause real financial errors.

## ! Failure if missing
Rounding drift; negative balances; a refund that exceeds the payment.

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
- `ledger.amounts_are_integer_minor_units`
- `ledger.non_negative_payment`

## ↔ Links
