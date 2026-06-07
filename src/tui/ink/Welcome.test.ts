import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { Welcome, MENU_ITEMS } from "./Welcome.js";
import type { PackSummary } from "./usePack.js";

const tick = () => new Promise((r) => setTimeout(r, 50));
const ESC = String.fromCharCode(27);
const DOWN = ESC + "[B";
const UP = ESC + "[A";

const PACKS: PackSummary[] = [
  { slug: "service-business", nodes: 24, checks: 3, residue: 8, clusters: 5 },
  { slug: "ada-website", nodes: 21, checks: 3, residue: 8, clusters: 4 },
];

function mount(extra: Partial<Parameters<typeof Welcome>[0]> = {}) {
  return render(
    h(Welcome, {
      slug: "service-business",
      nodes: 24,
      checks: 3,
      residue: 8,
      clusters: 5,
      cols: 100,
      rows: 40,
      packs: PACKS,
      ...extra,
    }),
  );
}

test("welcome renders the banner wordmark + slogan + greeting", async () => {
  const { lastFrame } = mount();
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /█/, "the block ADA wordmark");
  assert.match(f, /C L A R I T Y   Y O U   C A N   S H I P/, "the wordmark slogan");
  assert.match(f, /Welcome back, Alex/);
});

test("welcome renders all menu items", async () => {
  const { lastFrame } = mount();
  await tick();
  const f = lastFrame() ?? "";
  for (const item of MENU_ITEMS) {
    assert.match(f, new RegExp(item.label.replace(/[()/]/g, ".")), item.label);
  }
});

test("welcome narrates the highlighted (first) item in one line", async () => {
  const { lastFrame } = mount();
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /governed context pack/, "Compile's describe line");
});

test("welcome lists your projects with legible, plain-word counts", async () => {
  const { lastFrame } = mount();
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /YOUR PROJECTS/);
  assert.match(f, /service-business/);
  assert.match(f, /24 nodes/);
  assert.match(f, /5 clusters/);
  // open gaps read as a WORD, not a glyph; κ (constant) is gone entirely
  assert.match(f, /8 open/);
  assert.doesNotMatch(f, /κ/, "the cryptic constant check glyph is dropped");
});

test("a pack with no open gaps reads 'clear'", async () => {
  const { lastFrame } = mount({
    packs: [{ slug: "settled", nodes: 9, checks: 3, residue: 0, clusters: 3 }],
    slug: "settled",
  });
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /settled/);
  assert.match(f, /clear/, "residue 0 → 'clear', not '0 open'");
});

test("arrowing the menu moves the selection and updates the narration", async () => {
  const { stdin, lastFrame } = mount();
  await tick();
  // First item (Compile) is focused → its describe shows.
  assert.match(lastFrame() ?? "", /governed context pack/);

  stdin.write(DOWN); // → Open a pack
  await tick();
  const open = lastFrame() ?? "";
  assert.match(
    open,
    /Open the graph for a pack/,
    "narration now describes Open",
  );

  stdin.write(UP); // back to Compile
  await tick();
  assert.match(lastFrame() ?? "", /governed context pack/);
});

test("'Open a pack' focuses the projects column, then ↑/↓ + ⏎ opens the chosen pack", async () => {
  const opened: string[] = [];
  const { stdin } = mount({ onOpenPack: (s) => opened.push(s) });
  await tick();
  stdin.write(DOWN); // → Open a pack
  await tick();
  stdin.write("\r"); // focuses the projects column (does NOT open yet)
  await tick();
  assert.deepEqual(opened, [], "first ⏎ moves focus, it does not open");
  stdin.write(DOWN); // → second project (ada-website)
  await tick();
  stdin.write("\r"); // opens the cursored pack
  await tick();
  assert.deepEqual(
    opened,
    ["ada-website"],
    "opens the pack you cursored, not packs[0]",
  );
});

test("⇥ crosses into the projects column and ⏎ opens the cursored pack", async () => {
  const opened: string[] = [];
  const { stdin } = mount({ onOpenPack: (s) => opened.push(s) });
  await tick();
  stdin.write("\t"); // ⇥ → projects pane, cursor at 0
  await tick();
  stdin.write("\r");
  await tick();
  assert.deepEqual(opened, ["service-business"]);
});

test("a no-pack state renders cleanly", async () => {
  const { lastFrame } = mount({ packs: [] });
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /no packs yet — Compile an idea/);
  assert.match(f, /Welcome back, Alex/, "banner still renders");
});

test("the bottom shows live key hints (not a memorized command list)", async () => {
  const { lastFrame } = mount();
  await tick();
  assert.match(lastFrame() ?? "", /↑\/↓ move/);
  assert.match(lastFrame() ?? "", /q quit/);
});

test("degrades at 80×24 without throwing", async () => {
  const { lastFrame } = mount({ cols: 80, rows: 24 });
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /Welcome back, Alex/);
  assert.match(f, /◆ Compile an idea/);
});

test("the welcome runs ZERO idle timers — motion only on interaction (Motion Contract)", async () => {
  // The rule: no ornamental pulsing, no motion without a state change. So the
  // welcome must not arm any repeating timer at rest — structurally, not by
  // hoping it's unref'd. Spy on setInterval: the count must be 0.
  const realInterval = global.setInterval;
  let created = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).setInterval = (...a: unknown[]) => {
    created += 1;
    // @ts-expect-error spread to the real impl
    return realInterval(...a);
  };
  try {
    const { unmount } = mount();
    await tick();
    unmount();
  } finally {
    global.setInterval = realInterval;
  }
  assert.equal(created, 0, "no idle animation — nothing moves until you do");
});
