# ◇ ● ∴ κ ⇒ DATA.006 — Appointment Table

- cluster: DATA · depth: L5 · truth: ∴ inference
- checkability: C5 (static/db)
- compiles to: code, blueprint, c

**Summary.** bookings(id, staff_id, client_id, service_id, starts_at, ends_at, status).

**Why.** The transactional heart; the overlap and well-formedness checks run against this.

**Failure if missing.** Overlapping or orphaned bookings.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
