/**
 * Deterministic build blueprint (spec cluster BLUEPRINT, AXIOM A1).
 *
 * P0 (FREEZE.md §4): every emitted claim DERIVES from the typed IR — clustered graph
 * nodes (label / summary / checkability.candidates / truth / compileTargets) + the
 * pack's own check candidates. No hand-authored domain prose. Provenance guard (4-d):
 * a MUST / acceptance line traces only to Ada-authored nodes (truth ∈ inference|residue)
 * or their deterministic check candidates — a truth="source" node (ingested,
 * attacker-influenceable) is never promoted into a MUST. Each derived claim carries the
 * node id it traces to (AXIOM A2).
 */
import type { PackModel, NodeCapsule } from "../core/types.js";
import { clusterOf } from "../core/ids.js";
import { toJson } from "../core/serialize.js";
import type { ExportFile } from "./claude.js";

function cluster(model: PackModel, c: string): NodeCapsule[] {
  return model.graph.nodes.filter((n) => clusterOf(n.id) === c);
}

/** Ada-authored nodes only (AXIOM A2 / 4-d): ingested `source` text is never a MUST. */
function authored(nodes: NodeCapsule[]): NodeCapsule[] {
  return nodes.filter((n) => n.truth !== "source");
}

/** Nodes that carry a real deterministic predicate (C3–C5 with candidates). */
function checkable(n: NodeCapsule): boolean {
  const c = n.checkability;
  return (
    (c.class === "C3" || c.class === "C4" || c.class === "C5") &&
    c.candidates.length > 0
  );
}

/** Human-gated surfaces (AXIOM A4): C0–C2 nodes the executor must stop and ask about. */
function humanGated(n: NodeCapsule): boolean {
  const c = n.checkability.class;
  return c === "C0" || c === "C1" || c === "C2";
}

export function blueprintExports(model: PackModel): ExportFile[] {
  const { seed } = model;
  const tables = cluster(model, "DATA");
  const flows = cluster(model, "WORKFLOW");

  // Acceptance MUSTs derive from Ada-authored, checkable nodes — each line carries the
  // node id (provenance) and the node's own deterministic check candidate (the
  // Ada-authored invariant). Never from a truth="source" node (4-d).
  const acceptanceFromNodes = authored(model.graph.nodes)
    .filter(checkable)
    .flatMap((n) =>
      n.checkability.candidates.map(
        (cand) => `- MUST: ${cand} (\`${n.id}\` — ${n.label})`,
      ),
    );

  const context: ExportFile = {
    path: "CONTEXT.md",
    content: [
      `# Context — ${seed.domain}`,
      "",
      seed.buildObjective,
      "",
      "## Known",
      ...seed.knownContext.map((k) => `- ${k}`),
      "",
      "## Deliberately open (do not invent answers)",
      ...(seed.unknownContext.length
        ? seed.unknownContext.map((u) => `- ${u}`)
        : ["- (none surfaced)"]),
      "",
    ].join("\n"),
  };

  const scopeLines = [...new Set(model.graph.nodes.map((n) => clusterOf(n.id)))]
    .filter((c) => c !== "ROOT")
    .map((c) => `- **${c}** — ${cluster(model, c).length} node(s)`);

  const blueprint: ExportFile = {
    path: "BLUEPRINT.md",
    content: [
      `# Blueprint — ${seed.domain}`,
      "",
      "## Scope",
      seed.buildObjective,
      "",
      "Clusters in this pack (the bounded surface to build):",
      ...scopeLines,
      "",
      "## Deliberately open (P0 non-goals — modelled, not built)",
      ...(seed.unknownContext.length
        ? seed.unknownContext.map((u) => `- ${u}`)
        : ["- (none surfaced)"]),
      "",
      "## Data model",
      ...(tables.length
        ? tables.map(
            (t) => `- **${t.label}** (\`${t.id}\`) — ${t.localContext.summary}`,
          )
        : ["- (no DATA-cluster nodes in this pack)"]),
      "",
      "## Services / workflows",
      ...(flows.length
        ? flows.map(
            (f) => `- **${f.label}** (\`${f.id}\`) — ${f.localContext.summary}`,
          )
        : ["- (no WORKFLOW-cluster nodes in this pack)"]),
      "",
      "## Build order",
      "See `TASK_GRAPH.json`. Data model and constraints first, then services/workflows, then UI.",
      "",
      "## Done",
      "Code satisfies `ACCEPTANCE.md` and the pack's C checks pass on real data — see `VERIFY.md`.",
      "",
    ].join("\n"),
  };

  const acceptance: ExportFile = {
    path: "ACCEPTANCE.md",
    content: [
      "# Acceptance Criteria",
      "",
      "Must-pass conditions, each derived from a checkable node (AXIOM A2 — every line",
      "traces to a node id; ingested `source` claims are never promoted to a MUST):",
      "",
      ...(acceptanceFromNodes.length
        ? acceptanceFromNodes
        : [
            "- (no deterministically checkable nodes in this pack; see the wiki for residue)",
          ]),
      "",
      "Verify with the pack's own harness — see `VERIFY.md`.",
      "",
    ].join("\n"),
  };

  // Gates derive from human-gated (C0–C2) Ada-authored nodes (AXIOM A4), each traced.
  const gateNodes = authored(model.graph.nodes).filter(humanGated);
  const gates: ExportFile = {
    path: "GATES.md",
    content: [
      "# Human Gates (AXIOM A4 — humans govern, agents execute)",
      "",
      "These surfaces are not deterministically checkable; a human decides. Stop and ask",
      "before crossing any of them.",
      "",
      ...(gateNodes.length
        ? gateNodes.map(
            (n) =>
              `- **${n.label}** (\`${n.id}\`, ${n.checkability.class}) — ${n.localContext.summary}`,
          )
        : ["- (no human-gated nodes surfaced in this pack)"]),
      "",
    ].join("\n"),
  };

  const verify: ExportFile = {
    path: "VERIFY.md",
    content: [
      "# Verify",
      "",
      "```bash",
      "node c/checks/verify.mjs                   # bundled clean dataset → all checks pass",
      "node c/checks/verify.mjs --data DATA.json  # run against your real data",
      "node c/checks/verify.mjs --json            # machine-readable report",
      "```",
      "",
      "Wire these into CI so every change is guarded. A failing check blocks acceptance.",
      "",
    ].join("\n"),
  };

  // Task graph derives from the data + workflow nodes (their ids are the produced
  // artifacts), with each workflow guarded by its own checkable candidates.
  const tasks = {
    version: "1",
    tasks: [
      {
        id: "T1",
        title: "Create data model + constraints",
        produces: tables.map((t) => t.id),
        dependsOn: [],
      },
      ...flows.map((f, i) => ({
        id: `T${i + 2}`,
        title: `Implement workflow: ${f.label}`,
        produces: [f.id],
        dependsOn: ["T1"],
        guards: f.checkability.candidates,
      })),
    ],
  };

  const taskGraph: ExportFile = {
    path: "TASK_GRAPH.json",
    content: toJson(tasks),
  };

  const agents: ExportFile = {
    path: "AGENTS.md",
    content: [
      "# Agents",
      "",
      "- **ada-context-scout** — reads the pack, answers what the domain requires.",
      "- **ada-blueprint-writer** — executes the task graph without over-engineering.",
      "- **ada-c-verifier** — runs the C checks and blocks acceptance on failure.",
      "",
      "Order: scout → blueprint-writer (per task) → c-verifier (gate) → repeat.",
      "",
    ].join("\n"),
  };

  return [context, blueprint, acceptance, gates, verify, taskGraph, agents];
}
