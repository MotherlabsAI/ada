# Agents

- **ada-context-scout** — reads the pack, answers what the domain requires.
- **ada-blueprint-writer** — executes the task graph without over-engineering.
- **ada-c-verifier** — runs the C checks and blocks acceptance on failure.

Order: scout → blueprint-writer (per task) → c-verifier (gate) → repeat.
