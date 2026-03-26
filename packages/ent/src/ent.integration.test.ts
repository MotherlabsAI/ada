/**
 * Integration test for the ENT-stage pipeline.
 * Asserts all postconditions from the ENT-stage-integration and
 * unblock-stalled-pipeline-run workflows.
 *
 * Run: node --test dist/ent.integration.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runENTStage,
  BlueprintRegistryService,
  C3GapResolver,
  ComponentPackageMappingService,
  PipelineRunManager,
  ProvenanceRecordWriter,
  EntityRegistrationService,
  ProvenanceChainValidator,
  ENTGateEvaluator,
  WORKSPACE_PACKAGES,
} from "./index.js";
import { WORKSPACE_PACKAGE_NODES } from "./ComponentPackageMappingService.js";

// ─── BlueprintRegistryLoader ───────────────────────────────────────────────────

test("Step 1 — BlueprintRegistryLoader: loads 10 NamedBlueprintComponents", () => {
  const svc = new BlueprintRegistryService();
  const reg = svc.getRegistry();

  assert.equal(reg.totalComponentCount, 10, "totalComponentCount must be 10");
  assert.equal(reg.components.length, 10, "components.length must be 10");
  assert.ok(reg.pipelineRunId.length > 0, "pipelineRunId must be non-empty");
  assert.ok(reg.postcode.length > 0, "postcode must be non-empty");

  // All ordinals 1–10 are present and unique
  const ordinals = reg.components.map((c) => c.ordinal).sort((a, b) => a - b);
  assert.deepEqual(ordinals, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // Each component has required fields
  for (const c of reg.components) {
    assert.ok(
      c.componentId.length > 0,
      `comp-${c.ordinal}: componentId missing`,
    );
    assert.ok(c.registryId.length > 0, `comp-${c.ordinal}: registryId missing`);
    assert.ok(c.name.length > 0, `comp-${c.ordinal}: name missing`);
    assert.ok(
      c.responsibility.length > 0,
      `comp-${c.ordinal}: responsibility missing`,
    );
    assert.ok(
      c.boundedContext.length > 0,
      `comp-${c.ordinal}: boundedContext missing`,
    );
  }
});

test("Step 1 — BlueprintRegistryLoader: ENTStageIntegrationSpec invariants", () => {
  // The spec is encoded in the registry constants — assert them directly
  const svc = new BlueprintRegistryService();
  const reg = svc.getRegistry();

  assert.equal(
    reg.totalComponentCount,
    10,
    "declaredComponentCount must be 10",
  );

  // 8 workspace packages
  assert.equal(WORKSPACE_PACKAGES.length, 8, "declaredPackageCount must be 8");

  // C3 gap at ordinal 3
  const c3 = reg.components.find((c) => c.ordinal === 3);
  assert.ok(c3, "ordinal 3 component must exist");
  assert.equal(
    c3!.assignedPackage,
    null,
    "C3 component must have null assignedPackage initially",
  );
});

// ─── C3GapResolver ────────────────────────────────────────────────────────────

test("Step 2 — C3GapResolver: resolves ordinal-3 gap to elicitation", () => {
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);

  const resolved = resolver.resolve();

  assert.equal(resolved.componentOrdinal, 3, "gap.componentOrdinal must be 3");
  assert.equal(resolved.isResolved, true, "gap must be resolved");
  assert.equal(
    resolved.resolvedPackage,
    "elicitation",
    "C3 must resolve to elicitation",
  );
  assert.equal(resolved.state, "resolved");
  assert.ok(
    resolved.resolutionProvenancePostcode !== null &&
      resolved.resolutionProvenancePostcode.length > 0,
    "resolutionProvenancePostcode must be non-null",
  );
  assert.ok(
    resolved.componentId.length > 0,
    "gap.componentId must be non-empty",
  );
});

test("Step 2 — C3GapResolver: C3AssignmentGap invariants", () => {
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);
  const gap = resolver.getGap();

  // OPEN state invariants
  assert.equal(gap.componentOrdinal, 3);
  assert.equal(gap.isResolved, false);
  assert.equal(
    gap.resolvedPackage,
    null,
    "unresolved gap must not claim a resolved package",
  );
  assert.equal(gap.resolutionProvenancePostcode, null);
  assert.ok(gap.componentId.length > 0);

  const resolved = resolver.resolve();
  // RESOLVED state invariants
  assert.equal(resolved.isResolved, true);
  assert.notEqual(resolved.resolvedPackage, null);
  assert.notEqual(resolved.resolutionProvenancePostcode, null);
});

// ─── ComponentPackageMapper ───────────────────────────────────────────────────

test("Step 3 — ComponentPackageMapper: builds initial mapping with C3 unresolved", () => {
  const svc = new BlueprintRegistryService();
  const mappingSvc = new ComponentPackageMappingService();
  const components = svc.enumerateComponents();
  const mapping = mappingSvc.buildInitialMapping(
    components,
    WORKSPACE_PACKAGE_NODES,
  );

  assert.equal(mapping.assignmentCount, 10);
  assert.equal(mapping.assignments.length, 10);
  assert.equal(
    mapping.isTotal,
    false,
    "mapping must not be total before C3 resolution",
  );

  const unresolved = mapping.assignments.filter((a) => !a.isResolved);
  assert.equal(
    unresolved.length,
    1,
    "exactly 1 unresolved assignment expected (C3)",
  );
  assert.equal(
    unresolved[0]!.componentOrdinal,
    3,
    "only ordinal 3 may be unresolved",
  );
});

test("Step 3 — ComponentPackageMapper: after C3 resolution, mapping is total with 8 distinct packages", () => {
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);
  const mappingSvc = new ComponentPackageMappingService();
  const provenanceWriter = new ProvenanceRecordWriter();

  const components = svc.enumerateComponents();
  let mapping = mappingSvc.buildInitialMapping(
    components,
    WORKSPACE_PACKAGE_NODES,
  );
  const resolvedGap = resolver.resolve();
  mapping = mappingSvc.applyC3Resolution(mapping, resolvedGap);
  mapping = mappingSvc.finalizeMapping(mapping);

  // Stamp postcodes
  const postcodeMap = new Map<string, string>();
  for (const assignment of mapping.assignments) {
    if (assignment.componentOrdinal === 3) {
      postcodeMap.set(
        assignment.componentId,
        resolvedGap.resolutionProvenancePostcode!,
      );
    } else {
      const rec = provenanceWriter.writeRecord(
        "ASSIGNMENT_CONFIRMED",
        assignment.componentId,
        "ENT",
        [],
      );
      postcodeMap.set(assignment.componentId, rec.postcode);
    }
  }
  mapping = mappingSvc.stampProvenancePostcodes(mapping, postcodeMap);

  // ComponentPackageMapping invariants
  assert.equal(mapping.isTotal, true, "mapping.isTotal must be true");
  assert.equal(mapping.assignmentCount, 10);
  assert.equal(mapping.assignments.length, 10);
  assert.ok(
    mapping.postcode !== null && mapping.postcode.length > 0,
    "total mapping must have postcode",
  );

  const distinctPackages = new Set(
    mapping.assignments.map((a) => a.targetPackage),
  );
  assert.equal(
    distinctPackages.size,
    8,
    "exactly 8 distinct packages required",
  );

  // All assignments resolved with provenance
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

// ─── EntityRegistrar ──────────────────────────────────────────────────────────

test("Step 4 — EntityRegistrar: produces EntityMap with entityCount >= 10", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);
  const mappingSvc = new ComponentPackageMappingService();

  const components = svc.enumerateComponents();
  let mapping = mappingSvc.buildInitialMapping(
    components,
    WORKSPACE_PACKAGE_NODES,
  );
  const resolvedGap = resolver.resolve();
  mapping = mappingSvc.applyC3Resolution(mapping, resolvedGap);
  mapping = mappingSvc.finalizeMapping(mapping);

  const postcodeMap = new Map<string, string>();
  for (const a of mapping.assignments) {
    if (a.componentOrdinal === 3) {
      postcodeMap.set(a.componentId, resolvedGap.resolutionProvenancePostcode!);
    } else {
      const rec = provenanceWriter.writeRecord(
        "ASSIGNMENT_CONFIRMED",
        a.componentId,
        "ENT",
        [],
      );
      postcodeMap.set(a.componentId, rec.postcode);
    }
  }
  mapping = mappingSvc.stampProvenancePostcodes(mapping, postcodeMap);

  const entitySvc = new EntityRegistrationService(provenanceWriter);
  const registrations = entitySvc.extractEntitiesFromMapping(mapping);
  const entityCount = entitySvc.registerToEntityMap(
    registrations,
    "ML.ENT.e80e3c97/v1",
  );

  assert.ok(entityCount >= 10, `entityCount must be >= 10, got ${entityCount}`);

  const entityMap = entitySvc.getEntityMap();
  assert.equal(
    entityMap.entityCount,
    entityCount,
    "entityMap.entityCount must match return value",
  );
  assert.equal(
    entityMap.entities.length,
    entityCount,
    "entities.length must equal entityCount",
  );
  assert.ok(entityMap.postcode.length > 0, "EntityMap must have a postcode");
  assert.ok(
    entityMap.pipelineRunId.length > 0,
    "EntityMap must be bound to a pipelineRunId",
  );

  // ENTEntityRegistration invariants
  for (const reg of registrations) {
    assert.equal(reg.targetRegistryType, "EntityMap");
    assert.ok(
      reg.provenanceRecordPostcode.length > 0,
      "registration must have provenance postcode",
    );
    assert.ok(
      reg.entityMapPostcode.length > 0,
      "registration must reference EntityMap",
    );
    assert.ok(
      reg.sourceComponentId.length > 0,
      "registration must trace to a source component",
    );
    assert.ok(
      reg.registeredAt > 0,
      "registeredAt must be a positive epoch value",
    );
  }
});

// ─── ProvenanceChainValidator ─────────────────────────────────────────────────

test("Step 5 — ProvenanceChainValidator: all 10 chains are intact with 3 hops each", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);
  const mappingSvc = new ComponentPackageMappingService();

  const components = svc.enumerateComponents();
  let mapping = mappingSvc.buildInitialMapping(
    components,
    WORKSPACE_PACKAGE_NODES,
  );
  const resolvedGap = resolver.resolve();
  mapping = mappingSvc.applyC3Resolution(mapping, resolvedGap);
  mapping = mappingSvc.finalizeMapping(mapping);
  const postcodeMap = new Map<string, string>();
  for (const a of mapping.assignments) {
    if (a.componentOrdinal === 3) {
      postcodeMap.set(a.componentId, resolvedGap.resolutionProvenancePostcode!);
    } else {
      const rec = provenanceWriter.writeRecord(
        "ASSIGNMENT_CONFIRMED",
        a.componentId,
        "ENT",
        [],
      );
      postcodeMap.set(a.componentId, rec.postcode);
    }
  }
  mapping = mappingSvc.stampProvenancePostcodes(mapping, postcodeMap);

  const chainValidator = new ProvenanceChainValidator(provenanceWriter);
  const { chains, allIntact } = chainValidator.validateAllChains(mapping);

  assert.equal(chains.length, 10, "exactly 10 chains required");
  assert.equal(allIntact, true, "all chains must be intact");

  for (const chain of chains) {
    assert.equal(
      chain.hopCount,
      3,
      `chain ${chain.chainId} must have hopCount=3`,
    );
    assert.equal(chain.hops.length, 3);
    assert.equal(chain.provenanceIntact, true);
    assert.ok(
      chain.postcode !== null && chain.postcode.length > 0,
      "intact chain must have postcode",
    );
    assert.ok(chain.componentId.length > 0);

    // Hop ordinal order
    assert.equal(chain.hops[0].hopIndex, 0);
    assert.equal(chain.hops[1].hopIndex, 1);
    assert.equal(chain.hops[2].hopIndex, 2);

    for (const hop of chain.hops) {
      assert.equal(hop.isTraced, true, `hop ${hop.hopIndex} must be traced`);
      assert.ok(
        hop.provenanceRecordPostcode !== null &&
          hop.provenanceRecordPostcode.length > 0,
        `traced hop ${hop.hopIndex} must have provenanceRecordPostcode`,
      );
      assert.ok(hop.fromLabel.length > 0);
      assert.ok(hop.toLabel.length > 0);
      assert.ok(hop.chainId.length > 0);
    }
  }
});

// ─── ENTGateEvaluator ─────────────────────────────────────────────────────────

test("Step 6 — ENTGateEvaluator: gate passes when all conditions met", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const gateEvaluator = new ENTGateEvaluator(provenanceWriter);
  const gate = gateEvaluator.evaluateGate(10, true, true, "ML.ENT.e80e3c97/v1");

  assert.equal(gate.passed, true);
  assert.equal(gate.entityCount, 10);
  assert.equal(gate.provenanceIntact, true);
  assert.equal(gate.allBlockersCleared, true);
  assert.ok(gate.evaluatedAt !== null && gate.evaluatedAt > 0);
  assert.ok(
    gate.governorDecisionPostcode !== null &&
      gate.governorDecisionPostcode.length > 0,
  );
  assert.equal(gate.state, "passed");
  assert.ok(gate.pipelineRunId.length > 0);
  assert.ok(gate.entityCount >= 0);
});

test("Step 6 — ENTGateEvaluator: gate fails when entityCount=0", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const gateEvaluator = new ENTGateEvaluator(provenanceWriter);
  const gate = gateEvaluator.evaluateGate(0, true, true, "ML.ENT.e80e3c97/v1");

  assert.equal(gate.passed, false, "gate must fail with entityCount=0");
  assert.equal(gate.state, "failed");
  assert.equal(gate.governorDecisionPostcode, null);
});

test("Step 6 — ENTGateEvaluator: gate fails when provenanceIntact=false", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const gateEvaluator = new ENTGateEvaluator(provenanceWriter);
  const gate = gateEvaluator.evaluateGate(
    10,
    false,
    true,
    "ML.ENT.e80e3c97/v1",
  );

  assert.equal(
    gate.passed,
    false,
    "gate must fail with provenanceIntact=false",
  );
});

test("Step 6 — ENTGateEvaluator: gate fails when blockers not cleared", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const gateEvaluator = new ENTGateEvaluator(provenanceWriter);
  const gate = gateEvaluator.evaluateGate(
    10,
    true,
    false,
    "ML.ENT.e80e3c97/v1",
  );

  assert.equal(
    gate.passed,
    false,
    "gate must fail when allBlockersCleared=false",
  );
});

test("Step 6 — ENTGateEvaluator: ENTGateRecord invariants — unevaluated gate cannot have passed", () => {
  const provenanceWriter = new ProvenanceRecordWriter();
  const gateEvaluator = new ENTGateEvaluator(provenanceWriter);
  const pendingGate = gateEvaluator.getGate();

  assert.equal(
    pendingGate.passed,
    false,
    "unevaluated gate cannot have passed",
  );
  assert.equal(pendingGate.evaluatedAt, null);
  assert.equal(pendingGate.state, "pending");
});

// ─── StalledRunResumer ────────────────────────────────────────────────────────

test("Step 7 — StalledRunResumer: stalled run ML.ENT.e80e3c97/v1 has 1 blocker at ENT stage", () => {
  const runManager = new PipelineRunManager();
  const run = runManager.loadStalledRun("ML.ENT.e80e3c97/v1");

  assert.equal(run.runId, "ML.ENT.e80e3c97/v1");
  assert.equal(run.stage, "ENT");
  assert.equal(run.blockerCount, 1);
  assert.equal(run.blockers.length, 1);

  const blocker = run.blockers[0]!;
  assert.equal(blocker.isCleared, false);
  assert.equal(blocker.clearedAt, null);
  assert.equal(blocker.clearanceProvenancePostcode, null);
  assert.ok(blocker.linkedGapId.length > 0);
  assert.ok(blocker.pipelineRunId.length > 0);
});

test("Step 7 — StalledRunResumer: after clearC3Blocker, blockerCount=0 and run is resumable", () => {
  const svc = new BlueprintRegistryService();
  const resolver = new C3GapResolver(svc);
  const resolvedGap = resolver.resolve();
  const runManager = new PipelineRunManager();
  runManager.loadStalledRun("ML.ENT.e80e3c97/v1");
  const updatedRun = runManager.clearC3Blocker(
    resolvedGap.resolutionProvenancePostcode!,
  );

  // StalledPipelineRun invariants after clearance
  assert.equal(updatedRun.blockerCount, 0);
  assert.equal(
    updatedRun.blockers.every((b) => b.isCleared),
    true,
  );

  const clearedBlocker = updatedRun.blockers[0]!;
  assert.equal(clearedBlocker.isCleared, true);
  assert.ok(clearedBlocker.clearedAt !== null && clearedBlocker.clearedAt > 0);
  assert.ok(
    clearedBlocker.clearanceProvenancePostcode !== null &&
      clearedBlocker.clearanceProvenancePostcode.length > 0,
  );
});

// ─── CodebaseIntegrityChecker ─────────────────────────────────────────────────

test("Step 8 — CodebaseIntegrityChecker: ProvenanceRecordWriter DAG has no cycles", () => {
  const writer = new ProvenanceRecordWriter();
  const r1 = writer.writeRecord("ACTION_A", "subject-1", "ENT", []);
  const r2 = writer.writeRecord("ACTION_B", "subject-2", "ENT", [r1.postcode]);
  const r3 = writer.writeRecord("ACTION_C", "subject-3", "ENT", [r2.postcode]);

  void r3;
  assert.equal(
    writer.validateNoUpstreamCycles(),
    true,
    "linear DAG must have no cycles",
  );
});

// ─── Full ENT Pipeline Integration ───────────────────────────────────────────

test("Full ENT pipeline: runENTStage() passes all postconditions", async () => {
  const result = await runENTStage();

  // Workflow-1 postconditions
  assert.equal(
    result.mappingIsTotal,
    true,
    "ComponentPackageMapping.isTotal must be true",
  );
  assert.equal(
    result.c3ResolvedPackage,
    "elicitation",
    "C3 must resolve to elicitation",
  );

  // Workflow-2 postconditions
  assert.ok(
    result.entityCount >= 10,
    `entityCount must be >= 10, got ${result.entityCount}`,
  );
  assert.equal(result.provenanceIntact, true, "provenanceIntact must be true");
  assert.equal(
    result.allBlockersCleared,
    true,
    "allBlockersCleared must be true",
  );

  // ENT gate postconditions
  assert.equal(result.gatePassed, true, "ENT gate must pass");
  assert.ok(
    result.governorDecisionPostcode !== null &&
      result.governorDecisionPostcode.length > 0,
    "governorDecisionPostcode must be non-null when gate passes",
  );
  assert.ok(
    result.evaluatedAt !== null && result.evaluatedAt > 0,
    "evaluatedAt must be set",
  );

  // Audit trail
  assert.ok(result.auditRecordCount > 0, "audit records must be written");
  assert.ok(
    result.reason.includes("ML.ENT.e80e3c97/v1"),
    "advancement reason must reference the pipeline run ID",
  );
});
