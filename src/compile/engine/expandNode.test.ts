import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expandNode, subPackSlug } from "./expand.js";
import type { ModelClient } from "./model.js";
import type { NodeCapsule, Seed } from "../../core/types.js";

const parentSeed = (): Seed =>
  ({
    rootIntent: "a citable notes tool",
    domain: "knowledge management",
    userRole: "researcher",
    buildObjective: "notes linked to sources",
    knowledgeObjective: "a map of citability",
    trustObjective: "every cite resolves",
    knownContext: ["markdown notes"],
    unknownContext: [],
    assumptions: [],
    sources: [],
    constraints: [],
    risks: [],
  }) as Seed;

const groundNode = (): NodeCapsule =>
  ({
    id: "ATT.001",
    label: "chunk-resident citations",
    truth: "inference",
    semanticType: "Mechanism",
    localContext: {
      summary: "claim+source+title must co-reside in one window",
      whyItMatters: "citability is decided at chunk granularity",
    },
    epistemics: { unknowns: ["window size per vendor?"] },
  }) as unknown as NodeCapsule;

const impress = (label: string): string =>
  JSON.stringify({
    id: "X.0",
    label,
    cluster: "ATT",
    depth: "L4",
    summary: `${label}: a specific mechanism with a ~512-token window and a named judge that fires per chunk.`,
    whyItMatters: "decided at chunk granularity, not document quality.",
    failureIfMissing: "retrieved but never cited; the base looks invisible.",
    fromPrompt: ["chunk-resident citations"],
    compilesTo: ["a.md", "b.mjs"],
    checkClass: "C3",
    cCandidates: ["assert co-residence in one window"],
    unknowns: ["vendor window size"],
    truth: "inference",
    parents: [],
  });

const stub = (): ModelClient => {
  const q = [
    impress("Window co-residence"),
    impress("Title anchoring"),
    impress("Source binding"),
  ];
  let i = 0;
  return {
    async complete(prompt: string): Promise<string> {
      if (prompt.includes("Do NOT include ROOT or UNK"))
        return JSON.stringify([
          { code: "ATT", label: "Attention" },
          { code: "WIN", label: "Window" },
          { code: "BND", label: "Bind" },
        ]);
      if (prompt.includes("cluster to excavate: ATT")) return q[i++] ?? q[0]!;
      return q[0]!;
    },
  };
};

test("subPackSlug extends the postcode: <parent>__<nodeId>", () => {
  assert.equal(
    subPackSlug("ada-website-2", "MSG.001"),
    "ada-website-2__MSG.001",
  );
});

test("expandNode descends a GROUND node into its own sub-pack (travel the language)", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "ada-expand-"));
  try {
    const r = await expandNode({
      cwd,
      parentSlug: "kb",
      node: groundNode(),
      parentSeed: parentSeed(),
      opts: { perCluster: 2, client: stub() },
    });
    assert.equal(r.expanded, true, "a grounded node expands");
    assert.equal(r.subSlug, "kb__ATT.001");
    assert.ok(
      existsSync(join(cwd, ".ada", "packs", "kb__ATT.001", "graph.json")),
      "the sub-pack landed on disk",
    );
    assert.ok((r.nodeCount ?? 0) >= 1, "the sub-tree has nodes");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("expandNode REFUSES a hole — a residue/Unknown node is a leaf, not a seed (no compile, A2)", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "ada-expand-"));
  try {
    const hole = {
      ...groundNode(),
      id: "UNK.1",
      truth: "residue",
    } as unknown as NodeCapsule;
    const r = await expandNode({
      cwd,
      parentSlug: "kb",
      node: hole,
      parentSeed: parentSeed(),
      opts: { client: stub() },
    });
    assert.equal(r.expanded, false, "a hole is not descended");
    assert.match(r.reason, /hole|leaf|invent/i);
    assert.ok(
      !existsSync(join(cwd, ".ada", "packs", "kb__UNK.1")),
      "no sub-pack was compiled for a hole",
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
