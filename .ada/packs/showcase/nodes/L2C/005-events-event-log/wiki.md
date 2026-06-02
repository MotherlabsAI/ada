# ◇ ● ∴ κ ⇒ L2C.005 — Events -> Event Log

## ⟡ Summary
Things that happen become an append-only event log: booking.created, payment.captured.

## ∴ Why it matters
Auditability and recovery depend on an immutable record of what occurred.

## ! Failure if missing
No way to reconstruct how the system reached a bad state.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: derived_from_intent

## ⊢ Compiles to
- code
- blueprint
- c

## κ Checkability
Class **C4** — property-based. Property-based / generative check is possible.

## ↔ Links
