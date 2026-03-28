import {
  ENTGateEvaluator as EntENTGateEvaluator,
  ProvenanceRecordWriter,
} from "@ada/ent";
import type { ENTGateRecord, StalledPipelineRun } from "@ada/ent";

export type { ENTGateRecord, StalledPipelineRun };

/**
 * ENTGateEvaluator
 *
 * Evaluates the ENT gate: entityCount > 0 AND provenanceIntact AND
 * allBlockersCleared. Produces a passing ENTStageResult when all
 * conditions are satisfied for pipeline run ML.ENT.e80e3c97/v1.
 */
export class ENTGateEvaluator {
  private readonly inner: EntENTGateEvaluator;

  constructor(writer?: ProvenanceRecordWriter) {
    this.inner = new EntENTGateEvaluator(
      writer ?? new ProvenanceRecordWriter(),
    );
  }

  evaluateGate(
    entityCount: number,
    provenanceIntact: boolean,
    allBlockersCleared: boolean,
    pipelineRunId: string,
  ): ENTGateRecord {
    return this.inner.evaluateGate(
      entityCount,
      provenanceIntact,
      allBlockersCleared,
      pipelineRunId,
    );
  }

  validateGateInvariants(gate: ENTGateRecord): void {
    return this.inner.validateGateInvariants(gate);
  }

  advancePipelineRun(
    gate: ENTGateRecord,
    run: StalledPipelineRun,
  ): { advanced: boolean; reason: string } {
    return this.inner.advancePipelineRun(gate, run);
  }

  getGate(): ENTGateRecord {
    return this.inner.getGate();
  }

  getGovernorDecision(gate: ENTGateRecord): string {
    return this.inner.getGovernorDecision(gate);
  }
}
