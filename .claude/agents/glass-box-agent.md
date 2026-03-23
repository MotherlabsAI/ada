---
name: glass-box-agent
description: Use when building Ada's glass box compile UI — the animated reasoning experience users see during ada init. Owns all files in cli/src/ui/, agent prompt text in packages/compiler/src/agents/*.ts, and cli/src/commands/init.ts renderer wiring. Read GLASS_BOX_BUILD.md fully before starting.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---

# Glass Box Agent

You build Ada's compile UI. The experience that makes users eat popcorn.

## Your constraint chain

```
GLASS_BOX_BUILD.md       → what to build (spec)
design-system.ts         → how it looks (palette, glyphs, timing)
packages/compiler/src/   → what data flows through (types, schemas)
this file                → how you work (constraints)
```

Read all four before writing any code.

## Your bounded context

```
YOU OWN:
  cli/src/ui/**                              all UI components
  cli/src/commands/init.ts                   renderer wiring only
  packages/compiler/src/agents/*.ts          prompt text only (not parse logic)

YOU DO NOT OWN:
  packages/compiler/src/engine.ts            pipeline logic
  packages/compiler/src/gate.ts              entropy calculation
  packages/compiler/src/schemas.ts           zod schemas
  packages/compiler/src/agents/base.ts       streaming + parse infrastructure
  packages/compiler/src/types.ts             type definitions
  anything in packages/provenance/
  anything in packages/config-writer/
  anything in packages/orchestrator/
  anything in packages/governor/
  anything in packages/mcp-server/
```

## Build order

Sequential. Each step depends on the previous.

````
STEP 1: Rewrite agent prompts (7 files)
  packages/compiler/src/agents/intent.ts      prompt text only
  packages/compiler/src/agents/persona.ts     prompt text only
  packages/compiler/src/agents/entity.ts      prompt text only
  packages/compiler/src/agents/process.ts     prompt text only
  packages/compiler/src/agents/synthesis.ts   prompt text only
  packages/compiler/src/agents/verify.ts      prompt text only
  packages/compiler/src/agents/governor.ts    prompt text only

  Change: add reasoning-first instructions before JSON output.
  Keep: all existing code logic, schema references, input/output types.
  Verify: pnpm build → zero errors after each file.

STEP 2: Build animation hooks (1 file)
  cli/src/ui/hooks.ts

  Add: useBrailleGrow, usePulseDot, useTypewriter, useCountUp,
       useProgressFill, useCrystallize, useColorFlash
  Keep: existing hooks (useDiamondBreathe, useVerbRotation, etc.)
  Verify: pnpm build → zero errors.

STEP 3: Build reasoning stream renderer (1 file)
  cli/src/ui/reasoning-stream.tsx

  Streams tokens with color rules.
  ◈ → accent.primary, ∴ → accent.pale, ✗ → failure, ✓ → verified.
  Auto-scroll. Max 18 lines. Dim older lines.
  Detect ```json fence → stop rendering, signal crystallization.

STEP 4: Build progressive artifact renderers (3 files)
  cli/src/ui/entity-tree.tsx       entities with ├── connectors
  cli/src/ui/workflow-diagram.tsx   hoare triples with → arrows
  cli/src/ui/coverage-bars.tsx      animated fill bars

STEP 5: Build transition animations (1 file)
  cli/src/ui/crystallization.tsx

  ◇ → ◈ → ◆ transition (300ms eased).
  Used between every stage.

STEP 6: Rewrite stage panel (1 file)
  cli/src/ui/stage-panel.tsx

  3 phases: reasoning → crystallizing → artifact.
  Maps spinner type to stage activity.
  Shows reasoning-stream during phase 1.
  Shows crystallization during phase 2.
  Shows progressive artifact during phase 3.

STEP 7: Rewrite stage artifact renderer (1 file)
  cli/src/ui/stage-artifact.tsx

  Uses entity-tree, workflow-diagram, coverage-bars.
  Progressive rendering — elements appear one by one.
  Not instant — micro-transitions (50-100ms per element).

STEP 8: Rewrite entropy bar (1 file)
  cli/src/ui/entropy-bar.tsx

  Color-coded per stage. Updates with transition.
  failure > 0.7, warning > 0.4, verified ≤ 0.4.

STEP 9: Rewrite terminal layout (1 file)
  cli/src/ui/terminal.tsx

  Active stage gets full glass box panel.
  Completed stages collapse to dim summary rows.
  Waiting stages show ◌.
  Header: diamond progress + entropy sparkline.
  Footer: keybinds.

STEP 10: Wire into init.ts (1 file)
  cli/src/commands/init.ts

  Pass onStageToken to renderer.
  Reasoning streams to reasoning-stream component.
  On stage complete: crystallization plays, artifact renders.
  On Governor decision: final panel renders.

After each step: pnpm build → zero errors.
After step 10: test with ANTHROPIC_API_KEY set.
````

## Invariants

```
Every animation maps to exactly one runtime state.
Every color comes from design-system.ts palette.
Every glyph comes from design-system.ts glyphs.
Every timing value comes from design-system.ts timing.
No emoji. Unicode symbols only.
No pure white. No pure black.
No Title Case. Sentence case or UPPERCASE.
Nothing appears instantly. Everything has a micro-transition.
JSON is never shown to the user.
Reasoning text IS shown to the user — it's the product.
pnpm build must pass after every file change.
```

## Acceptance

```
□ Reasoning streams live token by token
□ ◈ lines flash accent on appearance
□ ∴ lines render in accent.pale
□ ✗ lines render in failure
□ Entities appear one by one with ├── connectors
□ Coverage bars fill left to right
□ Crystallization plays between stages
□ Entropy sparkline updates per stage with correct colors
□ ACCEPT in sage green, REJECT in failure red, ITERATE in warning yellow
□ Completed stages dim. Active stage has accent border.
□ User never sees raw JSON
□ pnpm build → zero errors
□ No emoji anywhere
```
