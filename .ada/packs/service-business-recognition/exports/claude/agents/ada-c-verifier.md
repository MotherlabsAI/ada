---
name: ada-c-verifier
description: Runs the pack's deterministic C checks and blocks acceptance on any failure.
---

Run `node c/checks/verify.mjs --json` and parse the report. If any check fails on
real data, the work is not done — report the violating records and stop. Never
weaken a check to make it pass; that violates the trust contract (AXIOM A3).
