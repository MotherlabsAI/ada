# ada — Claude Code Orientation

ada is a CLI semantic compiler. Raw natural-language intent → 7-stage gated pipeline (INT→PER→ENT→PRO→SYN→AUD→GOV) → Governor ACCEPT → Blueprint + CLAUDE.md + agents + hooks. Claude Code then builds against those governed artifacts. ada is not a code generator.

## 1. Working Directory

- Root: `/home/motherlabs/mlabs-cog-infra/ada`
- Expected branch while this doc is current: `local/linux-setup-and-ux-2026-04-21`
- pnpm monorepo. Workspaces: `packages/*` (9 libraries) and `cli/` (bin entry).
- `pnpm-workspace.yaml` + `tsconfig.base.json` at root. Each package compiles to `dist/`, emits `.d.ts`, consumed via `@ada/<name>` workspace protocol.
- Repo lives under `MotherlabsAI/ada`. No local artifacts in Desktop or `/tmp`.

## 2. Build Protocol

```
pnpm install              # pnpm 10; needs onlyBuiltDependencies allowlist (already set)
pnpm -r build             # compile every workspace package → dist/
pnpm -r typecheck         # tsc --noEmit across the tree
pnpm test                 # root-level vitest run (vitest.config.ts at repo root)
pnpm -F @ada/cli build    # build just the CLI
```

- Root `package.json` declares `onlyBuiltDependencies: [better-sqlite3, esbuild, sharp]`. Without that, native builds are skipped silently on pnpm 10.
- ESM across the tree. Imports resolve with `.js` extension even from `.ts` sources.
- `pnpm test` now runs via the root `vitest.config.ts` (previously per-package only).

## 3. CLI Command Surface

Source of truth: `cli/src/index.ts`. 15 commands (plus `--version`/`--help`).

| Command | Purpose | Key flags |
|---|---|---|
| `ada compile "<intent>"` | Compile intent → blueprint JSON | `--output <file>`, `--strict` (exit 3 on governance violation) |
| `ada init "<intent>"` | Compile → config graph → spawn Claude Code | `--no-execute` |
| `ada config set-key` | Persist provider API key | `--provider`, `--key`, `--env <VAR>`, `--no-verify` |
| `ada run` | Spawn Claude Code with governor watching | — |
| `ada resume <id>` | Resume from checkpoint | — |
| `ada verify` | Verify codebase against compiled blueprint | `--comment` (GitHub PR markdown), `--json` |
| `ada mcp` | Start MCP spec authority server over stdio | — |
| `ada status` | Current project's compile status | — |
| `ada history` | List past compilation runs across all projects | — |
| `ada list` | List every project compiled on this machine | — |
| `ada explain [stage]` | Explain what each pipeline stage produced | — |
| `ada export` | Export current blueprint | `--output <file>`, `--format markdown\|json` |
| `ada doctor` | Diagnose environment (node, keys, deps) | — |
| `ada which` | Print paths ada reads/writes in this context | — |
| `ada clean` | Remove ada-generated artifacts in CWD | `--force`/`-y`, `--dry-run` |

Each branch lives in `cli/src/commands/<name>.ts` and is imported lazily (see §6).

## 4. Package Surface

9 packages under `packages/*`. Full dep graph + entry exports: `docs/PACKAGES.md`.

- `@ada/compiler` — 7-stage pipeline engine + agents + verify + Zod schemas. Depends on `@ada/provenance`.
- `@ada/elicitation` — Interactive pre-compilation dialogue (gap analysis, readiness, handoff). Depends on compiler + provenance.
- `@ada/provenance` — Postcode addressing, SQLite provenance store, entropy tracking. Leaf package.
- `@ada/config-writer` — Blueprint → CLAUDE.md + agents/skills/hooks/settings on disk. Depends on compiler + provenance.
- `@ada/mcp-server` — MCP stdio server exposing verify / workflow-spec / agent-file-spec.
- `@ada/orchestrator` — Spawns Claude Code subprocesses, stream-json parsing, checkpoint + correction loop.
- `@ada/governor` — Post-build runtime drift / invariant evaluator. **Built but not yet wired into the CLI.**
- `@ada/storage` — `~/.ada/storage.db` SQLite registry of projects + runs. Leaf package.
- `@ada/int-rerun` — Stateless INT-stage disambiguation rerun with SYN re-gate. Leaf, **no current importers**.

