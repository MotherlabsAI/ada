import { createHash } from "crypto";
import { ENTGateRecord, StalledPipelineRun } from "./types.js";
import type { ProvenanceRecordWriter } from "./ProvenanceRecordWriter.js";

const PIPELINE_RUN_ID = "ML.ENT.e80e3c97/v1";

function makeGateId(): string {
  return `gate-ent-${PIPELINE_RUN_ID}`;
}

function makeGovernorPostcode(gateId: string, ts: number): string {
  const hash = createHash("sha256")
    .update(`governor-decision:${gateId}:${ts}`)
    .digest("hex")
    .slice(0, 8);
  return `ML.ENT.${hash}/v1`;
}

export class ENTGateEvaluator {
  private gate: ENTGateRecord;

  constructor(private readonly provenanceWriter: ProvenanceRecordWriter) {
    this.gate = {
      gateId: makeGateId(),
      pipelineRunId: PIPELINE_RUN_ID,
      entityCount: 0,
      provenanceIntact: false,
      allBlockersCleared: false,
      passed: false,
      evaluatedAt: null,
      governorDecisionPostcode: null,
      state: "pending",
    };
  }

  // Conjunctive gate: entityCount > 0 AND provenanceIntact AND allBlockersCleared.
  // Produces ENTGateRecord with passed=true if all conditions are met.
  evaluateGate(
    entityCount: number,
    provenanceIntact: boolean,
    allBlockersCleared: boolean,
    pipelineRunId: string,
  ): ENTGateRecord {
    if (pipelineRunId !== PIPELINE_RUN_ID) {
      throw new Error(
        `pipelineRunId mismatch: expected '${PIPELINE_RUN_ID}', got '${pipelineRunId}'`,
      );
    }
    if (entityCount < 0) {
      throw new Error("entityCount cannot be negative");
    }

    // Transition to evaluating
    const evaluating: ENTGateRecord = {
      ...this.gate,
      entityCount,
      provenanceIntact,
      allBlockersCleared,
      state: "evaluating",
    };
    this.gate = evaluating;

    const passed =
      entityCount > 0 &&
      provenanceIntact === true &&
      allBlockersCleared === true;

    const evaluatedAt = Date.now();
    const governorDecisionPostcode = passed
      ? makeGovernorPostcode(this.gate.gateId, evaluatedAt)
      : null;

    // Write provenance record for gate evaluation
    const gateProvRecord = this.provenanceWriter.writeRecord(
      passed ? "ENT_GATE_PASSED" : "ENT_GATE_FAILED",
      this.gate.gateId,
      "ENT",
      governorDecisionPostcode ? [governorDecisionPostcode] : [],
    );

    if (passed && governorDecisionPostcode) {
      // Write governor decision record
      this.provenanceWriter.writeRecord(
        "GOVERNOR_DECISION",
        `${this.gate.gateId}:PASS`,
        "ENT",
        [gateProvRecord.postcode],
      );
    }

    const result: ENTGateRecord = {
      ...this.gate,
      entityCount,
      provenanceIntact,
      allBlockersCleared,
      passed,
      evaluatedAt,
      governorDecisionPostcode,
      state: passed ? "passed" : "failed",
    };
    this.gate = result;
    return result;
  }

  getGovernorDecision(gate: ENTGateRecord): string {
    if (gate.passed) return "PASS";
    if (gate.state === "evaluating") return "PENDING";
    return "FAIL";
  }

  getGate(): ENTGateRecord {
    return this.gate;
  }

  // Validate ENTGateRecord invariants.
  validateGateInvariants(gate: ENTGateRecord): void {
    const expectedPassed =
      gate.entityCount > 0 &&
      gate.provenanceIntact === true &&
      gate.allBlockersCleared === true;
    if (gate.passed !== expectedPassed) {
      throw new Error(
        `ENTGateRecord.passed invariant violated: passed=${gate.passed} but ` +
          `entityCount=${gate.entityCount}, provenanceIntact=${gate.provenanceIntact}, ` +
          `allBlockersCleared=${gate.allBlockersCleared}`,
      );
    }
    if (gate.entityCount < 0) {
      throw new Error("ENTGateRecord.entityCount cannot be negative");
    }
    if (gate.passed && !gate.governorDecisionPostcode) {
      throw new Error(
        "ENTGateRecord.passed=true but governorDecisionPostcode is null — G6 violation",
      );
    }
    if (gate.passed && gate.evaluatedAt === null) {
      throw new Error("ENTGateRecord.passed=true but evaluatedAt is null");
    }
    if (!gate.pipelineRunId) {
      throw new Error("ENTGateRecord.pipelineRunId must be non-null");
    }
  }

  // Verify the gate result against the StalledPipelineRun state.
  advancePipelineRun(
    gate: ENTGateRecord,
    run: StalledPipelineRun,
  ): { advanced: boolean; reason: string } {
    if (!gate.passed) {
      return {
        advanced: false,
        reason: `Gate did not pass — entityCount=${gate.entityCount}, provenanceIntact=${gate.provenanceIntact}, allBlockersCleared=${gate.allBlockersCleared}`,
      };
    }
    if (run.blockerCount !== 0) {
      return {
        advanced: false,
        reason: `Run still has ${run.blockerCount} uncleared blockers`,
      };
    }
    this.validateGateInvariants(gate);
    return {
      advanced: true,
      reason:
        "ENT gate passed — pipeline run ML.ENT.e80e3c97/v1 advanced beyond ENT stage",
    };
  }
}
