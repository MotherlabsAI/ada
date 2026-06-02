# κ ● ∴ κ ⇒ DOMAIN.010 — Payment

## ⟡ Summary
Money moving in or out, recorded in the ledger in integer minor units.

## ∴ Why it matters
Financial correctness is non-negotiable; this is where money math is checked.

## ! Failure if missing
Negative amounts, float drift, or refunds exceeding payments.

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
- `c.non_negative_payment`

## ↔ Links
- **Children:** DATA.007
- **Guarded by:** CHECK.002