Leaf packages (no `@ada/*` deps): `provenance`, `storage`, `int-rerun`.

## 5. UX Requirements (R1–R11, from `docs/UX.md`)

Every change to the CLI surface must preserve these.

- **R1** — Any `ada <cmd>` under 100 ms cold-start overhead (excluding the command's real work).
- **R2** — `ada --help`, `ada <cmd> --help`, `ada <cmd>` (missing args) never load more than the help path needs.
- **R3** — No silence > 1 s unless the user initiated a known long operation. During long ops, progress ticks at ≥ 2 Hz.
- **R4** — Every LLM-backed stage emits token- or line-level progress; no stage silent > 500 ms.
- **R5** — No `sleep` on the happy path unless it covers genuine work. Total decorative pauses ≤ 500 ms per invocation.
- **R6** — Every non-zero exit prints a one-line reason and the next action. No silent failures.
- **R7** — Failed external calls (subprocess, network) say what was attempted, not just "failed".
- **R8** — Commands that work on macOS work on Linux. Platform-specific paths must branch or fall back gracefully.
- **R9** — Re-running any command on the same state is identical or prints a clear "already done". No half-applied state.
- **R10** — Ctrl-C on any interactive prompt exits cleanly; no stray locks/tempfiles; `.ada/state.json` preserved.
- **R11** — `ada --help` lists every command. Every command accepts `--help` and prints its own flags.

## 6. Hot-Path Non-Obvious Facts

- `cli/src/index.ts` uses `await import("./commands/<name>.js")` inside each `case` branch. Cold-start dropped from ~160 ms to ~10 ms on this branch. Do not revert to eager imports.
- `ada init` terminal auto-spawn walks this list on Linux (first match wins): `$TERMINAL`, `x-terminal-emulator`, `gnome-terminal`, `konsole`, `xfce4-terminal`, `xterm`. If none exist, ada prints the temp script path for manual run.
- On macOS the same spawn still goes via `osascript`. The macOS branch was never replaced — it runs alongside the Linux branch.
- pnpm 10 gates native builds behind `onlyBuiltDependencies`. The root `package.json` allowlists `better-sqlite3`, `esbuild`, `sharp`. `pnpm install --force` after any toolchain change.
- `better-sqlite3` first install compiles via node-gyp (~3 min). Needs `build-essential` + `python3` on Debian/Ubuntu.
- Two `await sleep(2000)` holds were removed from `init.ts` this pass (happy path + fallback path). Do not reintroduce.

## 7. Known Gaps

- Tests now run at root (`pnpm test`) but not all packages have meaningful coverage; some suites still fail. Roadmap target: ≥ 60% per package.
- `init` auto-spawn on macOS is `osascript`-only. No fallback if `osascript` fails.
- `ada compile` has no token-level LLM feedback between `onStageComplete` events — up to 8 s silence per stage. Planned: wire `onStageToken` in `cli/src/commands/compile.ts`.
- No live cost tracking. Multi-model routing and prompt caching are roadmap items.
- `@ada/governor` and `@ada/int-rerun` are built but not imported by the CLI yet.
- Per-subcommand `--help` coverage is partial (roadmap item).

Full roadmap: `docs/ROADMAP.md`.

## 8. Session Protocol

When Claude Code starts work in this repo, read in this order:

1. This file (`CLAUDE.md`) — orientation.
2. `README.md` — public-facing pitch and high-level architecture table.
3. `docs/UX.md` — R1–R11 and the latency audit. Any CLI change must cite these.
4. `docs/ROADMAP.md` — what's planned vs. deferred; don't duplicate.
5. `docs/PACKAGES.md` — dep graph before touching any `@ada/*` package.
6. `docs/LINUX.md` + `docs/TROUBLESHOOTING.md` — setup friction and known failure modes.
7. `cli/src/index.ts` + `cli/src/commands/<target>.ts` — exact command wiring before modifying a command.
8. Target package's `src/index.ts` — top-level exports before touching internals.

Before any action, answer: **where does this belong, what already exists, why now?** Do not rebuild what exists. Do not add scope that wasn't asked for.
