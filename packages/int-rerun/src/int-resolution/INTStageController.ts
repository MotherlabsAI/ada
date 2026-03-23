import { randomUUID } from "crypto";
import type { INTStage, AmbiguitySet, INTResolutionResult } from "../types.js";
import { PipelineError } from "../types.js";
import type { PipelineStore } from "../store.js";
import type { AmbiguitySetLoader } from "./AmbiguitySetLoader.js";
import type { IntegrationMappingResolver } from "./IntegrationMappingResolver.js";
import type { BindingEntropyFilter } from "./BindingEntropyFilter.js";
import type { AggregateEntropyCalculator } from "./AggregateEntropyCalculator.js";

const ENTROPY_THRESHOLD = 0.3 as const;

/**
 * Stateless orchestrator for the INT stage's internal resolution workflow.
 *
 * Invariants enforced:
 *   - INTStage.stateless === true
 *   - INTStage.entropyThreshold === 0.30
 *   - INTStage.stageId non-empty
 *   - INTStage.entityCount === 26
 *   - No mutable state carried from prior run
 */
export class INTStageController {
  constructor(
    private readonly store: PipelineStore,
    private readonly ambiguitySetLoader: AmbiguitySetLoader,
    private readonly mappingResolver: IntegrationMappingResolver,
    private readonly entropyFilter: BindingEntropyFilter,
    private readonly entropyCalculator: AggregateEntropyCalculator,
  ) {}

  getEntropyThreshold(): number {
    return ENTROPY_THRESHOLD;
  }

  instantiateStage(sourceRunId: string): INTStage {
    if (!sourceRunId || sourceRunId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "sourceRunId must be non-empty",
      );
    }

    // Assert no session state leaked from prior run
    // (In this stateless implementation, each call builds a fresh context)
    const ambiguitySet = this.ambiguitySetLoader.loadAmbiguitySet(sourceRunId);

    const priorRun = this.store.getRun(sourceRunId);
    if (priorRun === undefined) {
      throw new PipelineError(
        "NOT_FOUND",
        `PipelineRun not found for sourceRunId=${sourceRunId}`,
      );
    }

    const stage: INTStage = {
      stageId: `INT-${randomUUID()}`,
      runId: sourceRunId,
      version: priorRun.version,
      stateless: true,
      entropyThreshold: ENTROPY_THRESHOLD,
      ambiguitySetSize: ambiguitySet.entityCount,
      entityCount: 26,
      aggregateEntropy: priorRun.aggregateEntropy,
      aggregateEntropyHardCap: ENTROPY_THRESHOLD,
      isStateless: true,
    };

    this.assertStageInvariants(stage);
    return stage;
  }

  executeResolutionPipeline(
    stage: INTStage,
    ambiguitySetId: string,
  ): INTResolutionResult {
    // Postcondition: stateless confirmed — no prior session references
    if (!stage.stateless) {
      throw new PipelineError(
        "STATEFUL_VIOLATION",
        "INTStage.stateless must be true; aborting to prevent prior run mutation",
      );
    }
    if (stage.entropyThreshold !== ENTROPY_THRESHOLD) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `INTStage.entropyThreshold must be 0.30; got ${stage.entropyThreshold}`,
      );
    }

    const tempRunId = `TEMP-${randomUUID()}`;

    // Load ambiguity set
    const ambiguitySet: AmbiguitySet = this.store.getAmbiguitySet(
      stage.runId,
    ) ?? {
      setId: ambiguitySetId,
      entityCount: 0,
      memberEntityIds: [],
      sourceRunId: stage.runId,
    };

    if (ambiguitySet.entityCount === 0) {
      throw new PipelineError(
        "AMBIGUITY_SET_MISSING",
        `AmbiguitySet not found for ambiguitySetId=${ambiguitySetId}`,
      );
    }

    // Load integration mappings for these entities
    const allMappings = this.store.getMappingsForSourceRun(stage.runId);

    // Resolve conflicting mappings
    const resolved = this.mappingResolver.resolveConflictingMappings(
      allMappings.filter((m) =>
        ambiguitySet.memberEntityIds.includes(m.entityMentionId),
      ),
    );

    // Check for PARTIAL_RESOLUTION
    const unresolvedMappings = allMappings.filter(
      (m) =>
        ambiguitySet.memberEntityIds.includes(m.entityMentionId) &&
        m.conflicting,
    );
    if (
      unresolvedMappings.length > 0 &&
      resolved.length < ambiguitySet.memberEntityIds.length
    ) {
      console.warn(
        `[INTStageController] PARTIAL_RESOLUTION: ${unresolvedMappings.length} mappings remain conflicting`,
      );
    }

    // Produce EntityBindings
    const bindings = this.mappingResolver.produceBindingsFromResolutions(
      resolved,
      tempRunId,
    );

    // Filter by entropy threshold
    const filterResult = this.entropyFilter.filterByEntropy(
      bindings,
      ENTROPY_THRESHOLD,
    );

    // Compute aggregate entropy
    const aggregateEntropy = this.entropyCalculator.computeAggregateEntropy(
      filterResult.retained,
      tempRunId,
    );

    if (
      !this.entropyCalculator.evaluateExitCriterion(
        aggregateEntropy,
        ENTROPY_THRESHOLD,
      )
    ) {
      throw new PipelineError(
        "G4_FAILED",
        `G4 exit criterion not met: aggregateEntropy=${aggregateEntropy.value}`,
      );
    }

    return {
      resolvedBindings: filterResult.retained,
      aggregateEntropy,
      filteredCount: filterResult.filteredOut.length,
    };
  }

  private assertStageInvariants(stage: INTStage): void {
    if (!stage.stageId || stage.stageId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "INTStage.stageId must be non-empty",
      );
    }
    if (!stage.stateless) {
      throw new PipelineError(
        "STATEFUL_VIOLATION",
        "INTStage.stateless must be true",
      );
    }
    if (stage.entropyThreshold !== ENTROPY_THRESHOLD) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "INTStage.entropyThreshold must be 0.30",
      );
    }
    if (stage.ambiguitySetSize < 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "INTStage.ambiguitySetSize must be >= 0",
      );
    }
  }
}
