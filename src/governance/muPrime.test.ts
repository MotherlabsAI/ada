import { test } from "node:test";
import assert from "node:assert/strict";
import { repoArtifacts, isGrounded, muPrime } from "./muPrime.js";
import type {
  SourceManifest,
  IngestedSource,
} from "../compile/engine/ingest.js";
import type { PackModel } from "../core/types.js";

function src(over: Partial<IngestedSource>): IngestedSource {
  return {
    id: over.path ?? "x",
    path: over.path ?? "x",
    kind: over.kind ?? "code",
    bytes: 0,
    sha256: "0".repeat(64),
    evidenceClass: "source-backed",
    content: over.content ?? "",
    redaction: [],
    ...over,
  };
}
const manifest = (a: IngestedSource[]): SourceManifest => ({
  root: "/r",
  admitted: a,
  rejected: [],
  admittedCount: a.length,
  rejectedCount: 0,
  secretsRedacted: 0,
});

// ── repoArtifacts: real filenames + exported symbols, min length ─────────────

test("repoArtifacts collects filenames and exported symbols (lowercased)", () => {
  const arts = repoArtifacts(
    manifest([
      src({
        path: "src/compile/engine/ingest.ts",
        kind: "code",
        content:
          "export function ingestRepo(){}\nexport interface SourceManifest {}",
      }),
      src({ path: "graph.json", kind: "config", content: "{}" }),
    ]),
  );
  assert.ok(arts.has("ingest.ts"));
  assert.ok(arts.has("graph.json"));
  assert.ok(arts.has("ingestrepo"));
  assert.ok(arts.has("sourcemanifest"));
});

test("common-word type names do NOT become grounding artifacts (false-positive guard)", () => {
  const arts = repoArtifacts(
    manifest([
      src({
        path: "src/core/types.ts",
        kind: "code",
        content:
          "export interface Graph {}\nexport interface Seed {}\nexport function ingestRepo(){}\nexport interface PackModel {}",
      }),
    ]),
  );
  assert.ok(!arts.has("graph"), "bare 'Graph' is too generic to ground a hole");
  assert.ok(!arts.has("seed"), "bare 'Seed' is too generic");
  assert.ok(arts.has("ingestrepo"), "compound symbol is distinctive — kept");
  assert.ok(arts.has("packmodel"), "compound symbol kept");
  assert.ok(arts.has("types.ts"), "the filename is still a real artifact");
});

// ── isGrounded: cites a real artifact, NOT a generic word ─────────────────────

test("isGrounded is true only when a hole cites a real artifact token", () => {
  const arts = new Set(["graph.json", "gates.md", "ingestrepo"]);
  assert.equal(
    isGrounded("the exact schema of graph.json is unspecified", arts),
    true,
  );
  assert.equal(
    isGrounded("how ingestRepo handles symlinks is unclear", arts),
    true,
  );
  // the false-positive guard: a generic word that is NOT a real artifact must NOT ground it
  assert.equal(
    isGrounded("the graph schema is vague", arts),
    false,
    "'graph' ≠ graph.json",
  );
  assert.equal(isGrounded("normalization spec is unspecified", arts), false);
});

// ── μ′: count GROUNDED holes (the right proxy) ────────────────────────────────

test("muPrime counts only holes whose text cites a real artifact", () => {
  const arts = new Set(["graph.json", "gates.md"]);
  const pack = {
    graph: {
      nodes: [
        {
          id: "ROOT.001",
          truth: "inference",
          label: "core",
          localContext: { summary: "" },
          epistemics: {
            unknowns: [
              "the schema of graph.json is unspecified",
              "cluster taxonomy is vague",
            ],
          },
        },
        {
          id: "UNK.001",
          truth: "residue",
          label: "human gate via GATES.md protocol",
          localContext: { summary: "" },
          epistemics: { unknowns: [] },
        },
        {
          id: "ATT.004",
          truth: "source",
          label: "x",
          localContext: { summary: "" },
          epistemics: { unknowns: ["normalization is unspecified"] },
        },
      ],
    },
  } as unknown as PackModel;
  // grounded: ROOT.001 unknown #1 (graph.json) + UNK.001 residue node (GATES.md) = 2
  // NOT grounded: ROOT.001 unknown #2 (generic), ATT.004 unknown (generic)
  assert.equal(muPrime(pack, arts), 2);
});

test("NEGATIVE CONTROL: holes that don't cite the repo score ~0 (validates μ′ is not common-word noise)", () => {
  // This is how "grounds 5x more" is validated WITHOUT reading the holes (OP-07): a measure
  // that scores 0 on non-citing prose, and high on citing prose, is detecting CITATION — so a
  // separation between arms is real grounding, not an artifact of the metric.
  const arts = new Set(["graph.json", "ingestrepo", "packmodel"]);
  const foreign = {
    graph: {
      nodes: [
        {
          id: "BOOK.001",
          truth: "inference",
          label: "double booking",
          localContext: { summary: "" },
          epistemics: {
            unknowns: [
              "staff overlap policy is unspecified",
              "timezone handling is unclear",
            ],
          },
        },
        {
          id: "PAY.001",
          truth: "residue",
          label: "refund amount sign",
          localContext: { summary: "" },
          epistemics: { unknowns: ["partial refunds are undefined"] },
        },
      ],
    },
  } as unknown as PackModel;
  assert.equal(
    muPrime(foreign, arts),
    0,
    "a pack that never cites the repo must ground at ~0",
  );
});
