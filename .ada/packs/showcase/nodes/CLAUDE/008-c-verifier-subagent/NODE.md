# λ ● ∴ κ ⇒ CLAUDE.008 — C Verifier Subagent

- cluster: CLAUDE · depth: L5 · truth: ∴ inference
- checkability: C3 (deterministic)
- compiles to: claude, c

**Summary.** A subagent that runs the pack's verify.mjs and reports pass/fail before code is accepted.

**Why.** Wires the trust layer into the executor's loop.

**Failure if missing.** Code ships without the checks ever running.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.
