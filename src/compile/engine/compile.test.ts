/**
 * engineCompile — the SHARED compile seam. The model is INJECTED as a stub, so this exercises
 * the whole pipeline (proposeClusters → excavatePack → assemblePackGated → writePack) with NO
 * live call (A1/A9: the only network is in model.ts; the stub here proves we never reach it).
 * The pack lands on disk in a tmp dir; the result is deterministic given the same stub.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { engineCompile } from "./compile.js";
import type { ModelClient } from "./model.js";
import type { Seed } from "../../core/types.js";

const INTENT =
  "a personal knowledge base that makes my research notes citable by an LLM";

function seed(): Seed {
  return {
    rootIntent: INTENT,
    domain: "Personal knowledge base",
    userRole: "A researcher who lives in their notes",
    buildObjective: "Notes an LLM will cite, not just retrieve.",
    knowledgeObjective: "A navigable map of what makes a note citable.",
    trustObjective: "Deterministic checks where citability is structural.",
    knownContext: ["The notes are markdown."],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: [],
  };
}

// A realistic, gate-passing NodeSpec with a distinct label (mirrors orchestrate.test).
function impress(label: string): string {
  return JSON.stringify({
    id: "X.000",
    label,
    cluster: "ATT",
    depth: "L4",
    summary: `${label}: the claim, its source, and the note title must co-reside inside one ~512-token retrieval window; split them across headings and the retriever lifts a slice that names neither, so a weaker note wins.`,
    whyItMatters:
      "Citability is decided at chunk granularity, not document quality.",
    failureIfMissing:
      "Notes get retrieved but never cited; the base looks invisible to the model.",
    fromPrompt: ["research notes citable by an LLM", "personal knowledge base"],
    compilesTo: ["chunk.md", "CLAUDE.md rules", "c/checks/window.mjs"],
    checkClass: "C3",
    cCandidates: [
      "assert claim+source+title co-reside within a 512-token window",
    ],
    unknowns: ["the retrieval window size per LLM vendor"],
    truth: "inference",
    parents: [],
  });
}

const GENERIC = JSON.stringify({
  id: "ATT.099",
  label: "Make the notes great",
  cluster: "ATT",
  depth: "L4",
  summary:
    "Leverage best practices to deliver world-class, seamless quality you can trust.",
  whyItMatters: "It is very important.",
  failureIfMissing: "Things are worse.",
  fromPrompt: [],
  compilesTo: ["notes.md"],
  checkClass: "C0",
  cCandidates: [],
  unknowns: [],
  truth: "inference",
  parents: [],
});

/**
 * A stub that answers BOTH model roles through the one ModelClient seam:
 *   • the cluster proposal prompt → a JSON area array,
 *   • each excavation prompt ("cluster to excavate: X") → the next impress() for that cluster.
 * No network is ever touched — a thrown error here would prove a leak past model.ts.
 */
function stub(): ModelClient {
  const queue = [
    impress("Chunk-resident citations"),
    impress("Source binding survives the cut"),
    impress("Title anchoring per window"),
  ];
  let i = 0;
  return {
    async complete(prompt: string): Promise<string> {
      if (prompt.includes("Do NOT include ROOT or UNK")) {
        // The cluster-proposal step: ≥ MIN_AREAS (3) so the engine accepts the proposal rather
        // than falling back to the default set. Only ATT carries impressers; the rest are empty.
        return JSON.stringify([
          { code: "ATT", label: "Attention" },
          { code: "BIND", label: "Binding" },
          { code: "WIN", label: "Windowing" },
        ]);
      }
      if (prompt.includes("cluster to excavate: ATT")) {
        return queue[i++] ?? GENERIC;
      }
      // Other clusters (no impressers queued) → GENERIC, gated out. Honest empty areas.
      return GENERIC;
    },
  };
}

function tmp(): string {
  return mkdtempSync(join(tmpdir(), "ada-engcompile-"));
}

