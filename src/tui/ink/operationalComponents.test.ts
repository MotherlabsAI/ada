/**
 * Focused tests for the operational-home components and the value-free settings status.
 * Each component is a thin renderer; we assert it shows the right earth-tone chrome, captures
 * the right input, and — for the two with timers (IntentInput caret, Compiling star) — that
 * every interval handle is unref'd so `node --test` cannot hang.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { render } from "ink-testing-library";
import { IntentInput } from "./IntentInput.js";
import { Compiling } from "./Compiling.js";
import { PackPicker } from "./PackPicker.js";
import { Settings } from "./Settings.js";
import {
  readSettingsStatus,
  SETTINGS_DEFAULT_MODEL,
} from "./settingsStatus.js";
import type { PackSummary } from "./usePack.js";

const tick = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const ESC = String.fromCharCode(27);
const DOWN = ESC + "[B";

// ── IntentInput ──────────────────────────────────────────────────────────────

test("IntentInput renders the labeled field + key hints; captures typed text on ⏎", async () => {
  let submitted: string | undefined;
  const { stdin, lastFrame } = render(
    h(IntentInput, {
      onSubmit: (s) => {
        submitted = s;
      },
      onCancel: () => {},
    }),
  );
  await tick();
  assert.match(lastFrame() ?? "", /COMPILE AN IDEA/);
  assert.match(lastFrame() ?? "", /⏎ compile · esc back/);
  for (const ch of "a tiny tool") stdin.write(ch);
  await tick();
  assert.match(lastFrame() ?? "", /a tiny tool/, "the typed text is shown");
  stdin.write("\r");
  await tick();
  assert.equal(submitted, "a tiny tool", "submit fired with the trimmed text");
});

test("IntentInput: ⏎ on empty does nothing; esc cancels", async () => {
  let submitted = 0;
  let cancelled = 0;
  const { stdin } = render(
    h(IntentInput, {
      onSubmit: () => {
        submitted++;
      },
      onCancel: () => {
        cancelled++;
      },
    }),
  );
  await tick();
  stdin.write("\r"); // empty → no submit
  await tick();
  assert.equal(submitted, 0, "no compile on empty intent");
  stdin.write(ESC);
  await tick();
  assert.equal(cancelled, 1, "esc cancels back to the menu");
});

test("IntentInput caret interval is unref'd (no hang)", async () => {
  const real = global.setInterval;
  let created = 0;
  let unreffed = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).setInterval = (...a: unknown[]) => {
    created++;
    // @ts-expect-error spread to real
    const handle = real(...a);
    const orig = (handle as { unref?: () => unknown }).unref?.bind(handle);
    (handle as { unref?: () => unknown }).unref = () => {
      unreffed++;
      return orig ? orig() : handle;
    };
    return handle;
  };
  try {
    const { unmount } = render(
      h(IntentInput, { onSubmit: () => {}, onCancel: () => {} }),
    );
    await tick();
    unmount();
  } finally {
    global.setInterval = real;
  }
  assert.ok(created >= 1, "the caret blink interval was created");
  assert.equal(unreffed, created, "every interval handle was unref'd");
});

// ── Compiling ────────────────────────────────────────────────────────────────

test("Compiling shows the working label, the rotating star, the phase, and the echoed intent", async () => {
  const { lastFrame } = render(
    h(Compiling, {
      intent: "a citable notes tool",
      phase: "excavating the clusters…",
    }),
  );
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /compiling…/);
  assert.match(f, /[✶✷✸✹✺]/, "the rotating star (approved motion)");
  assert.match(f, /excavating the clusters…/, "the live phase line");
  assert.match(f, /a citable notes tool/, "echoes the intent in flight");
});

test("Compiling star interval is unref'd (no hang)", async () => {
  const real = global.setInterval;
  let created = 0;
  let unreffed = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).setInterval = (...a: unknown[]) => {
    created++;
    // @ts-expect-error spread to real
    const handle = real(...a);
    const orig = (handle as { unref?: () => unknown }).unref?.bind(handle);
    (handle as { unref?: () => unknown }).unref = () => {
      unreffed++;
      return orig ? orig() : handle;
    };
    return handle;
  };
  try {
    const { unmount } = render(
      h(Compiling, { intent: "x", phase: "writing the pack…" }),
    );
    await tick();
    unmount();
  } finally {
    global.setInterval = real;
  }
  assert.ok(created >= 1, "the star interval was created");
  assert.equal(unreffed, created, "every interval handle was unref'd");
});

// ── PackPicker ───────────────────────────────────────────────────────────────

const PACKS: PackSummary[] = [
  { slug: "alpha", nodes: 12, checks: 2, residue: 3, clusters: 4 },
  { slug: "beta", nodes: 9, checks: 1, residue: 2, clusters: 3 },
];

test("PackPicker lists packs with counts and picks the highlighted one on ⏎", async () => {
  let picked: string | undefined;
  const { stdin, lastFrame } = render(
    h(PackPicker, {
      packs: PACKS,
      onPick: (s) => (picked = s),
      onCancel: () => {},
    }),
  );
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /OPEN A PACK/);
  assert.match(f, /alpha/);
  assert.match(f, /9 nodes · κ 1/, "shows counts for a pack");
  stdin.write(DOWN); // → beta
  await tick();
  stdin.write("\r");
  await tick();
  assert.equal(picked, "beta", "picked the highlighted (second) pack");
});

test("PackPicker: esc cancels", async () => {
  let cancelled = 0;
  const { stdin } = render(
    h(PackPicker, {
      packs: PACKS,
      onPick: () => {},
      onCancel: () => cancelled++,
    }),
  );
  await tick();
  stdin.write(ESC);
  await tick();
  assert.equal(cancelled, 1);
});

// ── Settings ───────────────────────────────────────────────────────────────────

test("Settings renders the value-free key/model status and never the secret", async () => {
  const { lastFrame } = render(
    h(Settings, {
      keyAvailable: true,
      model: "claude-sonnet-4-6",
      modelFromEnv: true,
      slug: "alpha",
      onBack: () => {},
    }),
  );
  await tick();
  const f = lastFrame() ?? "";
  assert.match(f, /SETTINGS/);
  assert.match(f, /✓ available/);
  assert.match(f, /claude-sonnet-4-6/);
  assert.match(f, /ADA_MODEL/);
  assert.match(f, /alpha/, "active pack");
  assert.doesNotMatch(f, /sk-ant/, "the secret value is never rendered (A9)");
});

test("Settings: esc/b calls back", async () => {
  let back = 0;
  const { stdin } = render(
    h(Settings, {
      keyAvailable: false,
      model: "m",
      modelFromEnv: false,
      slug: "s",
      onBack: () => back++,
    }),
  );
  await tick();
  stdin.write("b");
  await tick();
  assert.equal(back, 1);
});

// ── settingsStatus helper ─────────────────────────────────────────────────────

test("readSettingsStatus is value-free: only the key boolean + model id", () => {
  const present = readSettingsStatus({
    ANTHROPIC_API_KEY: "sk-ant-secret",
    ADA_MODEL: "claude-sonnet-4-6",
  } as NodeJS.ProcessEnv);
  assert.equal(present.keyAvailable, true);
  assert.equal(present.model, "claude-sonnet-4-6");
  assert.equal(present.modelFromEnv, true);
  // The returned shape carries NO secret.
  assert.equal(JSON.stringify(present).includes("sk-ant-secret"), false);

  const absent = readSettingsStatus({} as NodeJS.ProcessEnv);
  assert.equal(absent.keyAvailable, false);
  assert.equal(
    absent.model,
    SETTINGS_DEFAULT_MODEL,
    "falls back to the default model",
  );
  assert.equal(absent.modelFromEnv, false);
});

test("SETTINGS_DEFAULT_MODEL stays in lockstep with engine/model.ts's DEFAULT_MODEL", () => {
  // The Settings panel must report the SAME default the live client would use. model.ts keeps
  // its DEFAULT_MODEL private (it is the network module), so we pin the literal with a guard.
  const modelSrc = readFileSync(
    join(process.cwd(), "src/compile/engine/model.ts"),
    "utf8",
  );
  const m = /DEFAULT_MODEL\s*=\s*"([^"]+)"/.exec(modelSrc);
  assert.ok(m, "found DEFAULT_MODEL in model.ts");
  assert.equal(
    m![1],
    SETTINGS_DEFAULT_MODEL,
    "settingsStatus default must match model.ts DEFAULT_MODEL",
  );
});
