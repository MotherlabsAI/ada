# ◇ ● ∴ κ ⇒ DATA.007 — Payment Table

- cluster: DATA · depth: L5 · truth: ∴ inference
- checkability: C5 (static/db)
- compiles to: code, blueprint, c

**Summary.** payments(id, booking_id, amount_cents, kind).

**Why.** The ledger; amounts are integer minor units.

**Failure if missing.** Negative amounts or floats produce financial errors.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
