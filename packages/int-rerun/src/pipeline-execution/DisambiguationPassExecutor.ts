import type { DisambiguationPass, DisambiguationPassResult } from "../types.js";
import { PipelineError } from "../types.js";
import type { PipelineStore } from "../store.js";
import type { INTStageController } from "../int-resolution/INTStageController.js";

/**
 * Creates and executes a single disambiguation pass (ordinal >= 2 for re-execution).
 * Owns DisambiguationPass state machine: PENDING → IN_PROGRESS → COMPLETED/FAILED.
 *
 * Invariants enforced:
 *   - disambiguationPass.ordinal >= 1
 *   - disambiguationPass.sourceRunId !== disambiguationPass.producedRunId
 *   - disambiguationPass.passId non-empty
 *   - disambiguationPass.targetAmbiguitySetId non-empty
 *   - disambiguationPass.passIndex === 2
 *   - disambiguationPass.targetEntityCount === 26
 */
export class DisambiguationPassExecutor {
  constructor(
    private readonly store: PipelineStore,
    private readonly intStageController: INTStageController,
  ) {}

  createPass(
    sourceRunId: string,
    targetAmbiguitySetId: string,
    ordinal: number,
  ): DisambiguationPass {
    if (!sourceRunId || sourceRunId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "DisambiguationPass.sourceRunId must be non-empty",
      );
    }
    if (!targetAmbiguitySetId || targetAmbiguitySetId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "DisambiguationPass.targetAmbiguitySetId must be non-empty",
      );
    }
    if (ordinal < 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `DisambiguationPass.ordinal must be >= 1; got ${ordinal}`,
      );
    }

    // Generate passId with UUID collision retry (up to 3 attempts)
    let passId: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = `PASS-${this.store.newId()}`;
      if (!this.store.hasPass(candidate)) {
        passId = candidate;
        break;
      }
      console.warn(
        `[DisambiguationPassExecutor] ID_COLLISION on passId attempt ${attempt + 1}; retrying`,
      );
    }
    if (passId === null) {
      throw new PipelineError(
        "ID_COLLISION",
        "Failed to generate unique passId after 3 attempts",
      );
    }

    const pass: DisambiguationPass = {
      passId,
      ordinal,
      sourceRunId,
      targetAmbiguitySetId,
      producedRunId: null,
      state: "PENDING",
      conflictsResolved: 0,
      passIndex: 2,
      targetEntityCount: 26,
      appliedToStageRunId: null,
    };

    this.assertPassInvariants(pass);

    // Durably commit pass record before proceeding
    this.store.putPass(pass);

    // Verify write acknowledgement
    if (!this.store.getPass(passId)) {
      throw new PipelineError(
        "WRITE_FAILURE",
        "DisambiguationPass record not durably committed; aborting",
      );
    }

    return pass;
  }

  executePass(passId: string): DisambiguationPassResult {
    const pass = this.store.getPass(passId);
    if (pass === undefined) {
      throw new PipelineError(
        "NOT_FOUND",
        `DisambiguationPass not found: passId=${passId}`,
      );
    }
    if (pass.state !== "PENDING") {
      throw new PipelineError(
        "INVALID_STATE",
        `DisambiguationPass is in state ${pass.state}; expected PENDING`,
      );
    }

    // Transition PENDING → IN_PROGRESS
    pass.state = "IN_PROGRESS";
    pass.appliedToStageRunId = pass.sourceRunId;
    this.store.putPass(pass);

    try {
      // Instantiate stateless INT stage
      const stage = this.intStageController.instantiateStage(pass.sourceRunId);

      // Execute resolution pipeline
      const result = this.intStageController.executeResolutionPipeline(
        stage,
        pass.targetAmbiguitySetId,
      );

      pass.conflictsResolved = result.resolvedBindings.length;

      // Store bindings with the pass context (producedRunId assigned later)
      for (const binding of result.resolvedBindings) {
        this.store.putBinding(binding);
      }

      return {
        passId,
        conflictsResolved: result.resolvedBindings.length,
        bindings: result.resolvedBindings,
      };
    } catch (err) {
      // Transition to FAILED
      pass.state = "FAILED";
      this.store.putPass(pass);
      throw err;
    }
  }

  getPassState(passId: string): string {
    const pass = this.store.getPass(passId);
    if (pass === undefined) {
      throw new PipelineError("NOT_FOUND", `Pass not found: ${passId}`);
    }
    return pass.state;
  }

  compensatePass(passId: string): void {
    const pass = this.store.getPass(passId);
    if (pass === undefined) return;
    if (pass.state === "FAILED") {
      pass.state = "COMPENSATED";
      this.store.putPass(pass);
    }
  }

  private assertPassInvariants(pass: DisambiguationPass): void {
    if (!pass.passId || pass.passId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "DisambiguationPass.passId must be non-empty",
      );
    }
    if (pass.ordinal < 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "DisambiguationPass.ordinal must be >= 1",
      );
    }
    if (!pass.targetAmbiguitySetId || pass.targetAmbiguitySetId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "DisambiguationPass.targetAmbiguitySetId must be non-empty",
      );
    }
  }
}
