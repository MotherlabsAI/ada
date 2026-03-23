# Ada

Semantic compiler: intent → governed blueprint → constrained execution.

## What Ada Does

You provide a natural language intent. Ada compiles it through a 7-stage agent pipeline into a deterministic, auditable blueprint. Each stage produces a typed, schema-validated artifact. Provenance gates between stages track entropy and enforce monotonic information gain. A Governor agent makes the final ACCEPT/REJECT/ITERATE decision.

The output is a blueprint that constrains downstream execution (Claude Code sessions, code generation, deployment) — not the code itself.

## Architecture

```
Intent → Persona → Entity → Process → Synthesis → Verify → Governor
  ↓        ↓        ↓        ↓          ↓          ↓        ↓
Sonnet   Sonnet   Sonnet   Sonnet     Opus       Opus     Opus
  ↓        ↓        ↓        ↓          ↓          ↓        ↓
 gate     gate     gate     gate       gate       gate    ACCEPT
                                                          REJECT
                                                          ITERATE
```

Each gate validates: Zod schema compliance, entropy below threshold (0.7), entropy monotonicity (must decrease from previous stage), and no unresolved blocking challenges.

**Agent lenses** — each agent is blind to the others:

| Stage | Question                | Lens                                                           |
| ----- | ----------------------- | -------------------------------------------------------------- |
| INT   | What do you want?       | Goals, constraints, unknowns                                   |
| PER   | In what world?          | Domain, stakeholders, vocabulary                               |
| ENT   | What things exist?      | Entities, invariants, bounded contexts                         |
| PRO   | What happens?           | Workflows, state machines, Hoare triples                       |
| SYN   | How do they fit?        | Architecture, components, conflict resolution                  |
| VER   | Is that right?          | Coverage score, coherence score, drift detection               |
| GOV   | Does this meet the bar? | Full pipeline state, entropy trajectory, ACCEPT/REJECT/ITERATE |

## Packages

| Package              | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `@ada/compiler`      | 7-agent pipeline engine, Zod schemas, structured output API calls  |
| `@ada/provenance`    | Postcode addressing, SQLite store, entropy tracking                |
| `@ada/orchestrator`  | Compilation loop, Claude Code session spawning, checkpoints        |
| `@ada/governor`      | Runtime drift detection, confidence tracking, invariant evaluation |
| `@ada/config-writer` | Generates CLAUDE.md, hooks, settings, skills, agent definitions    |
| `@ada/mcp-server`    | MCP tools for blueprint inspection and workflow verification       |
| `@ada/cli`           | Terminal UI (Ink/React) with live stage streaming                  |

## Quick Start

```bash
git clone https://github.com/alexrozex/ada.git
cd ada
pnpm install
pnpm build

# Requires Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...
pnpm dev compile "build a REST API for user authentication with JWT tokens"
```

## Design Decisions

**Blind agents.** Each stage sees only its input schema, not other stages' outputs. Prevents coordination drift — the tendency of multi-agent systems to develop consensus errors over extended interactions ([arxiv 2601.04170](https://arxiv.org/abs/2601.04170)).

**Schema-constrained outputs.** Every agent produces JSON via Anthropic's native structured outputs (`output_config.format` with `zodOutputFormat()`). Constrained decoding at the token level. Zero parse failures on the API path. CLI fallback retains text extraction with Zod validation.

**Entropy monotonicity.** Gates don't just check "is entropy low enough" — they check "did entropy decrease from the previous stage." Monotone chains achieve 68.8% accuracy vs 46.8% for non-monotone ([arxiv 2603.18940](https://arxiv.org/abs/2603.18940)). Shape over magnitude.

**Opus on critical stages.** Synthesis, Verify, and Governor run on Opus 4.6 with extended thinking. Earlier stages use Sonnet 4.6. Cost/accuracy tradeoff is intentional — constraint engineering happens in the later stages.

**Additive iteration.** When the Governor says ITERATE, the correction appends to the original intent rather than replacing it. The user's words are the source of truth; corrections are additive constraints.

**Self-compile proof.** `ada compile "build ada"` must Governor ACCEPT. The compiler compiles itself. If that works, the thesis is true. If it doesn't, the architecture is incomplete.

## Research Context

Ada implements what the academic community named as a "Grand Challenge" on March 21, 2026: the automatic translation of informal user intent into checkable formal specifications ([arxiv 2603.17150](https://arxiv.org/abs/2603.17150)).

See [docs/RESEARCH.md](docs/RESEARCH.md) for the full analysis positioning Ada against 15 papers from January–March 2026, including Agent Behavioral Contracts, Agent Drift taxonomy, VibeContract, Loosely-Structured Software, and the Conditional Information Bottleneck.

## Status

**v0.1.0-alpha** — All packages built. Structured outputs integrated. Entropy monotonicity gates active. Self-compile test pending.

## License

MIT — [Motherlabs](https://github.com/alexrozex) © 2026
