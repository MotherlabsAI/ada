# κ ● ∵ κ CHECK.001 — no_double_booking

## ⟡ Summary
No active booking may overlap another active booking for the same staff member.

## ∴ Why it matters
The signature trust invariant of the showcase; the spec's 'first trust moment'.

## ! Failure if missing
Double-booked staff — the failure Ada exists to catch before the executor ships it.

## ∵ Evidence
- Truth class: ∵ source
- Source status: user_or_spec_provided

## ⊢ Compiles to
- c

## κ Checkability
Class **C4** — property-based. Property-based / generative check is possible.

Candidate checks:
- `c.no_double_booking`

## ↔ Links
- **Parents:** ROOT.008
- **Depends on:** DATA.006
