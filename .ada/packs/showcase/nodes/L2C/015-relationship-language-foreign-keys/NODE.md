# ◇ ● ∴ κ ⇒ L2C.015 — Relationship Language -> Foreign Keys

- cluster: L2C · depth: L5 · truth: ∴ inference
- checkability: C5 (static/db)
- compiles to: code, blueprint, c

**Summary.** 'Belongs to' / 'has many' becomes foreign keys and referential integrity.

**Why.** Relationships expressed in prose do not enforce integrity; keys do.

**Failure if missing.** Orphaned bookings; payments pointing at deleted clients.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
