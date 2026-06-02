# κ ● ∵ κ CHECK.003 — booking_well_formed

- cluster: CHECK · depth: L5 · truth: ∵ source
- checkability: C5 (static/db)
- compiles to: c

**Summary.** Every active booking references a staff, client, and service, and starts before it ends.

**Why.** Referential and temporal integrity for the core object.

**Failure if missing.** Orphaned or inverted-interval bookings.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
