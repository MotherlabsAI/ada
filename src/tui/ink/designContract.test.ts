/**
 * THE DESIGN CONTRACT — as runnable checks (the dogfood seed).
 *
 * Ada's whole thesis is "a runnable check over a judgment" (A3). The TUI design law
 * (Alex's Motion/Color/structure contracts, adas-markdowns-from-codex/visual-compiler-spec.md)
 * was advisory — so it drifted: a rotating star, a focus "breath", a red panel all shipped
 * before being caught by eye. These checks make the law ENFORCED: each scans the real source
 * and fails the build on a violation, so the surface is governed, not babysat. Model-free,
 * deterministic — the C-layer of the `ada-tui-design` pack, hand-seeded here until the full
 * `ada compile --repo` dogfood folds them into its registry.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = (f: string): string =>
  readFileSync(join(process.cwd(), "src/tui/ink", f), "utf8");

test("MOTION CONTRACT — the welcome arms no idle timer (no setInterval = no motion without a state change)", () => {
  // The rotating star + gradient ramp were idle setIntervals. Forbidden: the only
  // motion allowed is the one-shot ease on a real cursor move.
  assert.ok(
    !/setInterval/.test(src("Welcome.ts")),
    "Welcome.ts must not arm a repeating timer — idle motion is a contract violation",
  );
});

test("COLOR CONTRACT — the cursor/panel bar is a fixed neutral, never a cluster hue darkened", () => {
  // The bar used to be `darken(areaHex)` → an ugly purple on the plum cluster.
  // Backgrounds are calm chrome; hue is reserved for the small identity dot.
  const lines = src("lines.ts");
  assert.ok(
    !/bgHex:\s*darken\(/.test(lines),
    "no cluster-hue-derived selection bar (it read purple); use the neutral CURSOR_BG",
  );
});

test("COLOR CONTRACT — the welcome paints no coloured background panel (red is reserved for risk)", () => {
  // The focused-column 'fill' panel read as a red card. Focus is carried by
  // structure (header brightness + cursor), not a tinted region.
  assert.ok(
    !/backgroundColor:\s*(menuActive|!menuActive)/.test(src("Welcome.ts")),
    "no focus-tinted column panel — structure_before_color",
  );
});

test("STRUCTURE CONTRACT — the inspector labels its sections (it is not a wall of text)", () => {
  const lines = src("lines.ts");
  for (const label of ["SUMMARY", "WHY IT MATTERS", "FAILURE IF MISSING"]) {
    assert.ok(
      lines.includes(`"${label}"`),
      `the reader must carry a "${label}" section label, not run paragraphs together`,
    );
  }
});
