# κ ● ∵ κ CHECK.001 — no_double_booking

- cluster: CHECK · depth: L5 · truth: ∵ source
- checkability: C4 (property-based)
- compiles to: c

**Summary.** No active booking may overlap another active booking for the same staff member.

**Why.** The signature trust invariant of the showcase; the spec's 'first trust moment'.

**Failure if missing.** Double-booked staff — the failure Ada exists to catch before the executor ships it.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
