import type { PipelineRun, RunArtifact, AggregateEntropy } from "../types.js";
import { PipelineError } from "../types.js";
import type { PipelineStore } from "../store.js";
import type { DisambiguationPassExecutor } from "./DisambiguationPassExecutor.js";
import type { RunArtifactProducer } from "./RunArtifactProducer.js";
import type { AmbiguitySetLoader } from "../int-resolution/AmbiguitySetLoader.js";
import type { AggregateEntropyCalculator } from "../int-resolution/AggregateEntropyCalculator.js";

const PASS_2_ORDINAL = 2;

/**
 * Resolves the prior run by ID, manages PipelineRun lifecycle, and orchestrates
 * the top-level disambiguation pass workflow.
 *
 * Invariants enforced:
 *   - pipelineRun.runId non-empty
 *   - pipelineRun.version non-empty
 *   - pipelineRun.aggregateEntropy in [0,1]
 *   - pipelineRun.passOrdinal >= 1
 *   - pipelineRun.stage non-null
 *   - C1: never mutates prior run ML.INT.01d32819/v1
 *   - C2: prior run resolved exclusively by runId string
 */
export class PipelineRunManager {
  constructor(
    private readonly store: PipelineStore,
    private readonly passExecutor: DisambiguationPassExecutor,
    private readonly artifactProducer: RunArtifactProducer,
    private readonly ambiguitySetLoader: AmbiguitySetLoader,
    private readonly entropyCalculator: AggregateEntropyCalculator,
  ) {}

  // ─── C2: resolve by run ID only (no direct artifact reference) ───────────

  resolveRunById(runId: string): PipelineRun {
    if (!runId || runId.length === 0) {
      throw new PipelineError("NOT_FOUND", "runId must be non-empty");
    }

    const run = this.store.getRun(runId);
    if (run === undefined) {
      throw new PipelineError(
        "NOT_FOUND",
        `PipelineRun not found for runId=${runId}; run was never persisted or ID is malformed`,
      );
    }

    // Validate integrity of required fields
    if (run.aggregateEntropy === undefined || run.aggregateEntropy === null) {
      throw new PipelineError(
        "DATA_INTEGRITY",
        `PipelineRun ${runId} has missing aggregateEntropy field; blocking pass creation`,
      );
    }

    this.assertRunInvariants(run);
    return run;
  }

  // ─── Initialize new run ───────────────────────────────────────────────────

  initializeNewRun(parentRunId: string, passOrdinal: number): PipelineRun {
    const parentRun = this.resolveRunById(parentRunId);

    // Derive version: parent version + ".2"
    const version = `${parentRun.version}.2`;
    const runId = `ML.INT.${this.store.newId().slice(0, 8)}/v2`;

    const run: PipelineRun = {
      runId,
      version,
      aggregateEntropy: 0,
      passOrdinal,
      stage: "INT",
      state: "INITIALIZING",
      parentRunId,
    };

    this.assertRunInvariants(run);
    this.store.upsertRun(run);

    return run;
  }

  // ─── State transition ──────────────────────────────────────────────────────

  transitionRunState(
    runId: string,
    targetState: PipelineRun["state"],
  ): PipelineRun {
    const run = this.store.getRun(runId);
    if (run === undefined) {
      throw new PipelineError("NOT_FOUND", `Run not found: ${runId}`);
    }
    if (this.store.isPriorRun(runId)) {
      throw new PipelineError(
        "STATELESS_VIOLATION",
        "Cannot transition state of prior run ML.INT.01d32819/v1",
      );
    }
    run.state = targetState;
    this.store.upsertRun(run);
    return run;
  }

  // ─── Execute disambiguation workflow ─────────────────────────────────────

