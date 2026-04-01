/**
 * Tests for C3GapCollapseResolver.
 * Run: node --test dist/c3gap-collapse-resolver.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { C3GapCollapseResolver } from "./c3gap-collapse-resolver.js";
import { BlueprintRegistryService, WORKSPACE_PACKAGE_NODES } from "@ada/ent";

test("C3GapCollapseResolver: detectC3Gap returns gap with ordinal 3", () => {
  const resolver = new C3GapCollapseResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  const gap = resolver.detectC3Gap(registry);

  assert.equal(
    gap.componentOrdinal,
    3,
    "C3AssignmentGap.componentOrdinal must be 3",
  );
  assert.equal(gap.isResolved, false, "gap must not be resolved initially");
  assert.equal(
    gap.resolvedPackage,
    null,
    "resolvedPackage must be null before resolution",
  );
  assert.equal(gap.resolutionProvenancePostcode, null);
  assert.ok(gap.componentId.length > 0);
});

test("C3GapCollapseResolver: evaluateCollapseTarget resolves to elicitation", () => {
  const resolver = new C3GapCollapseResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  const gap = resolver.detectC3Gap(registry);
  const assignment = resolver.evaluateCollapseTarget(
    gap,
    WORKSPACE_PACKAGE_NODES,
  );

  assert.equal(assignment.componentOrdinal, 3);
  assert.equal(assignment.isResolved, true);
  assert.equal(assignment.targetPackage, "elicitation");
  assert.ok(
    assignment.provenanceRecordPostcode !== null &&
      assignment.provenanceRecordPostcode.length > 0,
  );
  assert.ok(assignment.componentId.length > 0);
  assert.ok(assignment.componentName.length > 0);
});

test("C3GapCollapseResolver: commitCollapse returns resolved gap", () => {
  // Use a fresh resolver — evaluateCollapseTarget resolves internal state,
  // so commitCollapse must be called before evaluateCollapseTarget to avoid
  // the 'already resolved' error from C3GapResolver.
  const resolver = new C3GapCollapseResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  const gap = resolver.detectC3Gap(registry);

  const stubAssignment = {
    assignmentId: "assign-stub",
    mappingId: "mapping-ML.ENT.e80e3c97/v1",
    componentId: gap.componentId,
    componentOrdinal: 3 as const,
    componentName: gap.componentName,
    targetPackage: "elicitation" as const,
    isResolved: true,
    provenanceRecordPostcode: "ML.ENT.abc12345/v1",
  };

  const resolvedGap = resolver.commitCollapse(gap, stubAssignment);

  assert.equal(resolvedGap.isResolved, true);
  assert.equal(resolvedGap.resolvedPackage, "elicitation");
  assert.ok(resolvedGap.resolutionProvenancePostcode !== null);
});

test("C3GapCollapseResolver: buildPackageMapping produces total mapping from 10 resolved assignments", () => {
  const resolver = new C3GapCollapseResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  const gap = resolver.detectC3Gap(registry);
  const assignment = resolver.evaluateCollapseTarget(
    gap,
    WORKSPACE_PACKAGE_NODES,
  );

  // Build 10 assignments by combining the C3 assignment with others
  const components = svc.enumerateComponents();
  const otherAssignments = components
    .filter((c) => c.ordinal !== 3)
    .map((c) => ({
      assignmentId: `assign-${c.componentId}`,
      mappingId: "mapping-ML.ENT.e80e3c97/v1",
      componentId: c.componentId,
      componentOrdinal: c.ordinal,
      componentName: c.name,
      targetPackage: (c.assignedPackage ?? "compiler") as any,
      isResolved: true,
      provenanceRecordPostcode: "ML.ENT.abc12345/v1",
    }));

  const allAssignments = [...otherAssignments, assignment];
  const mapping = resolver.buildPackageMapping(allAssignments);

  assert.equal(mapping.isTotal, true, "mapping must be total");
  assert.equal(mapping.assignmentCount, 10);
  assert.equal(mapping.assignments.length, 10);
});

test("C3GapCollapseResolver: buildPackageMapping throws with fewer than 10 assignments", () => {
  const resolver = new C3GapCollapseResolver();
  assert.throws(
    () => resolver.buildPackageMapping([]),
    /Expected 10 assignments/,
  );
});
