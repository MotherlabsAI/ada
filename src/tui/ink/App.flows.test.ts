/**
 * The OPERATIONAL home flows: Compile (intent → working state → graph), Open-with-multiple-packs
 * (picker), and Settings. Everything that could touch a network or disk is INJECTED — `compile`
 * is stubbed (A1/A9: NO live call), `loadPack` is stubbed (no fs), `settingsStatus` is passed
 * value-free — so the suite stays deterministic and the process exits (no hang).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { App, type CompileFn, type ActivePack } from "./App.js";
import { fixtureGraph } from "./fixtures.js";
import type { PackSummary } from "./usePack.js";

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const ESC = String.fromCharCode(27);
const DOWN = ESC + "[B";

const PACKS: PackSummary[] = [
  { slug: "alpha-pack", nodes: 12, checks: 2, residue: 3, clusters: 4 },
  { slug: "beta-pack", nodes: 9, checks: 1, residue: 2, clusters: 3 },
];

function mount(extra: Partial<Parameters<typeof App>[0]> = {}) {
  return render(
    h(App, {
      slug: "alpha-pack",
      graph: fixtureGraph(),
      initialState: { flagged: [], rejected: [] },
      onPersist: () => {},
      cwd: "/tmp/does-not-matter",
      ...extra,
    }),
  );
}

/** A stub compile that returns the fixture graph as a freshly compiled pack — NO network. */
const stubCompile: CompileFn = async ({ slug }) => ({
  pack: { slug, graph: fixtureGraph() } as ActivePack,
  firstNodeId: "ATT.004",
});

// ── Compile from the home ──────────────────────────────────────────────────────

test("Compile: ⏎ opens the intent input view", async () => {
  const { stdin, lastFrame } = mount({ compile: stubCompile });
  await tick();
  stdin.write("\r"); // first menu item is "Compile an idea"
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /COMPILE AN IDEA/, "the intent input view is shown");
  assert.match(f, /⏎ compile · esc back/, "the intent field key hints");
});

test("Compile: typing an intent + ⏎ drives the (stubbed) compile and lands in the graph", async () => {
  const calls: string[] = [];
  const compile: CompileFn = async (args) => {
    calls.push(args.intent);
    return {
      pack: { slug: args.slug, graph: fixtureGraph() },
      firstNodeId: "ATT.004",
    };
  };
  const { stdin, lastFrame } = mount({ compile });
  await tick();
  stdin.write("\r"); // → intent input
  await tick();
  for (const ch of "a citable notes tool") stdin.write(ch);
  await tick();
  stdin.write("\r"); // submit → compiling → graph
  await tick(120);
  assert.deepEqual(
    calls,
    ["a citable notes tool"],
    "compile got the typed intent",
  );
  const f = lastFrame() ?? "";
  // We landed in the graph on the first node (its area auto-opened), not on the welcome.
  assert.match(
    f,
    /ATT\.004/,
    "the freshly compiled first node is visible in the graph",
  );
  assert.doesNotMatch(f, /Welcome back, Alex/, "we left the welcome screen");
});

test("Compile: the working state renders the rotating star + a live phase line", async () => {
  // A compile that never resolves, so we can observe the compiling view.
  const compile: CompileFn = () => new Promise(() => {});
  const { stdin, lastFrame } = mount({ compile });
  await tick();
  stdin.write("\r"); // → intent input
  await tick();
  for (const ch of "something") stdin.write(ch);
  await tick();
  stdin.write("\r"); // submit → compiling (hangs here)
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /compiling…/, "the working-state label");
  assert.match(f, /[✶✷✸✹✺]/, "the rotating star glyph (the approved motion)");
  assert.match(
    f,
    /proposing areas|excavating|writing the pack/,
    "a live phase line",
  );
});

test("Compile: an injected error surfaces cleanly back on the intent view", async () => {
  const compile: CompileFn = async () => {
    throw new Error("the gate rejected every candidate");
  };
  const { stdin, lastFrame } = mount({ compile });
  await tick();
  stdin.write("\r");
  await tick();
  for (const ch of "x") stdin.write(ch);
  await tick();
  stdin.write("\r"); // submit → error
  await tick(80);
  const f = lastFrame() ?? "";
  assert.match(f, /✗ the gate rejected every candidate/, "error shown inline");
  assert.match(f, /COMPILE AN IDEA/, "back on the intent view to retry");
});

test("Compile: a missing-key error shows the `ada key` guidance (and never crashes)", async () => {
  const compile: CompileFn = async () => {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. The compile-time model call reads it from the environment only.",
    );
  };
  const { stdin, lastFrame } = mount({ compile });
  await tick();
  stdin.write("\r");
  await tick();
  for (const ch of "y") stdin.write(ch);
  await tick();
  stdin.write("\r");
  await tick(80);
  const f = lastFrame() ?? "";
  assert.match(f, /ANTHROPIC_API_KEY/, "names the missing key");
  assert.match(f, /~\/\.ada\/\.env/, "points at where the key lives");
});

