/**
 * Tests for WorkspacePackageScanner.
 * Run: node --test dist/workspace-package-scanner.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WorkspacePackageScanner,
  WORKSPACE_PACKAGE_NODES,
} from "./workspace-package-scanner.js";

const EXPECTED_PACKAGES = [
  "compiler",
  "config-writer",
  "elicitation",
  "governor",
  "int-rerun",
  "mcp-server",
  "orchestrator",
  "provenance",
] as const;

test("WorkspacePackageScanner: scanWorkspace returns 8 package nodes", () => {
  const scanner = new WorkspacePackageScanner();
  const nodes = scanner.scanWorkspace();

  assert.equal(
    nodes.length,
    8,
    "must return exactly 8 workspace package nodes",
  );
  const names = nodes.map((n) => n.packageName).sort();
  assert.deepEqual(names, [...EXPECTED_PACKAGES].sort());
});

test("WorkspacePackageScanner: each node has required fields", () => {
  const scanner = new WorkspacePackageScanner();
  const nodes = scanner.scanWorkspace();

  for (const node of nodes) {
    assert.ok(node.packageName.length > 0, `packageName missing`);
    assert.ok(
      node.pipelineStage.length > 0,
      `pipelineStage missing for ${node.packageName}`,
    );
    assert.ok(
      Array.isArray(node.assignedComponentIds),
      `assignedComponentIds must be array`,
    );
  }
});

test("WorkspacePackageScanner: getPackageNode returns correct node", () => {
  const scanner = new WorkspacePackageScanner();
  const node = scanner.getPackageNode("elicitation");
  assert.equal(node.packageName, "elicitation");
});

test("WorkspacePackageScanner: getPackageNode throws for unknown package", () => {
  const scanner = new WorkspacePackageScanner();
  assert.throws(
    () => scanner.getPackageNode("nonexistent" as any),
    /No WorkspacePackageNode found/,
  );
});

test("WorkspacePackageScanner: WORKSPACE_PACKAGE_NODES has 8 entries", () => {
  assert.equal(WORKSPACE_PACKAGE_NODES.length, 8);
});

test("WorkspacePackageScanner: resolvePackageForComponent finds package for assigned component", () => {
  const scanner = new WorkspacePackageScanner();

  // Build custom nodes with known assigned component IDs for this test
  // (WORKSPACE_PACKAGE_NODES has empty assignedComponentIds by design)
  const customNodes = [
    {
      packageName: "compiler" as const,
      pipelineStage: "ENT",
      assignedComponentIds: ["comp-001", "comp-002"],
    },
    {
      packageName: "elicitation" as const,
      pipelineStage: "ENT",
      assignedComponentIds: ["comp-003"],
    },
  ];

  const resolved = scanner.resolvePackageForComponent("comp-003", customNodes);
  assert.equal(resolved.packageName, "elicitation");

  const resolved2 = scanner.resolvePackageForComponent("comp-001", customNodes);
  assert.equal(resolved2.packageName, "compiler");
});

test("WorkspacePackageScanner: resolvePackageForComponent throws for unknown component", () => {
  const scanner = new WorkspacePackageScanner();
  const nodes = scanner.scanWorkspace();
  assert.throws(
    () => scanner.resolvePackageForComponent("nonexistent-component-id", nodes),
    /No workspace package found/,
  );
});
