import { test } from "node:test";
import assert from "node:assert/strict";
import { mu, holesOf, haltReason, shouldHalt, type Hole } from "./mu.js";
import type { PackModel } from "../core/types.js";

const H = (
  id: string,
  scope: string,
  status: Hole["status"] = "open",
): Hole => ({
  id,
  scope,
  status,
});

// ── μ: open holes within a frozen scope ──────────────────────────────────────

test("μ counts only OPEN holes, and respects scope", () => {
  const holes = [
    H("a", "ROOT"),
    H("b", "ROOT"),
    H("c", "UNK"),
    H("d", "ROOT", "resolved"),
    H("e", "ROOT", "permanent"),
  ];
  assert.equal(mu(holes, "*"), 3, "* counts all open holes across scopes");
  assert.equal(mu(holes, "ROOT"), 2, "scope ROOT counts only its open holes");
  assert.equal(mu(holes, "UNK"), 1);
  assert.equal(mu([], "*"), 0);
});

// ── holesOf: residue nodes + unresolved unknowns, scoped by area ─────────────

test("holesOf extracts a hole per residue node and per unknown, scoped by area", () => {
  const pack = {
    graph: {
      nodes: [
        {
          id: "ROOT.001",
          truth: "inference",
          epistemics: { unknowns: ["x", "y"] },
        },
        { id: "UNK.001", truth: "residue", epistemics: { unknowns: ["z"] } },
        { id: "ATT.004", truth: "source", epistemics: { unknowns: [] } },
      ],
    },
  } as unknown as PackModel;

  const holes = holesOf(pack);
  // ROOT.001: 2 unknowns; UNK.001: 1 residue node + 1 unknown; ATT.004: nothing
  assert.equal(holes.length, 4);
  assert.ok(
    holes.every((h) => h.status === "open"),
    "holes are open (A2: never faked resolved)",
  );
  assert.equal(mu(holes, "ROOT"), 2);
  assert.equal(mu(holes, "UNK"), 2);
  assert.equal(mu(holes, "ATT"), 0);
});

// ── halt-predicate: converged | fuel-exhausted | stalled | continue ──────────

test("converged dominates: μ=0 halts even if fuel is exhausted", () => {
  assert.equal(
    haltReason({ muNow: 0, muPrev: 5, fuelUsed: 999, fuelCap: 100 }),
    "converged",
  );
});

test("fuel exhaustion halts a non-converged run (bounded ≠ converged)", () => {
  assert.equal(
    haltReason({ muNow: 3, muPrev: 9, fuelUsed: 100, fuelCap: 100 }),
    "fuel-exhausted",
  );
});

test("a non-decreasing μ stalls (no progress) — halt without converging", () => {
  assert.equal(
    haltReason({ muNow: 4, muPrev: 4, fuelUsed: 10, fuelCap: 100 }),
    "stalled",
  );
  assert.equal(
    haltReason({ muNow: 5, muPrev: 4, fuelUsed: 10, fuelCap: 100 }),
    "stalled",
  );
});

test("a strictly decreasing μ above zero continues; first cycle continues", () => {
  assert.equal(
    haltReason({ muNow: 3, muPrev: 7, fuelUsed: 10, fuelCap: 100 }),
    null,
  );
  assert.equal(
    haltReason({ muNow: 7, muPrev: null, fuelUsed: 0, fuelCap: 100 }),
    null,
  );
  assert.equal(
    shouldHalt({ muNow: 3, muPrev: 7, fuelUsed: 10, fuelCap: 100 }),
    false,
  );
  assert.equal(
    shouldHalt({ muNow: 0, muPrev: 1, fuelUsed: 0, fuelCap: 100 }),
    true,
  );
});
