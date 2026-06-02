# ◇ ● ∴ κ ⇒ L2C.004 — States -> State Machines

- cluster: L2C · depth: L5 · truth: ∴ inference
- checkability: C4 (property-based)
- compiles to: code, blueprint, c

**Summary.** Lifecycle words become state machines: lead -> booked -> deposit-paid -> completed | cancelled | no-show.

**Why.** Illegal transitions are a major source of silent data corruption.

**Failure if missing.** A cancelled booking gets charged; a completed booking is rebooked.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
