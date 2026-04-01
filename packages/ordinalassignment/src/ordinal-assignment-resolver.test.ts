/**
 * Tests for OrdinalAssignmentResolver.
 * Run: node --test dist/ordinal-assignment-resolver.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { OrdinalAssignmentResolver } from "./ordinal-assignment-resolver.js";
import { BlueprintRegistryService, WORKSPACE_PACKAGE_NODES } from "@ada/ent";

test("OrdinalAssignmentResolver: buildMapping returns 10 assignments with C3 unresolved", () => {
  const resolver = new OrdinalAssignmentResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();

  const mapping = resolver.buildMapping(registry, WORKSPACE_PACKAGE_NODES);

  assert.equal(mapping.assignmentCount, 10);
  assert.equal(mapping.assignments.length, 10);
  assert.equal(
    mapping.isTotal,
    false,
    "mapping must not be total before C3 resolution",
  );

  const unresolved = mapping.assignments.filter((a) => !a.isResolved);
  assert.equal(unresolved.length, 1, "exactly 1 unresolved expected (C3)");
  assert.equal(
    unresolved[0]!.componentOrdinal,
    3,
    "only ordinal 3 may be unresolved",
  );
});

test("OrdinalAssignmentResolver: detectC3Gap finds the C3 gap", () => {
  const resolver = new OrdinalAssignmentResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();

  const mapping = resolver.buildMapping(registry, WORKSPACE_PACKAGE_NODES);
  const gap = resolver.detectC3Gap(mapping);

  assert.ok(gap !== null, "C3 gap must be detected");
  assert.equal(gap!.componentOrdinal, 3);
  assert.equal(gap!.isResolved, false);
  assert.equal(gap!.resolvedPackage, null);
});

test("OrdinalAssignmentResolver: detectC3Gap returns null when fully resolved", () => {
  const resolver = new OrdinalAssignmentResolver();
  const mapping = resolver.resolveFullMapping();
  const gap = resolver.detectC3Gap(mapping);
  assert.equal(gap, null, "no gap after full resolution");
});

test("OrdinalAssignmentResolver: collapseC3Gap resolves to elicitation", () => {
  const resolver = new OrdinalAssignmentResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();

  const mapping = resolver.buildMapping(registry, WORKSPACE_PACKAGE_NODES);
  const gap = resolver.detectC3Gap(mapping)!;
  const assignment = resolver.collapseC3Gap(gap, WORKSPACE_PACKAGE_NODES);

  assert.equal(assignment.componentOrdinal, 3);
  assert.equal(assignment.isResolved, true);
  assert.equal(assignment.targetPackage, "elicitation");
  assert.ok(assignment.provenanceRecordPostcode !== null);
  assert.ok(assignment.provenanceRecordPostcode!.length > 0);
});

test("OrdinalAssignmentResolver: resolveFullMapping produces total mapping", () => {
  const resolver = new OrdinalAssignmentResolver();
  const mapping = resolver.resolveFullMapping();

  assert.equal(mapping.isTotal, true, "mapping must be total after resolution");
  assert.equal(mapping.assignmentCount, 10);
  assert.equal(mapping.assignments.length, 10);
  assert.ok(mapping.postcode !== null && mapping.postcode.length > 0);

  for (const a of mapping.assignments) {
    assert.equal(
      a.isResolved,
      true,
      `assignment ordinal ${a.componentOrdinal} must be resolved`,
    );
    assert.ok(
      a.provenanceRecordPostcode !== null &&
        a.provenanceRecordPostcode.length > 0,
      `assignment ordinal ${a.componentOrdinal} must have provenanceRecordPostcode`,
    );
  }
});

test("OrdinalAssignmentResolver: assertMappingTotality passes for total mapping", () => {
  const resolver = new OrdinalAssignmentResolver();
  const mapping = resolver.resolveFullMapping();
  assert.equal(resolver.assertMappingTotality(mapping), true);
});

test("OrdinalAssignmentResolver: assertMappingTotality throws for partial mapping", () => {
  const resolver = new OrdinalAssignmentResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  const mapping = resolver.buildMapping(registry, WORKSPACE_PACKAGE_NODES);

  assert.throws(
    () => resolver.assertMappingTotality(mapping),
    /isTotal must be true/,
  );
});

test("OrdinalAssignmentResolver: getAssignment returns assignment after buildMapping", () => {
  const resolver = new OrdinalAssignmentResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  resolver.buildMapping(registry, WORKSPACE_PACKAGE_NODES);

  const assignment = resolver.getAssignment(1);
  assert.ok(assignment !== null, "assignment for ordinal 1 must exist");
  assert.equal(assignment!.componentOrdinal, 1);
});

test("OrdinalAssignmentResolver: getGapState returns open before resolution", () => {
  const resolver = new OrdinalAssignmentResolver();
  const state = resolver.getGapState();
  assert.equal(state, "open");
});

test("OrdinalAssignmentResolver: getGapState returns resolved after collapseC3Gap", () => {
  const resolver = new OrdinalAssignmentResolver();
  const svc = new BlueprintRegistryService();
  const registry = svc.getRegistry();
  const mapping = resolver.buildMapping(registry, WORKSPACE_PACKAGE_NODES);
  const gap = resolver.detectC3Gap(mapping)!;
  resolver.collapseC3Gap(gap, WORKSPACE_PACKAGE_NODES);

  const state = resolver.getGapState();
  assert.equal(state, "resolved");
});
