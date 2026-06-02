# ◇ ● ∴ κ ⇒ L2C.004 — States -> State Machines

## ⟡ Summary
Lifecycle words become state machines: lead -> booked -> deposit-paid -> completed | cancelled | no-show.

## ∴ Why it matters
Illegal transitions are a major source of silent data corruption.

## ! Failure if missing
A cancelled booking gets charged; a completed booking is rebooked.

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
- `state.no_illegal_transition`

## ↔ Links
