/**
 * ENT-stage integration pipeline runner.
 *
 * Executes two sequential workflows:
 *
 * Workflow 1 — ent-component-mapping-and-gap-resolution:
 *   Step 1. enumerate-blueprint-components
 *   Step 2. build-initial-component-package-mapping
 *   Step 3. resolve-c3-assignment-gap
 *   Step 4. finalize-mapping-and-clear-ent-blocker
 *
 * Workflow 2 — ent-entity-registration-provenance-validation-and-gate-passage:
 *   Step 5. extract-and-register-entities-from-mapping
 *   Step 6. validate-three-hop-provenance-chain
 *   Step 7. evaluate-ent-gate
 *   Step 8. write-audit-provenance-records-for-all-mapping-and-extraction-actions
 */

import { BlueprintRegistryService } from "./BlueprintRegistryService.js";
import { C3GapResolver } from "./C3GapResolver.js";
import {
  ComponentPackageMappingService,
  WORKSPACE_PACKAGE_NODES,
} from "./ComponentPackageMappingService.js";
import { PipelineRunManager } from "./PipelineRunManager.js";
import { ProvenanceRecordWriter } from "./ProvenanceRecordWriter.js";
import { EntityRegistrationService } from "./EntityRegistrationService.js";
import { ProvenanceChainValidator } from "./ProvenanceChainValidator.js";
import { ENTGateEvaluator } from "./ENTGateEvaluator.js";

export * from "./types.js";
export { BlueprintRegistryService } from "./BlueprintRegistryService.js";
export { C3GapResolver } from "./C3GapResolver.js";
export {
  ComponentPackageMappingService,
  WORKSPACE_PACKAGE_NODES,
} from "./ComponentPackageMappingService.js";
export { PipelineRunManager } from "./PipelineRunManager.js";
export { ProvenanceRecordWriter } from "./ProvenanceRecordWriter.js";
export { EntityRegistrationService } from "./EntityRegistrationService.js";
export { ProvenanceChainValidator } from "./ProvenanceChainValidator.js";
export { ENTGateEvaluator } from "./ENTGateEvaluator.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

export interface ENTStageResult {
  mappingIsTotal: boolean;
  entityCount: number;
  provenanceIntact: boolean;
  allBlockersCleared: boolean;
  gatePassed: boolean;
  governorDecisionPostcode: string | null;
  evaluatedAt: number | null;
  auditRecordCount: number;
  c3ResolvedPackage: string;
  reason: string;
}

