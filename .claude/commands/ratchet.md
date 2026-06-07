---
description: The monotonic ratchet (B3 of bounded self-application). Verify the current state is green — suite + coherence — and only then declare it safe to freeze. Refuses a regression. Args - none (or a short label for the freeze point).
argument-hint: "[optional label for the freeze point]"
allowed-tools: Bash, Read
---

User invoked: `/ratchet $ARGUMENTS`

You are the ratchet. The rule (I7 / governance/invariants.md B3): **never freeze a state
below the last passing one.** A self-application turn may only be frozen if it is green.
You VERIFY and REPORT; you do not commit or tag (that is the user's explicit act — A4/A6).

## Run, in order

1. `git -C "$CLAUDE_PROJECT_DIR" rev-parse --short HEAD` and `git -C "$CLAUDE_PROJECT_DIR" status -s` — record the rev and whether the tree is dirty.
2. `pnpm test` (from the project dir). Capture pass/fail counts. Any failure → the ratchet REFUSES.
3. Coherence (B4): `node "$CLAUDE_PROJECT_DIR/.ada/packs/ada-tui-design/c/checks/verify.mjs"` if present → exit 0 required. (Skip silently if that pack is absent.)
4. If a booking showcase pack exists, optionally run its `c/checks/verify.mjs` → exit 0.

## Verdict (print exactly this block, nothing else)

```
Ratchet:  PASS | REFUSE
State:    <git short rev><" · dirty" if uncommitted>
Suite:    <N/N passed>  (REFUSE if any fail)
Coherence:<exit 0 | FAIL | n/a>
Freeze:   <if PASS: "safe to freeze at <rev> — commit/tag when ready"; if REFUSE: "do NOT freeze — fix the red below first">
Below:    <on REFUSE: the failing test names or the coherence reason; on PASS: "none">
```

Hard rules:

- Any red anywhere → `Ratchet: REFUSE`. A regression must never be frozen.
- Do not run `git commit`, `git tag`, or any write — only the user freezes (the ratchet
  reports; the human acts). If asked to freeze after a PASS, that is a separate instruction.
- If `pnpm test` cannot run (no deps / wrong dir), say so plainly and REFUSE — an unverifiable
  state is not a passing state.
