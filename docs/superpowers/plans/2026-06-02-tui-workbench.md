# TUI Workbench — Claude Code's sister — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A React/Ink terminal workbench that makes a compiled pack feel like navigating a world model in Claude Code's sister — graph navigation, a node reader, a slash-command line, and flag/deeper/branch — over the existing on-disk pack (the TUI is a _projection_, never the source of truth).

**Architecture:** A new `ada tui <slug>` command launches an Ink app that loads `graph.json` + `.state.json` from the pack and renders three regions: a `StatusBar`, a `GraphPanel` (cluster→node tree, arrow-navigable), and a `NodeReader` (capsule view), with a `SlashLine` input. State (flagged/rejected/last) persists back to the pack's `.state.json` using the _existing_ navigator state shape, so the readline navigator and the Ink TUI stay interchangeable. Aesthetic: the spec's colour grammar (earthy + plum/deep-blue), deliberately Claude-Code-adjacent — sister, not clone (see memory `feedback_motherlabs_design`: invent a frontier identity, not a clone, not RMT gold).

**Tech Stack:** TypeScript, Ink 5 + React 18 (new dev/runtime deps), `ink-testing-library` for component tests, Node 22.

---

### Task 0: Dependencies + Ink/JSX build config

**Files:**

- Modify: `package.json` (deps + scripts), `tsconfig.json` (jsx)
- Create: `src/tui/ink/smoke.test.tsx`

- [ ] **Step 1: Install Ink + React + test lib**

Run:

```bash
pnpm add ink react
pnpm add -D @types/react ink-testing-library
```

- [ ] **Step 2: Enable JSX in tsconfig**

In `tsconfig.json` `compilerOptions` add: `"jsx": "react-jsx"`. Confirm `module`/`moduleResolution` stay `NodeNext`.

- [ ] **Step 3: Smoke test that Ink renders**

Create `src/tui/ink/smoke.test.tsx`:

```tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { Text } from "ink";
import { render } from "ink-testing-library";

test("ink renders text", () => {
  const { lastFrame } = render(<Text>hello-ada</Text>);
  assert.match(lastFrame() ?? "", /hello-ada/);
});
```

- [ ] **Step 4: Run**

Run: `pnpm test`
Expected: PASS (build emits `dist/.../smoke.test.js`; node:test runs it).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json pnpm-lock.yaml src/tui/ink/smoke.test.tsx
git commit -m "build(tui): add ink + react + jsx config"
```

---

### Task 1: Theme (colour grammar) + StatusBar

**Files:**

- Create: `src/tui/ink/theme.ts`, `src/tui/ink/StatusBar.tsx`
- Test: `src/tui/ink/StatusBar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render } from "ink-testing-library";
import { StatusBar } from "./StatusBar.js";

