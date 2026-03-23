---
name: cli-agent
description: Use when building cli/. Owns the ada binary, all commands (init/compile/run/resume/verify/mcp), and the terminal UI. Build last — depends on all packages being SHAPED. Use when any user-facing command, terminal rendering, or the ada entry point needs work.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---

# CLI Agent

You own `cli/`.
You build the only thing users touch.
Build last — all packages must be ◈ SHAPED before you start.

---

## Commands

```bash
ada init "human intent"    # compile → write config graph → print next step
ada compile                # re-run compiler on existing .ada/state.json intent
ada run                    # spawn Claude Code, governor watches, pipe events to UI
ada resume {session_id}    # resume from .ada/state.json checkpoint
ada verify                 # run Verify agent on current Blueprint
ada mcp                    # start MCP spec authority server (stdio)
```

---

## Terminal UI — ink

Use `ink` for all terminal rendering. Three live sections:

```
╔══════════════════════════════════════════════════════╗
║  ◈ ADA  by Motherlabs                               ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  COMPILING                                           ║
║  ❯ INT  ✓  6 goals, 2 unknowns                      ║
║  ❯ PER  ✓  software development / 4 exclusions      ║
║  ❯ ENT  ✓  7 entities, 14 invariants                ║
║  ❯ PRO  ⠹  synthesizing workflows...                ║
║  ❯ SYN  ◌  waiting                                  ║
║  ❯ VER  ◌  waiting                                  ║
║  ❯ GOV  ◌  waiting                                  ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  GOVERNOR  ◌  confidence: --                        ║
╠══════════════════════════════════════════════════════╣
║  ARTIFACTS                                           ║
║  ◌  CLAUDE.md                                       ║
║  ◌  .claude/agents/                                 ║
║  ◌  hooks/pre-tool/                                 ║
╚══════════════════════════════════════════════════════╝
```

**Symbols — exact, no substitution:**
```
◈   identity / active state
◌   ghost / waiting
◎   draft / in progress
❯   stage indicator (gold)
✓   pass / complete
✗   fail / blocked
⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏   braille spinner (cycle through during waiting)
```

**Palette — hex values, exact:**
```typescript
export const COLORS = {
  canvas: "#0d0d0c",
  cream:  "#e8e4df",
  gold:   "#c4a882",   // ❯ chevrons, active indicators
  sage:   "#788c5d",   // ✓ pass, confidence high (≥ 0.80)
  orange: "#d97757",   // warnings, confidence medium (0.60–0.79)
  clay:   "#a04040",   // ✗ fail, blocked, confidence low (< 0.60)
  ice:    "#6a9bcc",   // informational
}
```

**Confidence color threshold:**
```
≥ 0.80 → sage   (#788c5d)
0.60–0.79 → orange (#d97757)
< 0.60 → clay   (#a04040)
```

---

## ada init — Primary Command

```typescript
async function init(intent: string): Promise<void> {
  // 1. Render compile UI — stream GovernorSignals to renderer
  const result = await runCompileLoop(intent, compiler, maxIterations)

  if (result.governorDecision.decision !== "ACCEPT") {
    renderRejection(result.governorDecision)
    process.exit(1)
  }

  // 2. Write config graph to current directory
  await writeConfigGraph(result.blueprint, process.cwd())

  // 3. Render artifacts written
  renderArtifacts(result)

  // 4. Print next step
  console.log("\n  ❯ ready. run: claude --yes\n")
}
```

---

## Package Structure

```
cli/
  src/
    commands/
      init.ts
      compile.ts
      run.ts
      resume.ts
      verify.ts
      mcp.ts          ← delegates to packages/mcp-server/
    ui/
      terminal.ts     ← ink layout, three-section render
      symbols.ts      ← COLORS + SYMBOLS constants
      stages.ts       ← per-stage progress row
      governor.ts     ← confidence value + decision render
      artifacts.ts    ← artifact list with status symbols
    index.ts          ← bin entry point
  package.json        ← "bin": { "ada": "dist/index.js" }
```

---

## Acceptance Criteria

```
□ ada init "build a revenue ledger" runs end-to-end
□ All 7 compiler stages visible with symbols during compile
□ Braille spinner animates during each waiting stage
□ Governor confidence renders as a live number with correct color
□ Governor ACCEPT → lists artifacts written, prints "ready. run: claude --yes"
□ Governor REJECT → prints rejectionReasons, exits with code 1
□ Governor ITERATE → shows iteration count, rerenders all 7 stages
□ ada mcp starts stdio server without error
□ ada --help lists all 6 commands with descriptions
□ Colors match COLORS constants exactly — no approximations
□ All types exported from src/index.ts
```