export async function runENTStage(): Promise<ENTStageResult> {
  // ── Service instantiation ────────────────────────────────────────────────────
  const registryService = new BlueprintRegistryService();
  const c3Resolver = new C3GapResolver(registryService);
  const mappingService = new ComponentPackageMappingService();
  const runManager = new PipelineRunManager();
  const provenanceWriter = new ProvenanceRecordWriter();
  const entityService = new EntityRegistrationService(provenanceWriter);
  const chainValidator = new ProvenanceChainValidator(provenanceWriter);
  const gateEvaluator = new ENTGateEvaluator(provenanceWriter);

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW 1: ent-component-mapping-and-gap-resolution
  // ═══════════════════════════════════════════════════════════════════════════

  // Step 1 — enumerate-blueprint-components
  // Pre: registry has 10 components bound to pipelineRunId
  const components = registryService.enumerateComponents();
  provenanceWriter.writeRecord(
    "ENUMERATE_BLUEPRINT_COMPONENTS",
    registryService.getRegistry().registryId,
    "ENT",
    [],
  );

  // Step 2 — build-initial-component-package-mapping
  // Pre: 10 components + 8 packages enumerable
  let mapping = mappingService.buildInitialMapping(
    components,
    WORKSPACE_PACKAGE_NODES,
  );
  provenanceWriter.writeRecord(
    "BUILD_INITIAL_MAPPING",
    mapping.mappingId,
    "ENT",
    [registryService.getRegistry().postcode],
  );

  // Verify postcondition: 9 resolved, 1 unresolved (C3)
  const unresolvedAfterInitial = mapping.assignments.filter(
    (a) => !a.isResolved,
  );
  if (unresolvedAfterInitial.length !== 1) {
    throw new Error(
      `Expected exactly 1 unresolved assignment (C3) after initial mapping, ` +
        `got ${unresolvedAfterInitial.length}`,
    );
  }
  if (unresolvedAfterInitial[0]!.componentOrdinal !== 3) {
    throw new Error(
      `Only C3 (ordinal 3) may be unresolved, but ordinal ` +
        `${unresolvedAfterInitial[0]!.componentOrdinal} is unresolved`,
    );
  }

  // Step 3 — resolve-c3-assignment-gap
  // Pre: C3AssignmentGap.isResolved=false, candidatePackages non-empty
  const resolvedGap = c3Resolver.resolve();
  provenanceWriter.writeRecord(
    "RESOLVE_C3_ASSIGNMENT_GAP",
    resolvedGap.gapId,
    "ENT",
    [mapping.mappingId],
  );

  // Apply resolution to mapping
  mapping = mappingService.applyC3Resolution(mapping, resolvedGap);

  // Step 4 — finalize-mapping-and-clear-ent-blocker
  // Pre: all 10 resolved
  mapping = mappingService.finalizeMapping(mapping);

  // Stamp per-assignment provenance postcodes from gap resolution
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
        [mapping.postcode!],
      );
      postcodeMap.set(assignment.componentId, rec.postcode);
    }
  }
  mapping = mappingService.stampProvenancePostcodes(mapping, postcodeMap);

  // Clear the ENT blocker — run is now unblocked
  const stalledRun = runManager.loadStalledRun(PIPELINE_RUN_ID);
  const updatedRun = runManager.clearC3Blocker(
    resolvedGap.resolutionProvenancePostcode!,
  );
  provenanceWriter.writeRecord(
    "FINALIZE_MAPPING_CLEAR_BLOCKER",
    mapping.mappingId,
    "ENT",
    [mapping.postcode!],
  );

  // Verify workflow-1 postconditions
  if (!mapping.isTotal)
    throw new Error("POSTCONDITION FAILED: mapping.isTotal must be true");
  if (updatedRun.blockerCount !== 0)
    throw new Error(
      `POSTCONDITION FAILED: blockerCount must be 0, got ${updatedRun.blockerCount}`,
    );
  if (!updatedRun.resumable)
    throw new Error("POSTCONDITION FAILED: run.resumable must be true");

  void stalledRun; // consumed above

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW 2: ent-entity-registration-provenance-validation-and-gate-passage
  // ═══════════════════════════════════════════════════════════════════════════

  // Step 5 — extract-and-register-entities-from-mapping
  const registrations = entityService.extractEntitiesFromMapping(mapping);
  const entityCount = entityService.registerToEntityMap(
    registrations,
    PIPELINE_RUN_ID,
  );
  provenanceWriter.writeRecord(
    "EXTRACT_REGISTER_ENTITIES",
    entityService.getEntityMap().entityMapId,
    "ENT",
    [mapping.postcode!],
  );

  // Verify postcondition: entityCount >= 10
  if (entityCount < 10) {
    throw new Error(
      `POSTCONDITION FAILED: entityCount must be >= 10, got ${entityCount}`,
    );
  }

  // Step 6 — validate-three-hop-provenance-chain
  const { allIntact } = chainValidator.validateAllChains(mapping);
  const chains = chainValidator.getChains();
  const chainPostcodes = chains
    .filter((c) => c.postcode !== null)
    .map((c) => c.postcode!);
  provenanceWriter.writeRecord(
    "VALIDATE_PROVENANCE_CHAIN",
    `chain-summary-${PIPELINE_RUN_ID}`,
    "ENT",
    chainPostcodes,
  );

  if (!allIntact) {
    throw new Error(
      "POSTCONDITION FAILED: ProvenanceChainRecord.provenanceIntact must be true for all chains",
    );
  }

  // Step 7 — evaluate-ent-gate
  const allBlockersCleared = updatedRun.blockerCount === 0;
  const gate = gateEvaluator.evaluateGate(
    entityCount,
    allIntact,
    allBlockersCleared,
    PIPELINE_RUN_ID,
  );
  gateEvaluator.validateGateInvariants(gate);
  const advancement = gateEvaluator.advancePipelineRun(gate, updatedRun);

  if (!gate.passed) {
    throw new Error(`ENT gate evaluation FAILED: ${advancement.reason}`);
  }

  // Step 8 — write-audit-provenance-records for all remaining actions
  // (Most records were written inline during each step above.
  // This step validates the DAG is acyclic and emits a final seal record.)
  if (!provenanceWriter.validateNoUpstreamCycles()) {
    throw new Error(
      "AUDIT_CYCLE_DETECTED: upstream postcode chain contains a cycle — DAG invariant violated",
    );
  }

  const finalSeal = provenanceWriter.writeRecord(
    "AUDIT_TRAIL_SEALED",
    `audit-seal-${PIPELINE_RUN_ID}`,
    "ENT",
    [gate.governorDecisionPostcode!],
  );

  void finalSeal;

  return {
    mappingIsTotal: mapping.isTotal,
    entityCount,
    provenanceIntact: allIntact,
    allBlockersCleared,
    gatePassed: gate.passed,
    governorDecisionPostcode: gate.governorDecisionPostcode,
    evaluatedAt: gate.evaluatedAt,
    auditRecordCount: provenanceWriter.getAllRecords().length,
    c3ResolvedPackage: resolvedGap.resolvedPackage!,
    reason: advancement.reason,
  };
}

// Allow direct execution: `node dist/index.js`
if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].endsWith("index.js")
) {
  runENTStage()
    .then((result) => {
      console.log("[ENT] Pipeline stage result:");
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.gatePassed ? 0 : 1);
    })
    .catch((err: unknown) => {
      console.error("[ENT] Fatal error:", err);
      process.exit(1);
    });
}