// ── Open / Browse ───────────────────────────────────────────────────────────────

test("Open with multiple packs shows the pack picker", async () => {
  const { stdin, lastFrame } = mount({ packs: PACKS, compile: stubCompile });
  await tick();
  stdin.write(DOWN); // Compile → Open a pack
  await tick();
  stdin.write("\r"); // Open → picker (2 packs)
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /OPEN A PACK/, "the picker header");
  assert.match(f, /alpha-pack/, "lists the first pack");
  assert.match(f, /beta-pack/, "lists the second pack");
});

test("Open with multiple packs: picking a pack loads it (injected loadPack) → graph", async () => {
  const loaded: string[] = [];
  const loadPack = (_cwd: string, slug: string): ActivePack => {
    loaded.push(slug);
    return { slug, graph: fixtureGraph() };
  };
  const { stdin, lastFrame } = mount({ packs: PACKS, loadPack });
  await tick();
  stdin.write(DOWN); // → Open a pack
  await tick();
  stdin.write("\r"); // → picker
  await tick();
  stdin.write(DOWN); // → beta-pack
  await tick();
  stdin.write("\r"); // pick it
  await tick();
  assert.deepEqual(
    loaded,
    ["beta-pack"],
    "the chosen pack was loaded from disk",
  );
  const picked = lastFrame() ?? "";
  assert.match(
    picked,
    /beta-pack/,
    "the picked pack's slug is in the status bar",
  );
  assert.match(
    picked,
    /▸ ●/,
    "the picked pack's graph (areas closed) is shown",
  );
  assert.doesNotMatch(picked, /OPEN A PACK/, "the picker is gone");
});

test("Open with a single pack opens it directly (no picker)", async () => {
  const single: PackSummary[] = [PACKS[0]!];
  const { stdin, lastFrame } = mount({ packs: single });
  await tick();
  stdin.write(DOWN); // → Open a pack
  await tick();
  stdin.write("\r"); // single pack → graph directly (uses the in-memory prop pack)
  await tick();
  const f = lastFrame() ?? "";
  assert.doesNotMatch(f, /OPEN A PACK/, "no picker for a single pack");
  assert.match(f, /ATT\.004|▸ ●/, "dropped straight into the graph");
});

// ── Settings ─────────────────────────────────────────────────────────────────────

test("Settings renders the value-free key + model status", async () => {
  const { stdin, lastFrame } = mount({
    packs: PACKS,
    settingsStatus: {
      keyAvailable: true,
      model: "claude-sonnet-4-6",
      modelFromEnv: true,
    },
  });
  await tick();
  // Settings is the 5th menu item: Compile, Open, Interview, Browse, Settings → 4 downs.
  for (let i = 0; i < 4; i++) {
    stdin.write(DOWN);
    await tick(20);
  }
  stdin.write("\r"); // open Settings
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /SETTINGS/);
  assert.match(f, /✓ available/, "key availability (value-free)");
  assert.match(f, /claude-sonnet-4-6/, "the active model");
  assert.match(f, /ADA_MODEL/, "annotates the model source");
  assert.match(f, /first wins/, "where the key is read from");
});

test("Settings with no key shows the ✗ status + the set-once guidance", async () => {
  const { stdin, lastFrame } = mount({
    packs: PACKS,
    settingsStatus: {
      keyAvailable: false,
      model: "claude-opus-4-8",
      modelFromEnv: false,
    },
  });
  await tick();
  for (let i = 0; i < 4; i++) {
    stdin.write(DOWN);
    await tick(20);
  }
  stdin.write("\r");
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /✗ not set/, "key not set");
  assert.match(f, /~\/\.ada\/\.env/, "the set-once guidance");
  assert.match(f, /\(default\)/, "model came from the default, not env");
});

test("Settings: esc returns to the welcome menu", async () => {
  const { stdin, lastFrame } = mount({
    packs: PACKS,
    settingsStatus: { keyAvailable: true, model: "m", modelFromEnv: false },
  });
  await tick();
  for (let i = 0; i < 4; i++) {
    stdin.write(DOWN);
    await tick(20);
  }
  stdin.write("\r"); // Settings
  await tick();
  assert.match(lastFrame() ?? "", /SETTINGS/);
  stdin.write(ESC); // back
  await tick();
  assert.match(
    lastFrame() ?? "",
    /Welcome back, Alex/,
    "back at the home menu",
  );
});

// ── Interview (out of scope here — a clean inline note) ───────────────────────────

test("Interview shows a clean note pointing at `ada ctx init` (not half-built)", async () => {
  const { stdin, lastFrame } = mount({ packs: PACKS });
  await tick();
  stdin.write(DOWN); // Compile → Open
  await tick();
  stdin.write(DOWN); // Open → Interview
  await tick();
  stdin.write("\r"); // select Interview
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /ada ctx init/, "points at the CLI interview");
  assert.match(
    f,
    /Welcome back, Alex/,
    "stays on the home — nothing half-built",
  );
});