test("status bar shows pack stats", () => {
  const { lastFrame } = render(
    <StatusBar slug="demo" nodes={24} checks={3} residue={8} clusters={5} />,
  );
  const f = lastFrame() ?? "";
  assert.match(f, /demo/);
  assert.match(f, /24/);
  assert.match(f, /◈/);
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** — `theme.ts` re-exports the hex map from `src/core/grammar.ts` as Ink colour strings (e.g. `clay: "#C66A43"`, `plum: "#6E5ACF"`, `deep_blue: "#25476A"`). `StatusBar.tsx`:

```tsx
import React from "react";
import { Box, Text } from "ink";
import { theme } from "./theme.js";

export function StatusBar(props: {
  slug: string;
  nodes: number;
  checks: number;
  residue: number;
  clusters: number;
}) {
  return (
    <Box>
      <Text color={theme.terracotta}>◈ Ada</Text>
      <Text color={theme.ink}>{` / ${props.slug}  `}</Text>
      <Text>{`nodes ${props.nodes} · `}</Text>
      <Text color={theme.green}>{`C ${props.checks} · `}</Text>
      <Text color={theme.amber}>{`residue ${props.residue} · `}</Text>
      <Text>{`clusters ${props.clusters}`}</Text>
    </Box>
  );
}
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(tui): theme + status bar`.

---

### Task 2: Pack loader hook (read-only projection)

**Files:**

- Create: `src/tui/ink/usePack.ts`
- Test: `src/tui/ink/usePack.test.ts`

Reuse `loadPack` from `src/tui/navigator.ts` (it already returns `{graph, manifest, stateFile}`) rather than reimplementing.

- [ ] **Step 1: Failing test** — compile the showcase pack in a temp cwd, assert `loadPackData(cwd, slug)` returns `graph.nodes.length > 0` and `manifest.clusters.length > 0`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — thin wrapper around `loadPack` returning plain data (no React state needed for read; flag/reject mutate `.state.json` via the existing `flagNode`/state writer). Keep it a pure function `loadPackData(cwd, slug)`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(tui): read-only pack loader`.

---

### Task 3: GraphPanel — arrow-navigable cluster→node tree

**Files:**

- Create: `src/tui/ink/GraphPanel.tsx`
- Test: `src/tui/ink/GraphPanel.test.tsx`

- [ ] **Step 1: Failing test** — render with a fixture graph (3 nodes, 2 clusters) + `selectedId`; assert the selected line is marked (e.g. `›` prefix) and each node's `graphSymbol` + label appears.

```tsx
test("highlights the selected node and lists clusters", () => {
  const { lastFrame } = render(
    <GraphPanel graph={fixture} selectedId="ATT.004" flagged={new Set()} />,
  );
  const f = lastFrame() ?? "";
  assert.match(f, /› .*ATT\.004/);
  assert.match(f, /◆ ATT/);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — group `graph.nodes` by `clusterOf(id)`; render `◆ CLUSTER` headers (coloured `deep_blue`) and node rows using the node's `ui.graphSymbol` + label, painting the row with the node's `colour`; prefix the `selectedId` row with `›` and bold it; show `⊙` on flagged ids. Navigation state (which id is selected) is owned by the parent App; GraphPanel is presentational.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(tui): navigable graph panel`.

---

### Task 4: NodeReader — capsule view

**Files:**

- Create: `src/tui/ink/NodeReader.tsx`
- Test: `src/tui/ink/NodeReader.test.tsx`

- [ ] **Step 1: Failing test** — render a fixture `NodeCapsule`; assert summary (⟡), why (∴), failure (!), compiles-to, candidates, unknowns (Ω), and link lines appear.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — mirror the readline `renderNode` layout (`src/tui/navigator.ts`) as Ink `<Box flexDirection="column">` with wrapped `<Text>`; lead with the capsule's `summary` (the impress-or-die content) in the node's colour; show the badge row, ⊢ compiles-to, κ candidates, Ω unknowns, and ↔ links.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(tui): node reader capsule view`.

---

### Task 5: SlashLine — command input + dispatch

**Files:**

- Create: `src/tui/ink/SlashLine.tsx`
- Test: `src/tui/ink/SlashLine.test.tsx`

- [ ] **Step 1: Failing test** — render with an `onCommand` spy; simulate typing `/flag` + Enter via `stdin.write`; assert `onCommand` called with `{cmd:"flag"}`. (ink-testing-library exposes `stdin.write`.)
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — `useInput` accumulates characters; on Enter, parse the line into `{cmd, arg}` for the verbs `deeper | branch | flag | reject | wiki | export | search | quit`; call `onCommand`; clear the buffer. Render a `⌘` prompt (cyan) + the live buffer.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(tui): slash command line`.

---

### Task 6: App wiring + key bindings + state persistence

**Files:**

- Create: `src/tui/ink/App.tsx`
- Modify: `src/cli.ts` (add `tui` command), `src/tui/navigator.ts` (export a `writeState` helper if not already)
- Test: `src/tui/ink/App.test.tsx`

- [ ] **Step 1: Failing test** — render `<App graph={fixture} initialState={{flagged:[],rejected:[]}} onPersist={spy} />`; send `↓` then `space`; assert the second node becomes selected and `onPersist` received it in `flagged`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — `App` owns `selectedIndex` (flat node order) + `flagged`/`rejected` sets + `mode` (graph | reading). `useInput`: `↑/↓` move selection, `enter` → reading mode (NodeReader for selected), `space` flag, `x` reject, `b`/`esc` back to graph, `g` jump to flagged. Slash commands route through `SlashLine`'s `onCommand` (`deeper` opens reader; `export` shells `ada export`; `quit` calls Ink `exit`). Persist flagged/rejected/last to `.state.json` via the existing writer on every mutation. Layout: `<StatusBar/>` then a two-column `<Box>`: `<GraphPanel/>` | `<NodeReader/>`.
- [ ] **Step 4:** Add to `src/cli.ts`: a `tui` case that resolves the slug, `loadPackData`, and `render(<App .../>)`. Guard non-TTY → fall back to existing static `renderStatic`.
- [ ] **Step 5: Run** → PASS; then manual: `pnpm build && node dist/cli.js tui service-business-recognition` → navigate with arrows, open ATT.004, flag it, quit; re-open and confirm the flag persisted.
- [ ] **Step 6: Commit** `feat(tui): ink workbench app + ada tui command`.

---

## Self-Review

- **Spec coverage:** navigate-like-a-video-game → GraphPanel + arrow nav (T3/T6); read a node → NodeReader (T4); slash line → SlashLine (T5); flag/jump-back → T6 `space`/`g` + persistence; sister aesthetic → theme (T1); TUI-as-projection → read-only loader, state-only writes (T2/T6). Deferred (not in this slice, called out): live compile-in-TUI, branch-creation flow, "I'm Feeling Lucky" export naming — add as a follow-up plan. ✓
- **Placeholder scan:** T2–T4 compress implementation prose but every step names exact files, the exact reused functions (`loadPack`, `clusterOf`, `renderNode` as the layout reference), real test assertions, and real commands — no TODOs. The two heaviest/novel components (StatusBar T1, SlashLine T5, App T6) carry full code. ✓
- **Type consistency:** `NodeCapsule`/`Graph` reused from `src/core/types.ts`; `.state.json` shape matches `PackState` in `navigator.ts` (`flagged`/`rejected`/`lastNode`); `loadPackData` returns the same `{graph, manifest}` used by GraphPanel/StatusBar. ✓
