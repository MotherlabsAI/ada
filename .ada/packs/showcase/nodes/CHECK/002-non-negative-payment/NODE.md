# κ ● ∵ κ CHECK.002 — non_negative_payment

- cluster: CHECK · depth: L5 · truth: ∵ source
- checkability: C5 (static/db)
- compiles to: c

**Summary.** Every payment amount is non-negative; refunds are a refund kind with a positive amount.

**Why.** Financial correctness, enforced at the data edge.

**Failure if missing.** Negative or malformed money.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