  executeDisambiguationWorkflow(sourceRunId: string): RunArtifact {
    // Step 1: Resolve prior run by ID (C2 — no artifact reference)
    console.log(
      `[PipelineRunManager] resolve-prior-run-by-id: sourceRunId=${sourceRunId}`,
    );
    const priorRun = this.resolveRunById(sourceRunId);

    // Verify prior run metadata
    if (priorRun.stage !== "INT") {
      throw new PipelineError(
        "NOT_FOUND",
        `Prior run stage must be INT; got ${priorRun.stage}`,
      );
    }
    if (priorRun.passOrdinal !== 1) {
      throw new PipelineError(
        "NOT_FOUND",
        `Prior run passOrdinal must be 1; got ${priorRun.passOrdinal}`,
      );
    }
    console.log(
      `[PipelineRunManager] Prior run: stage=${priorRun.stage}, passOrdinal=${priorRun.passOrdinal}, aggregateEntropy=${priorRun.aggregateEntropy}`,
    );

    // Step 2: Hydrate ambiguity set
    console.log(
      `[PipelineRunManager] hydrate-ambiguity-set: sourceRunId=${sourceRunId}`,
    );
    const ambiguitySet = this.ambiguitySetLoader.loadAmbiguitySet(sourceRunId);
    console.log(
      `[PipelineRunManager] AmbiguitySet hydrated: entityCount=${ambiguitySet.entityCount}, setId=${ambiguitySet.setId}`,
    );

    // Step 3: Initialize new run (INITIALIZING)
    const newRun = this.initializeNewRun(sourceRunId, PASS_2_ORDINAL);
    this.transitionRunState(newRun.runId, "RUNNING");
    console.log(
      `[PipelineRunManager] New run initialized: runId=${newRun.runId}, version=${newRun.version}`,
    );

    // Step 4: Create disambiguation pass record
    console.log(
      `[PipelineRunManager] create-disambiguation-pass-record: ordinal=${PASS_2_ORDINAL}`,
    );
    const pass = this.passExecutor.createPass(
      sourceRunId,
      ambiguitySet.setId,
      PASS_2_ORDINAL,
    );
    console.log(
      `[PipelineRunManager] DisambiguationPass created: passId=${pass.passId}, state=${pass.state}`,
    );

    // Step 5: Execute integration mapping resolution
    console.log(`[PipelineRunManager] execute-integration-mapping-resolution`);
    let passResult;
    try {
      passResult = this.passExecutor.executePass(pass.passId);
    } catch (err) {
      // Rollback: delete new run record; reset pass to FAILED already done in executor
      this.store.deleteRun(newRun.runId);
      throw err;
    }
    console.log(
      `[PipelineRunManager] Pass executed: conflictsResolved=${passResult.conflictsResolved}`,
    );

    // Step 6: Filter bindings already performed inside INTStageController
    // Step 7: Compute aggregate entropy on final retained bindings
    console.log(`[PipelineRunManager] compute-aggregate-entropy`);
    const aggregateEntropy: AggregateEntropy =
      this.entropyCalculator.computeAggregateEntropy(
        passResult.bindings,
        newRun.runId,
      );
    console.log(
      `[PipelineRunManager] AggregateEntropy: value=${aggregateEntropy.value.toFixed(4)}, satisfiesConstraint=${aggregateEntropy.satisfiesConstraint}`,
    );

    if (!aggregateEntropy.satisfiesConstraint) {
      this.transitionRunState(newRun.runId, "FAILED");
      throw new PipelineError(
        "G4_FAILED",
        `Aggregate entropy ${aggregateEntropy.value} does not satisfy constraint <= 0.30`,
      );
    }

    // Update run with final aggregate entropy
    newRun.aggregateEntropy = aggregateEntropy.value;
    this.store.upsertRun(newRun);

    // Step 8: Produce versioned run artifact
    console.log(`[PipelineRunManager] produce-versioned-run-artifact`);
    const resolvedBindingIds = passResult.bindings.map((b) => b.bindingId);

    let artifact: RunArtifact;
    try {
      artifact = this.artifactProducer.produceArtifact(
        newRun.runId,
        sourceRunId,
        resolvedBindingIds,
      );
    } catch (err) {
      // ARTIFACT_WRITE_FAILURE: rollback PipelineRun, set pass to FAILED
      this.store.deleteRun(newRun.runId);
      const storedPass = this.store.getPass(pass.passId);
      if (storedPass) {
        storedPass.state = "FAILED";
        this.store.putPass(storedPass);
      }
      throw err;
    }

    // Update pass: set producedRunId, transition to COMPLETED
    const storedPass = this.store.getPass(pass.passId);
    if (storedPass) {
      storedPass.producedRunId = newRun.runId;
      storedPass.state = "COMPLETED";
      storedPass.appliedToStageRunId = sourceRunId;
      this.store.putPass(storedPass);
    }

    // Transition run to COMPLETED
    this.transitionRunState(newRun.runId, "COMPLETED");

    console.log(
      `[PipelineRunManager] produce-versioned-run-artifact: runId=${artifact.runId}, parentRunId=${artifact.parentRunId}, bindingCount=${artifact.resolvedBindingIds.length}`,
    );

    // Verify prior run was not mutated (stateless contract)
    const priorRunCheck = this.store.getRun(sourceRunId);
    if (
      priorRunCheck &&
      priorRunCheck.aggregateEntropy !== priorRun.aggregateEntropy
    ) {
      this.transitionRunState(newRun.runId, "TAINTED");
      throw new PipelineError(
        "STATELESS_VIOLATION_DETECTED",
        `Prior run ${sourceRunId} was mutated; TAINTED artifact. Quarantine and abort.`,
      );
    }

    return artifact;
  }

  private assertRunInvariants(run: PipelineRun): void {
    if (!run.runId || run.runId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "PipelineRun.runId must be non-empty",
      );
    }
    if (!run.version || run.version.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "PipelineRun.version must be non-empty",
      );
    }
    if (run.aggregateEntropy < 0 || run.aggregateEntropy > 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `PipelineRun.aggregateEntropy=${run.aggregateEntropy} out of [0,1]`,
      );
    }
    if (run.passOrdinal < 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "PipelineRun.passOrdinal must be >= 1",
      );
    }
    if (run.stage === null || run.stage === undefined) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "PipelineRun.stage must be non-null",
      );
    }
  }
}
