# Ada — Roadmap

Living document. Updated 2026-04-21. Terse by design.

---

## Current state

**v0.1.0-alpha.** 7-stage pipeline (CTX→INT→PER→ENT→PRO→SYN→GOV) live end-to-end. 8 `@ada/*` packages plus `cli`. CLI exposes 7 commands (`compile`, `init`, `verify`, `config`, `status`, `history`, `repl`). Platforms: Linux and macOS. Post-compile Q&A and auto-spawn Claude Code on ACCEPT both working. World model git-backed.

---

## Near-term — next 4 weeks

| Item                                        | Rationale                                                               | Status  |
| ------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| Streaming token feedback in `ada compile`   | Satisfies UX R4 — no LLM stage silent > 500 ms. Currently line-buffered. | planned |
| Linux terminal-spawn parity in `ada init`   | macOS `osascript` branch has no Linux equivalent. Violates UX R8.        | planned |
| Per-subcommand `--help`                     | UX R11 — every command must print its own flags. Partial coverage today. | planned |
| Shell completions (bash, zsh, fish)         | Discoverability and typing friction. Ships via `ada completion <shell>`. | planned |
| Test coverage ≥ 60% per package             | Most packages below threshold; regressions land silently.               | planned |

---

## Mid-term — next 3 months

| Item                                       | Rationale                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Prompt caching                             | Stage prompts are stable and long. Sonnet cache cuts cost and latency materially. |
| Multi-model routing                        | Sonnet-only today. Route trivial stages (CTX) to Haiku, keep Sonnet for GOV.  |
| Incremental re-compile                     | Reuse INT and PER outputs when only downstream stages change. Avoid full reruns. |
| `WORLD-MODEL.md` human-readable output     | Current artifacts are git blobs; humans need a browsable summary per project. |
| `ada lint` for blueprints                  | Static checks for invariant coverage, dangling refs, missing state machines.  |

---

## Long-term — research / speculative

- Self-hosting: `ada compile "build ada"` governed to ACCEPT without human iteration.
- Cross-language blueprint targets beyond Claude Code (Cursor, Aider, arbitrary agents).
- Blueprint diffing and merge — treat intent as source, rebase downstream artifacts.
- Local-model fallback for the full pipeline (no cloud dependency).
- Formal entropy bounds per stage, replacing estimated entropy with measured.
- Collaborative elicitation — multiple stakeholders on one intent graph.

---

## Non-goals

- Ada is **not a code generator**. It compiles intent into governance, not implementation.
- Ada is **not a Claude Code replacement**. It feeds Claude Code; it does not replace it.
- Ada is **not a multi-tenant SaaS**. Single-operator tool, local-first, no server product.
- Ada is **not a full TUI workbench**. CLI plus minimal Ink screens. No IDE-like surfaces.
- Ada is **not a general-purpose spec language**. Scope is agent-coding intent only.
