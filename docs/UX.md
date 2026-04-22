# Ada — User Experience

Audit: 2026-04-21. Measured on Linux, Node 25.6.1, pnpm 10.32.1, ada @ `ada/bootstrap` 082c1e5.

## 1. UX Requirements

Numbered so fixes can cite them. Terse on purpose.

### Startup
1. **R1** — Any `ada <cmd>` under 100 ms cold-start overhead (excluding the command's real work).
2. **R2** — `ada --help`, `ada <cmd> --help`, `ada <cmd>` (missing args) never load more than the help path needs.

### Feedback cadence
3. **R3** — No silence > 1 s unless the user initiated a known long operation (compile, verify). During long ops, progress must visibly tick at ≥ 2 Hz.
4. **R4** — Every LLM-backed stage emits token-level or line-level progress; no stage sits silent for > 500 ms.

### Non-work delays
5. **R5** — No `sleep` on the happy path unless it covers genuine work (animation frame, debounce). Total decorative pauses ≤ 500 ms per invocation.

### Failure
6. **R6** — Every non-zero exit prints a one-line reason and the next action. No silent failures. No silent no-ops.
7. **R7** — External calls (subprocess, network) that fail must say what was attempted, not just "failed".

### Platform
8. **R8** — Commands that work on macOS work on Linux. Platform-specific paths (`osascript`, `open`) must have a Linux branch or a graceful "do it yourself" fallback.

### Reentry & idempotency
9. **R9** — Re-running any command on the same state either produces identical output (compile, verify) or a clear "already done" message. No half-applied state.
10. **R10** — Ctrl-C on any interactive prompt exits cleanly, leaves no lock/tempfile, preserves `.ada/state.json`.

### Surface discoverability
11. **R11** — `ada --help` lists every command. Every command accepts `--help` and prints its own flags with one-line descriptions.

---

## 2. User Paths

Every reachable invocation. → marks user-felt waits. `*` marks latency gaps addressed in §4.

### `ada --help` / `ada`
```
user types                         → 150 ms cold-start (eager imports) *
print help                         → instant
exit 0
```

### `ada config set-key --provider anthropic --env KEY`
```
user types                         → 150 ms cold-start *
parse flags                        → instant
read env var                       → instant
format-check                       → instant
write ~/.ada/config.json           → ~5 ms
liveness check (default on)        → ~300-1500 ms (network round-trip to Anthropic)
print saved
exit 0
```

### `ada compile "<intent>"`
```
user types                         → 150 ms cold-start *
new MotherCompiler()               → instant
compiler.compile():
  Stage CTX (codebase scan)        → ~100-500 ms, LOCAL
  Stage INT (LLM parse)            → 3-8 s, NETWORK
  Stage PER (LLM domain)           → 3-8 s, NETWORK
  Stage ENT (LLM entities)         → 3-10 s, NETWORK
  Stage PRO (LLM process)          → 3-10 s, NETWORK
  Stage SYN (LLM blueprint)        → 4-15 s, NETWORK
  Stage AUD (LLM audit)            → 3-8 s, NETWORK
  Stage GOV (LLM govern)           → 2-6 s, NETWORK
  [each stage emits onStageComplete — no token stream wired] *
serialize JSON                     → ~20 ms
write file or stdout               → ~5 ms
exit 0 (or exit 3 on --strict reject)
```
**Total: ~25-65 s.** All sequential, gated-sequential pipeline per README.

### `ada init "<intent>"` (happy path)
```
user types                         → 150 ms cold-start *
elicitation pre-phase:
  startSession (gap scan)          → instant (local)
  [per question]
    read user input                → blocks on user
    submitAnswer                   → gap re-scan + optional LLM proposal (~1-3 s)
compiler.compile() (see above)     → 25-65 s
post-compile animation:
  8 × (sleep 350 + sleep 80)       → 3.44 s * [intentional pacing]
writeConfigGraph                   → ~50-200 ms
writeWorldModel                    → git blob writes, ~50-200 ms
writeGitHook                       → ~5 ms
AdaStorage recordRun               → SQLite insert, ~5 ms
write .ada/state.json              → ~5 ms
await sleep(2000)                  → 2 s * [DEAD WAIT]
runQASession (optional)            → blocks until user presses enter
auto-spawn Claude Code             → macOS: works. Linux: silent fail * [~instant but 0 feedback]
exit 0
```
**User-felt latency over and above LLM time: ~5.6 s.**

### `ada init ...` (fallback path, max iterations exceeded)
```
same through compiler.compile
pick best iteration by composite score
writeConfigGraph(partial=true, warnings=[…])
write .ada/state.json
await sleep(2000)                  → 2 s * [DEAD WAIT]
print partial-blueprint notice
exit 0
```

### `ada run`
```
user types                         → 150 ms cold-start *
spawn claude-code via orchestrator → stream begins
stream events.content_block_start  → print "." per block
done                               → exit 0
```

### `ada resume <session_id>`
```
same as ada run, with session restore.
```

### `ada verify` (after init ran)
```
user types                         → 150 ms cold-start *
read .ada/state.json               → ~5 ms
verify(): AST walk of project      → ~50-500 ms depending on repo size
[if --comment]
  execSync("git remote get-url")   → ~15 ms blocking
  execSync("git rev-parse HEAD")   → ~15 ms blocking
format terminal / markdown / json  → instant
print
exit 0 (passed) / 2 (failed)
```

### `ada mcp`
```
user types                         → 150 ms cold-start *
startServer() — long-running stdio
```

---

## 3. Latency Gaps (Audit)

Ranked by user-felt impact per invocation × invocation frequency.

| # | Gap | Size | Frequency | Fix cost | Addressed |
|---|---|---|---|---|---|
| G1 | Eager command-module imports | 130 ms | every invocation | trivial (mechanical dynamic `import()`) | §4 |
| G2 | `sleep(2000)` before Q&A in init happy path | 2000 ms | every successful init | trivial (delete) | §4 |
| G3 | `sleep(2000)` before partial-blueprint notice in init fallback | 2000 ms | every fallback init | trivial (delete) | §4 |
| G4 | macOS-only `osascript` spawn on Linux | 0 ms but ~∞ perceived (invisible failure) | every init happy path on Linux | medium (add Linux terminal branch) | §4 |
| G5 | 8 × 430 ms animation loop post-compile | 3440 ms | every init success | medium (gate behind `ADA_ANIMATE=0`, keep default) | deferred — intentional pacing |
| G6 | `ada compile` has no token-level feedback between `onStageComplete` events | up to 8 s silence per stage | every compile | medium (wire `onStageToken` in compile.ts) | deferred |
| G7 | `execSync` in verify --comment blocks event loop | ~30 ms | every verify --comment | trivial (async `spawn`) | deferred — negligible |
| G8 | Default-on liveness check in `ada config set-key` | 300-1500 ms | every set-key | minor (leave on, document clearly) | deferred — worth the safety |

---

## 4. Gaps Closed This Pass

See next two files for diffs. Summary:

- **G1 → lazy-load**: `cli/src/index.ts` now `await import()`s each command module inside its case branch.
- **G2 & G3 → remove dead sleeps**: both `await sleep(2000)` holds in `cli/src/commands/init.ts` removed.
- **G4 → Linux spawn branch**: `cli/src/commands/init.ts` auto-spawn now detects platform and uses `x-terminal-emulator` / `$TERMINAL` on Linux, with a graceful "paste this to continue" fallback if no terminal emulator is found.

Remeasured cold-start after fixes: see git log commit for the closing commit of this pass (if committed) or the console output at the bottom of the work log.
