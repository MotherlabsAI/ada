# Ada — a Context Compiler

**Context Compiler** is a category: a compiler whose source is natural-language intent, whose
IR is a typed knowledge graph, and whose output is the governed context a coding agent needs to
build reliably. Ada is the reference implementation.

You say what you want, in English. Ada does not generate code from it — it **excavates** a
structure out of it. Every node traces back to a sentence you said; nothing is invented. The
structure is a typed graph — Invariant, Mechanism, Decision, Unknown, Action — and the graph is
the verification surface: what the operator reads is the contract.

The output is what a coding agent runs inside: a `CLAUDE.md`, agent definitions, pre-tool hooks,
a world model, deterministic checks, a Problem Operating Model. Ada sits **before** execution. It
feeds the agentic loop; it does not replace it.

**Why a category, not a feature.** Spec-driven tools start from a spec document a human writes.
Ada starts from raw intent and excavates the graph. Prompt compilers tune one model call.
Intent-to-code stops at code. Agent frameworks are the plumbing the agent runs on. Each holds one
axis; none holds all three — intent as the source, a typed graph with provenance as the IR,
governed agent-context with a checkable surface as the output. That intersection is the category.

> Frozen laws: [`AXIOMS.md`](AXIOMS.md). Thesis and north-star gate: [`docs/NORTH-STAR.md`](docs/NORTH-STAR.md).
> This file is the operational door: how to install it and run it.

## Requirements

- **Node ≥ 22** (ESM, no transpile at runtime)
- **pnpm**

## Quickstart (zero key)

The deterministic surface needs no API key — clone, build, and open a real compiled pack:

```sh
pnpm install
pnpm build                 # tsc → dist/cli.js (+ copies prompts, projects tokens)
pnpm ada open showcase     # navigate a compiled pack's tree in the terminal
pnpm ada tui               # the Ink workbench (TTY) — defaults to the showcase slug
pnpm ada pom showcase      # print the Problem Operating Model for that pack
```

`pnpm ada <args>` is just `node dist/cli.js <args>`. To get a global `ada`, link the bin
(declared in `package.json` as `"ada": "./dist/cli.js"`) with `npm link`, then run `ada …`.

A plain compile is also deterministic (template path, no model call):

```sh
pnpm ada compile "a tool that turns meeting notes into tracked action items" --slug=notes
pnpm ada open notes
```

## The real compile (one model call — needs a key)

The U2F engine excavates the graph with a single compile-time model call (AXIOM A9: one
outbound call, key local, never committed). Set the key once, then compile with `--engine`:

```sh
mkdir -p ~/.ada && printf 'ANTHROPIC_API_KEY=sk-ant-...\n' >> ~/.ada/.env
pnpm ada key                                   # confirms the key is visible
pnpm ada compile --engine "<your intent>" --slug=myproject --depth=4
pnpm ada open myproject
```

The key is read at startup from (first wins): your shell env · `./.env` · `~/.ada/.env`.
All three `.env` locations are gitignored — the key is never written into a pack or logged.

Useful engine flags: `--depth=N` caps nodes per cluster (cost), `--model=<id>` picks the
model, `--clusters=A,B,C` overrides the auto-derived areas, `--repo[=path]` compiles an
existing repo as `∵ source` context so Ada augments real code instead of inventing holes.

## Commands

| Command                                                                                   | What it does                                                                             |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ada`                                                                                     | open the workbench (TTY) — the default slug's tree                                       |
| `ada init`                                                                                | scaffold `.ada/` in the current directory                                                |
| `ada compile "<intent>" [--slug=x]`                                                       | compile intent into a pack (deterministic)                                               |
| `ada compile --engine "<intent>" [--depth=N] [--model=id] [--clusters=…] [--repo[=path]]` | compile via the U2F engine (one model call)                                              |
| `ada ctx init [intent] [--slug=x] [--compile]`                                            | chat-style interview that captures expectations into the Seed before compiling           |
| `ada open [slug] [nodeId]`                                                                | navigate the pack (a node, or the whole tree)                                            |
| `ada tui [slug]`                                                                          | launch the Ink workbench (TTY)                                                           |
| `ada deeper <slug> <nodeId>`                                                              | full wiki article for one node                                                           |
| `ada flag <slug> <nodeId>`                                                                | flag a node for inclusion                                                                |
| `ada resume [slug]`                                                                       | show flagged nodes / last state                                                          |
| `ada c run [slug] [--defect]`                                                             | run the pack's deterministic C checks                                                    |
| `ada pom [slug]`                                                                          | print the Problem Operating Model (intent · constraints · unknowns · verifier · residue) |
| `ada export [slug]`                                                                       | list the exported files (`CLAUDE.md`, blueprint, `POM.md`, …)                            |
| `ada key`                                                                                 | is `ANTHROPIC_API_KEY` set, and from where?                                              |

Run `pnpm ada --help` for the authoritative list. Default slug: `showcase`.

## Develop

```sh
pnpm test       # node:test suite — deterministic, model-free
pnpm build      # type-check + emit dist/ + copy prompts + project tokens
```

The suite is the contract: the engine pipeline is byte-deterministic after the single model
call, the ship-gates are pinned (`src/prodContract.test.ts`), and this README's commands are
checked against the real CLI dispatch (`src/readme.test.ts`) so the door can't drift from the
building.

## License

See [`LICENSE`](LICENSE) if present; otherwise all rights reserved, Motherlabs.
