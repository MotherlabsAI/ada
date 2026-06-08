/**
 * The DETERMINISM guarantee (INVARIANT.003 / EVAL.001, production-ready).
 *
 * The compile's ONE non-deterministic step is the model call. Everything after it — rubric
 * scoring, capsule assembly, edge building, serialization — must be byte-stable: same NodeSpecs
 * in, identical pack out. Without this, a re-compile of an unchanged SEED churns the graph, and
 * the self-improvement shadow-compile (old-vs-new diff) is meaningless. This pins it: two
 * assemblies of the same input must be deep-equal AND serialize identically.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblePackGated, type NodeSpec } from "./assemble.js";
import { toJson } from "../core/serialize.js";

const SPECS: NodeSpec[] = [
  {
    id: "ROOT.000",
    label: "World Model",
    cluster: "ROOT",
    depth: "L5",
    summary:
      "The bounded world model — entities, relations, and the checks that keep the build governed.",
    whyItMatters:
      "Without it the executor builds from a raw prompt and never reasons about the real structure.",
    failureIfMissing: "The build drifts from intent with nothing to catch it.",
    fromPrompt: ["the system", "governed build"],
    compilesTo: ["graph", "wiki", "claude"],
    checkClass: "C0",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
    semanticType: "Intent",
  },
  {
    id: "DATA.001",
    label: "Record Index",
    cluster: "DATA",
    depth: "L5",
    summary:
      "records(id, kind, payload, created_at) — the fixed schema the executor must honour to keep state queryable.",
    whyItMatters:
      "The schema is the contract every read and write obeys; drift here corrupts the whole store.",
    failureIfMissing:
      "Records lose their shape and queries silently return wrong rows.",
    fromPrompt: ["records", "queryable state"],
    compilesTo: ["graph", "blueprint", "c"],
    checkClass: "C3",
    cCandidates: ["record.kind_is_enumerated"],
    unknowns: ["retention window?"],
    truth: "inference",
    parents: ["ROOT.000"],
    semanticType: "Invariant",
    relations: [{ to: "ROOT.000", type: "depends_on" }],
  },
  {
    id: "FLOW.001",
    label: "Ingest Flow",
    cluster: "FLOW",
    depth: "L4",
    summary:
      "raw input → validate → normalize → persist: the one path every record takes into the store.",
    whyItMatters:
      "A single governed ingest path is the only place validation can be enforced for all writes.",
    failureIfMissing:
      "Each call site validates differently and bad records slip in.",
    fromPrompt: ["ingest", "validate"],
    compilesTo: ["graph", "blueprint"],
    checkClass: "C2",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: ["ROOT.000"],
    semanticType: "Mechanism",
    relations: [{ to: "DATA.001", type: "depends_on" }],
  },
];

test("the assembly pipeline is deterministic — same specs in, identical pack out (INVARIANT.003)", () => {
  const a = assemblePackGated("demo", "a governed record store", SPECS);
  const b = assemblePackGated("demo", "a governed record store", SPECS);
  assert.ok(
    a.model.graph.nodes.length > 0,
    "the fixture survives the gate (a real graph)",
  );
  assert.deepEqual(
    a.model.graph,
    b.model.graph,
    "two assemblies of the same input produce the identical graph",
  );
  assert.equal(
    toJson(a.model.graph),
    toJson(b.model.graph),
    "the serialized graph is byte-stable (no Map/Set iteration churn, no timestamps)",
  );
});

test("node and edge order is stable across assembly — reproducible builds", () => {
  const ids = () =>
    assemblePackGated("demo", "intent", SPECS).model.graph.nodes.map(
      (nn) => nn.id,
    );
  assert.deepEqual(ids(), ids(), "node order does not vary between runs");
  const edges = () =>
    assemblePackGated("demo", "intent", SPECS).model.graph.edges.map(
      (e) => `${e.from}|${e.to}|${e.type}`,
    );
  assert.deepEqual(edges(), edges(), "edge order does not vary between runs");
});
