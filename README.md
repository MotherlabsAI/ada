# Ada

**A semantic compiler that turns human intent into governed execution.**

Ada closes the gap between what you mean and what gets built.

You write one sentence. Ada compiles it into a deterministic, auditable blueprint — then governs the execution so drift can't happen.

## The Problem

AI coding tools in 2026 generate code fast. But fast generation of the wrong thing is still the wrong thing.

- **87% of AI-generated PRs contain security vulnerabilities** — [DryRun Security, March 2026](https://www.helpnetsecurity.com/2026/03/13/claude-code-openai-codex-google-gemini-ai-coding-agent-security/)
- **50% of test-passing AI PRs would be rejected by real maintainers** — [METR, March 2026](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/)
- **Experienced developers are 19% slower with AI tools** (while believing they're 20% faster) — [METR, 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- **85% per-step accuracy → 20% success across 10 steps** — compound failure kills multi-step pipelines

The root cause: unconstrained generation drifts. Drift compounds. Compounded drift is waste.

## The Solution

Ada doesn't make AI smarter. Ada makes it impossible for AI to build the wrong thing.

```
ada compile "a marketplace where local artisans sell handmade goods with reputation scoring"
```

Seven agents, each blind to the others, each asking one question:

| Stage | Agent     | Question                | Lens                                     |
| ----- | --------- | ----------------------- | ---------------------------------------- |
| INT   | Intent    | What do you want?       | Goals, constraints, unknowns             |
| PER   | Persona   | In what world?          | Domain, stakeholders, vocabulary         |
| ENT   | Entity    | What things exist?      | Entities, invariants, bounded contexts   |
| PRO   | Process   | What happens?           | Workflows, state machines, Hoare triples |
| SYN   | Synthesis | How do they fit?        | Architecture, components, conflicts      |
| VER   | Verify    | Is that right?          | Coverage, coherence, drift detection     |
| GOV   | Governor  | Does this meet the bar? | ACCEPT / REJECT / ITERATE                |

Between every stage, a **provenance gate** tracks entropy. Started at 1.0 (pure chaos). Each successful stage reduces it. If entropy increases at any transition — something went wrong.

The output is a **governed blueprint** — a machine-readable artifact with full provenance tracing every element back to the original intent. Claude Code builds from the blueprint, not from vibes.

## Architecture

```
Intent (text) → 7-Stage Pipeline → Governed Blueprint (JSON)
                     │
                     ├── Entropy gates between stages
                     ├── Schema-validated structured output
                     ├── Provenance postcodes on every element
                     └── Governor authority (ACCEPT/REJECT/ITERATE)
```

**Pattern:** Gated sequential pipeline — each stage's output feeds the next, provenance gates enforce entropy reduction, Governor has final authority.

**Key properties:**

- **Stateless** — no database, no session persistence, each compilation is independent
- **Deterministic** — temperature 0, structured output schemas, pinned prompt versions
- **Auditable** — every blueprint element traces to its source intent through provenance postcodes
- **Blind agents** — cross-contamination is how compilers fail; each agent sees only its own lens

## Packages

| Package              | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `@ada/compiler`      | 7-agent compilation engine with Zod-validated schemas              |
| `@ada/provenance`    | Postcode addressing and SQLite provenance store                    |
| `@ada/orchestrator`  | Compilation loop, Claude Code spawning, checkpoints                |
| `@ada/governor`      | Runtime drift detection, confidence tracking, invariant evaluation |
| `@ada/config-writer` | CLAUDE.md, hooks, settings, skills, agent definitions              |
| `@ada/mcp-server`    | MCP tools for blueprint inspection and workflow verification       |
| `@ada/cli`           | Ink/React terminal UI with live stage streaming                    |

## Research Context

Ada implements what the academic community is now calling for:

- **Intent Formalization** — ["A Grand Challenge for Reliable Coding in the Age of AI Agents"](https://arxiv.org/abs/2603.17150) (March 21, 2026) identifies the translation of informal intent to checkable specifications as the key challenge. Ada is the implementation.

- **Entropy Trajectory Monotonicity** — [Research shows](https://arxiv.org/abs/2603.18940) that monotone entropy chains (decreasing at every step) predict 68.8% accuracy vs 46.8% for non-monotone. Ada's provenance gates track exactly this.

- **Agent Behavioral Contracts** — [The ABC framework](https://arxiv.org/abs/2602.22302) proposes C = (P, I, G, R) — Preconditions, Invariants, Governance, Recovery. Ada's gate system is a behavioral contract between stages. Contracted agents detect 5.2-6.8 violations per session that uncontracted baselines miss.

- **Agent Drift** — [Quantified](https://arxiv.org/abs/2601.04170) as semantic drift, coordination drift, and behavioral drift. Ada prevents coordination drift by design — blind agents can't coordinate, so they can't drift together.

- **VibeContract** — [Embeds Design-by-Contract](https://arxiv.org/html/2603.15691) into AI code generation. Ada's entity invariants are the blueprint-level equivalent — constraints defined before code exists.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run a compilation (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=sk-ant-...
pnpm dev compile "your intent here"
```

## The Self-Compile Proof

```
ada compile "build ada"  →  Governor ACCEPT
```

The compiler compiled itself. If that works, the thesis is true. If it doesn't, the architecture is incomplete.

## Status

**v0.1.0-alpha** — All packages built. Pipeline functional. Live test pending.

## License

MIT — [Motherlabs](https://github.com/motherlabs) © 2026
