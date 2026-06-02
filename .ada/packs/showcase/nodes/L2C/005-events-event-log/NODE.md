# ◇ ● ∴ κ ⇒ L2C.005 — Events -> Event Log

- cluster: L2C · depth: L5 · truth: ∴ inference
- checkability: C4 (property-based)
- compiles to: code, blueprint, c

**Summary.** Things that happen become an append-only event log: booking.created, payment.captured.

**Why.** Auditability and recovery depend on an immutable record of what occurred.

**Failure if missing.** No way to reconstruct how the system reached a bad state.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
