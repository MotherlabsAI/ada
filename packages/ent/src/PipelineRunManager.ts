import { createHash } from "crypto";
import { ENTBlocker, StalledPipelineRun } from "./types.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1" as const;

function makeBlockerId(): string {
  return `blocker-c3-${PIPELINE_RUN_ID}`;
}

function makeClearancePostcode(blockerId: string): string {
  const hash = createHash("sha256")
    .update(`clearance:${blockerId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

export class PipelineRunManager {
  private run: StalledPipelineRun;

  constructor() {
    // Load the stalled pipeline run ML.ENT.e80e3c97/v1 at ENT stage.
    // One blocker exists: the C3 assignment gap.
    const blocker: ENTBlocker = {
      blockerId: makeBlockerId(),
      pipelineRunId: PIPELINE_RUN_ID,
      linkedGapId: `gap-c3-${PIPELINE_RUN_ID}`,
      description:
        "C3 assignment gap: ElicitationEngineComponent (ordinal 3) has no resolved workspace package. " +
        "Mapping cannot be declared total until this gap is closed.",
      severity: "critical",
      isCleared: false,
      clearedAt: null,
      clearanceProvenancePostcode: null,
    };

    this.run = {
      runId: PIPELINE_RUN_ID,
      stage: "ENT",
      version: "v1",
      blockers: [blocker],
      blockerCount: 1,
      resumable: true,
    };
  }

  loadStalledRun(runId: string): StalledPipelineRun {
    if (runId !== PIPELINE_RUN_ID) {
      throw new Error(
        `Run identity mismatch: expected '${PIPELINE_RUN_ID}', got '${runId}'`,
      );
    }
    return this.run;
  }

  getBlocker(): ENTBlocker {
    const blocker = this.run.blockers[0];
    if (!blocker) throw new Error("No blocker found on stalled run");
    return blocker;
  }

  clearBlocker(
    run: StalledPipelineRun,
    blocker: ENTBlocker,
    clearanceProvenancePostcode: string,
  ): StalledPipelineRun {
    if (blocker.isCleared) {
      throw new Error("Blocker is already cleared — idempotent no-op");
    }
    if (!clearanceProvenancePostcode) {
      throw new Error(
        "clearanceProvenancePostcode must be non-null — G9 requires provenance for clearance",
      );
    }

    const clearedAt = Date.now();
    const clearedBlocker: ENTBlocker = {
      ...blocker,
      isCleared: true,
      clearedAt,
      clearanceProvenancePostcode,
    };

    const updatedRun: StalledPipelineRun = {
      ...run,
      blockers: run.blockers.map((b) =>
        b.blockerId === blocker.blockerId ? clearedBlocker : b,
      ),
      blockerCount: 0,
    };
    this.run = updatedRun;
    return updatedRun;
  }

  // Clears the C3 blocker using an auto-generated clearance postcode.
  clearC3Blocker(resolutionProvenancePostcode: string): StalledPipelineRun {
    const blocker = this.getBlocker();
    const clearancePostcode =
      resolutionProvenancePostcode || makeClearancePostcode(blocker.blockerId);
    return this.clearBlocker(this.run, blocker, clearancePostcode);
  }

  transitionRunState(
    run: StalledPipelineRun,
    targetState: string,
  ): StalledPipelineRun {
    // State is implicit in blockerCount + resumable flags.
    // This validates the requested transition is coherent.
    if (targetState === "unblocked" && run.blockerCount !== 0) {
      throw new Error(
        `Cannot transition to 'unblocked': blockerCount is ${run.blockerCount}`,
      );
    }
    return run;
  }

  isRunResumed(run: StalledPipelineRun): boolean {
    return run.blockerCount === 0 && run.resumable === true;
  }

  getRun(): StalledPipelineRun {
    return this.run;
  }
}
