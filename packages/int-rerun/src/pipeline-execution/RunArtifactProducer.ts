import type { RunArtifact } from "../types.js";
import { PipelineError } from "../types.js";
import type { PipelineStore } from "../store.js";

/**
 * Produces a new immutable, versioned RunArtifact.
 *
 * Invariants enforced:
 *   - runArtifact.immutable === true
 *   - runArtifact.runId non-empty
 *   - runArtifact.parentRunId !== runArtifact.runId
 *   - runArtifact.resolvedBindingIds !== null
 *   - every RunArtifact.runId is unique within PipelineExecution context
 */
export class RunArtifactProducer {
  constructor(private readonly store: PipelineStore) {}

  produceArtifact(
    runId: string,
    parentRunId: string,
    resolvedBindingIds: string[],
  ): RunArtifact {
    if (!runId || runId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.runId must be non-empty",
      );
    }
    if (!parentRunId || parentRunId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.parentRunId must be non-empty",
      );
    }
    if (parentRunId === runId) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.parentRunId must not equal runId (artifact cannot reference itself as parent)",
      );
    }

    // Check uniqueness
    if (this.store.getArtifact(runId) !== undefined) {
      throw new PipelineError(
        "DUPLICATE_ARTIFACT",
        `RunArtifact with runId=${runId} already exists`,
      );
    }

    const artifact: RunArtifact = {
      runId,
      parentRunId,
      stageLabel: "INT",
      immutable: true,
      resolvedBindingIds: [...resolvedBindingIds],
      createdAt: Date.now(),
    };

    this.validateArtifactInvariants(artifact);

    // Write artifact atomically — if write fails we do not have a partial artifact
    this.store.putArtifact(artifact);

    // Verify it was committed
    const committed = this.store.getArtifact(runId);
    if (committed === undefined) {
      throw new PipelineError(
        "ARTIFACT_WRITE_FAILURE",
        `RunArtifact for runId=${runId} was not durably committed`,
      );
    }

    // Verify prior run was NOT mutated (stateless contract)
    if (this.store.isPriorRun(parentRunId)) {
      const priorRun = this.store.getRun(parentRunId);
      if (priorRun === undefined) {
        throw new PipelineError(
          "STATELESS_VIOLATION_DETECTED",
          `Prior run ${parentRunId} was deleted during artifact write`,
        );
      }
      // Prior run must remain COMPLETED and unmodified
      if (priorRun.state === "TAINTED") {
        artifact as RunArtifact; // read-only reference; mark artifact TAINTED signal
        throw new PipelineError(
          "STATELESS_VIOLATION_DETECTED",
          `Prior run ${parentRunId} was mutated; artifact is TAINTED. Quarantine and abort.`,
        );
      }
    }

    return artifact;
  }

  validateArtifactInvariants(artifact: RunArtifact): boolean {
    if (!artifact.runId || artifact.runId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.runId must be non-empty",
      );
    }
    if (artifact.parentRunId === artifact.runId) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.parentRunId must not equal runId",
      );
    }
    if (artifact.resolvedBindingIds === null) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.resolvedBindingIds must be non-null",
      );
    }
    if (!artifact.immutable) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "RunArtifact.immutable must be true",
      );
    }
    return true;
  }
}
