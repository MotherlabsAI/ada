# κ ● ∴ κ ⇒ WORKFLOW.007 — Reschedule Flow

- cluster: WORKFLOW · depth: L4 · truth: ∴ inference
- checkability: C4 (property-based)
- compiles to: blueprint, c

**Summary.** Move a booking to a new slot without losing the deposit or creating an overlap.

**Why.** Reschedules are where double-bookings and lost deposits sneak in.

**Failure if missing.** The old slot stays held, or the new slot overlaps another booking.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