test("engineCompile (stubbed model) writes a pack and returns a non-ROOT firstNodeId", async () => {
  const cwd = tmp();
  try {
    const r = await engineCompile({
      cwd,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      opts: { perCluster: 3, client: stub() },
    });
    // Pack landed on disk.
    const graphJson = join(cwd, ".ada", "packs", "kb", "graph.json");
    assert.ok(existsSync(graphJson), "graph.json was written");
    assert.ok(r.manifest.nodeCount >= 1, "manifest has nodes");
    // First node prefers a real excavated capsule, not the synthesized ROOT.000.
    assert.notEqual(r.firstNodeId, "ROOT.000", "lands on an excavated node");
    assert.ok(
      r.model.graph.nodes.some((n) => n.id === r.firstNodeId),
      "firstNodeId is a real node in the graph",
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("engineCompile is deterministic given the same stub", async () => {
  const a = tmp();
  const b = tmp();
  try {
    const ra = await engineCompile({
      cwd: a,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      opts: { perCluster: 3, client: stub() },
    });
    const rb = await engineCompile({
      cwd: b,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      opts: { perCluster: 3, client: stub() },
    });
    assert.equal(
      JSON.stringify(ra.model.graph.nodes.map((n) => n.id)),
      JSON.stringify(rb.model.graph.nodes.map((n) => n.id)),
      "same node ids",
    );
    assert.equal(ra.firstNodeId, rb.firstNodeId);
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test("engineCompile honors an explicit cluster override (skips the proposal call)", async () => {
  const cwd = tmp();
  let proposalAsked = false;
  const client: ModelClient = {
    async complete(prompt: string): Promise<string> {
      if (prompt.includes("Do NOT include ROOT or UNK")) proposalAsked = true;
      if (prompt.includes("cluster to excavate: ATT"))
        return impress("Chunk-resident citations");
      return GENERIC;
    },
  };
  try {
    const r = await engineCompile({
      cwd,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      opts: {
        perCluster: 1,
        clusters: [{ code: "ATT", label: "ATT" }],
        client,
      },
    });
    assert.equal(proposalAsked, false, "the proposal model call was skipped");
    assert.ok(r.manifest.clusters.includes("ROOT"), "ROOT anchor present");
    assert.ok(
      r.manifest.clusters.includes("ATT"),
      "the overridden area is the one that got excavated",
    );
    // The pack carries the area→label registry derived from the override (ROOT/ATT/UNK).
    assert.equal(
      r.model.clusterLabels?.["ATT"],
      "ATT",
      "override label registered",
    );
    assert.equal(
      r.model.clusterLabels?.["UNK"],
      "Unknown-unknowns",
      "UNK anchor registered",
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("engineCompile throws cleanly when every candidate is gated out", async () => {
  const cwd = tmp();
  const allGeneric: ModelClient = {
    async complete(prompt: string): Promise<string> {
      if (prompt.includes("Do NOT include ROOT or UNK"))
        return JSON.stringify([{ code: "ATT", label: "Attention" }]);
      return GENERIC;
    },
  };
  try {
    await assert.rejects(
      engineCompile({
        cwd,
        slug: "kb",
        intent: INTENT,
        seed: seed(),
        opts: { perCluster: 2, client: allGeneric },
      }),
      /no node that cleared the gate/,
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("a seedOverride is persisted verbatim into the pack's SEED.md (A2)", async () => {
  const cwd = tmp();
  const override: Seed = {
    ...seed(),
    rootIntent: INTENT,
    domain: "Citable research notes (interview-captured)",
    constraints: ["Under $20/mo", "Runs offline"],
  };
  try {
    await engineCompile({
      cwd,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      seedOverride: override,
      opts: {
        perCluster: 1,
        clusters: [{ code: "ATT", label: "ATT" }],
        client: stub(),
      },
    });
    const seedMd = readFileSync(
      join(cwd, ".ada", "packs", "kb", "SEED.md"),
      "utf8",
    );
    assert.match(
      seedMd,
      /interview-captured/,
      "the override domain is persisted",
    );
    assert.match(
      seedMd,
      /Under \$20\/mo/,
      "the override constraint is persisted",
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("engineCompile with plan:true merges gated Action nodes under PLAN (the planner wiring, no live call)", async () => {
  // Proves end-to-end what the live dogfood compile would show, but deterministically: with
  // plan:true, the planner's model call (the prompt containing "PLANNER") returns an action array,
  // the gated Action lands in the assembled graph under the PLAN cluster, and the cluster label is
  // registered. This is the wiring the credit-blocked live compile couldn't demonstrate.
  const cwd = tmp();
  const ACTION = JSON.stringify([
    {
      label: "Build the validating ingest gate",
      summary:
        "Add validate()→normalize()→persist as the single write path so every record is checked inside one ~50ms budget before it lands; today writes bypass it.",
      whyItMatters:
        "It is the only place validation can be enforced for all writes at once.",
      failureIfMissing:
        "Each call site validates differently and malformed records slip into the store.",
      fromPrompt: ["Notes an LLM will cite, not just retrieve."],
      compilesTo: ["src/ingest.ts", "c/checks/ingest_validates.mjs"],
      checkClass: "C3",
      cCandidates: [
        "assert no write reaches the store without passing validate()",
      ],
      unknowns: ["which fields are required per record kind?"],
      truth: "inference",
      closesGap: "Chunk-resident citations",
    },
  ]);
  const client: ModelClient = {
    async complete(prompt: string): Promise<string> {
      if (prompt.includes("PLANNER")) return ACTION;
      if (prompt.includes("Do NOT include ROOT or UNK"))
        return JSON.stringify([
          { code: "ATT", label: "Attention" },
          { code: "BIND", label: "Binding" },
          { code: "WIN", label: "Windowing" },
        ]);
      if (prompt.includes("cluster to excavate: ATT"))
        return impress("Chunk-resident citations");
      return GENERIC;
    },
  };
  try {
    const r = await engineCompile({
      cwd,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      opts: { perCluster: 1, client, plan: true },
    });
    const actions = r.model.graph.nodes.filter(
      (n) => n.semanticType === "Action",
    );
    assert.equal(
      actions.length,
      1,
      "the gated Action node landed in the graph",
    );
    assert.match(
      actions[0]!.id,
      /^PLAN\.001$/,
      "under the PLAN cluster, positional id",
    );
    assert.equal(
      r.model.clusterLabels?.["PLAN"],
      "Plan / next moves",
      "the PLAN cluster label is registered for the TUI/wiki",
    );
    // The action is wired to the gap it closes (Chunk-resident citations → its real id).
    const edge = r.model.graph.edges.find(
      (e) => e.from === "PLAN.001" && e.type === "enables",
    );
    assert.ok(edge, "the action enables the gap node it closes (traced, A2)");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("engineCompile WITHOUT plan adds no Action nodes (opt-in; default path unchanged)", async () => {
  const cwd = tmp();
  try {
    const r = await engineCompile({
      cwd,
      slug: "kb",
      intent: INTENT,
      seed: seed(),
      opts: { perCluster: 1, client: stub() }, // no plan:true
    });
    assert.ok(
      !r.model.graph.nodes.some((n) => n.semanticType === "Action"),
      "no planner ran → no Action nodes",
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("no model/network token lives in engine/compile.ts (A1/A9 boundary is structural)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/compile/engine/compile.ts"),
    "utf8",
  ).toLowerCase();
  // `anthropicClient` is imported (the default client factory) but the network primitives
  // themselves must not appear here — they live only in model.ts.
  for (const tok of ["fetch(", "api.anthropic.com", "x-api-key"]) {
    assert.ok(
      !src.includes(tok),
      `forbidden token "${tok}" in engine/compile.ts`,
    );
  }
});
