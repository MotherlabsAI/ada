# Context engineering for a local service-business recognition system

> I need to build a local service business website system that ranks in Google, gets recognized by ChatGPT/agents, converts attention into bookings, and gives Claude Code enough context to build the thing properly.

- Nodes: **24** · Edges: **32** · Checks: **3** · Residue: **8**
- Clusters: ROOT, ATT, COPY, SEO, UNK

## Layout
- `wiki/` — readable memory (start at `index.md`)
- `nodes/` — one folder per context capsule
- `c/` — deterministic checks (`node c/checks/verify.mjs`)
- `exports/claude/` — CLAUDE.md, skill, subagents, prompts
- `exports/blueprint/` — the deterministic build contract

Provenance: Excavated by the Ada compile workforce from one intent, aligned to the context-engineering taxonomy; every node anti-generic-gated. Exploratory layer (AXIOM A1); provenance via truth-class + fromPrompt (AXIOM A2).
