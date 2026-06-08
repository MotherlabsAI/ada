/**
 * watch.test.ts — the read side of the real-time spine. renderSnapshot/readSnapshot are pure
 * (no timers, no process state) so they test directly: a snapshot folds into the live tree, and
 * an absent/torn snapshot reads as null (the live loop in cli.ts recovers on the next tick).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSnapshot, renderSnapshot, snapshotPath } from "./watch.js";
import type { CompileSnapshot } from "../compile/engine/progress.js";

// Strip ANSI so assertions match the rendered TEXT, not the color codes around it.
function plain(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function snap(over: Partial<CompileSnapshot> = {}): CompileSnapshot {
  return {
    slug: "triage",
    intent: "a tool that triages support tickets",
    status: "running",
    startedAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:02:11.000Z",
    phase: "excavate",
    phases: [
      {
        id: "propose",
        label: "propose clusters",
        status: "done",
        calls: 1,
        callsTotal: 1,
        nodes: 0,
      },
      {
        id: "excavate",
        label: "excavate",
        status: "running",
        calls: 4,
        nodes: 21,
        clusters: [
          { id: "INTAKE", status: "done", calls: 2, callsTotal: 2, nodes: 9 },
          {
            id: "ROUTING",
            status: "running",
            calls: 2,
            callsTotal: 3,
            nodes: 12,
          },
          { id: "SLA", status: "queued", calls: 0, callsTotal: 2, nodes: 0 },
        ],
      },
    ],
    totals: {
      nodes: 21,
      edges: 30,
      residue: 3,
      calls: 5,
      inTok: 0,
      outTok: 0,
      cacheTok: 0,
      costUsd: 0.41,
    },
    lastError: null,
    ...over,
  };
}

test("renderSnapshot shows the slug, phases, per-cluster excavation rows, and totals", () => {
  const out = plain(renderSnapshot(snap()));
  assert.match(out, /compiling\s+triage/, "header names the slug");
  assert.match(out, /propose clusters/, "propose phase line");
  assert.match(out, /excavate/, "excavate phase line");
  // Per-cluster breakdown — the 'agents' the user watches.
  assert.match(out, /INTAKE\s+2\/2 · 9 nodes/, "done cluster with node count");
  assert.match(out, /ROUTING\s+2\/3 · 12 nodes/, "running cluster progress");
  assert.match(out, /SLA\s+queued/, "queued cluster");
  // Totals line, residue surfaced as Ω, cost rendered.
  assert.match(out, /live:\s+21 nodes · 30 edges · 3Ω · 5 calls · \$0\.41/);
});

test("renderSnapshot reflects terminal status (done / error)", () => {
  assert.match(plain(renderSnapshot(snap({ status: "done" }))), /◈ done/);
  const errored = plain(
    renderSnapshot(
      snap({ status: "error", lastError: "excavate: cleared the gate" }),
    ),
  );
  assert.match(errored, /✗ error/, "error header");
  assert.match(errored, /cleared the gate/, "the reason is shown");
});

test("readSnapshot returns null when there is nothing to watch, parses when present", () => {
  const cwd = mkdtempSync(join(tmpdir(), "ada-watch-"));
  try {
    assert.equal(readSnapshot(cwd, "triage"), null, "absent → null");
    const p = snapshotPath(cwd, "triage");
    mkdirSync(join(cwd, ".ada", "packs", "triage"), { recursive: true });
    writeFileSync(p, JSON.stringify(snap()));
    const got = readSnapshot(cwd, "triage");
    assert.equal(got?.slug, "triage", "present → parsed");
    assert.equal(got?.totals.nodes, 21);
    // A torn/half-written file reads as null (the next poll tick recovers).
    writeFileSync(p, "{not json");
    assert.equal(readSnapshot(cwd, "triage"), null, "unparseable → null");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
