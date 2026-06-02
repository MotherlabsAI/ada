# κ ● ∵ κ CHECK.002 — non_negative_payment

## ⟡ Summary
Every payment amount is non-negative; refunds are a refund kind with a positive amount.

## ∴ Why it matters
Financial correctness, enforced at the data edge.

## ! Failure if missing
Negative or malformed money.

## ∵ Evidence
- Truth class: ∵ source
- Source status: user_or_spec_provided

## ⊢ Compiles to
- c

## κ Checkability
Class **C5** — static/db. Static, type, or database-level constraint is possible.

Candidate checks:
- `c.non_negative_payment`

## ↔ Links
- **Parents:** ROOT.008
- **Depends on:** DATA.007
