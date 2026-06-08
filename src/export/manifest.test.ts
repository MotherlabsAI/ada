import { test } from "node:test";
import assert from "node:assert/strict";
import { projectExportManifest, exportManifestArtifact } from "./manifest.js";
import type { PackModel, NodeCapsule } from "../core/types.js";

const model = (nodes: NodeCapsule[] = []): PackModel =>
  ({ slug: "demo", graph: { nodes, edges: [] } }) as unknown as PackModel;

test("projectExportManifest indexes the emitted family, each artifact tagged by family + format", () => {
  const m = projectExportManifest(model());
  const paths = m.artifacts.map((a) => a.path);
  for (const want of [
    "exports/blueprint/POM.md",
    "exports/blueprint/AUTONOMY_CONTRACT.md",
    "exports/blueprint/AGENTS.md",
    "exports/blueprint/TOOL_CONTRACTS.md",
    "exports/blueprint/EVIDENCE_LEDGER.jsonl",
    "exports/blueprint/MEMORY_POLICY.md",
    "exports/copilot/.github/copilot-instructions.md",
    "exports/mcp/resources.json",
    "exports/openai-agents/agents.json",
  ]) {
    assert.ok(paths.includes(want), `manifest indexes ${want}`);
  }
  assert.ok(
    m.artifacts.every((a) => a.family && a.format),
    "every artifact declares its family + format (the §2 envelope minimum)",
  );
});

test("the manifest reports honest family COVERAGE (governance + reach present, frontier flagged)", () => {
  const m = projectExportManifest(model());
  assert.ok(
    m.families_present.includes("governance"),
    "governance family present",
  );
  assert.ok(
    m.families_present.includes("runtime-exports"),
    "multi-target reach present",
  );
  assert.ok(
    Array.isArray(m.frontier),
    "the not-yet-built frontier is named, not hidden (A2)",
  );
});

test("exportManifestArtifact emits deterministic EXPORT_MANIFEST.json (byte-stable, valid)", () => {
  const a = exportManifestArtifact(model());
  assert.equal(a.path, "EXPORT_MANIFEST.json");
  assert.doesNotThrow(() => JSON.parse(a.content), "valid JSON");
  assert.equal(
    a.content,
    exportManifestArtifact(model()).content,
    "byte-stable (no Date/Map)",
  );
});
