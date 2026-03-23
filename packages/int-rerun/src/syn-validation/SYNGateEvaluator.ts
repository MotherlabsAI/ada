import { randomUUID } from "crypto";
import type {
  RunArtifact,
  SYNGate,
  SYNValidationResult,
  EntityBinding,
} from "../types.js";
import { PipelineError } from "../types.js";
import type { PipelineStore } from "../store.js";

const REQUIRED_PASS_RATE = 0.83 as const;
const EVENT_RETRY_LIMIT = 3;

type SYNEvent =
  | { type: "SYN_PASS"; runId: string; passRate: number }
  | { type: "SYN_FAIL"; runId: string; passRate: number };

/**
 * Triggers and evaluates SYN gate re-evaluation downstream of INT completion.
 *
 * Invariants enforced:
 *   - synGate.requiredPassRate === 0.83
 *   - synGate.upstreamStage non-empty
 *   - synGate.gateId non-empty
 *   - synValidationResult.passed === (passRate >= 0.83)
 *   - synValidationResult.passRate === passedBindingCount / totalBindingCount
 *   - synValidationResult.passedBindingCount <= totalBindingCount
 */
export class SYNGateEvaluator {
  private readonly emittedEvents: SYNEvent[] = [];

  constructor(private readonly store: PipelineStore) {}

  detectUpstreamCompletion(runArtifact: RunArtifact): boolean {
    // Verify artifact is from a completed INT run
    if (!runArtifact.immutable) {
      throw new PipelineError(
        "IMMUTABILITY_VIOLATION",
        `RunArtifact for runId=${runArtifact.runId} is not immutable; rejecting`,
      );
    }

    const run = this.store.getRun(runArtifact.runId);
    if (run === undefined) {
      return false;
    }

    if (run.stage !== "INT") {
      throw new PipelineError(
        "GATE_MISCONFIGURATION",
        `SYNGate.upstreamStage expected INT; got ${run.stage}`,
      );
    }

    if (run.state !== "COMPLETED") {
      return false;
    }

    if (run.aggregateEntropy > 0.3) {
      return false;
    }

    if (run.passOrdinal !== 2) {
      return false;
    }

    return true;
  }

  triggerValidation(runArtifact: RunArtifact): SYNValidationResult {
    // Verify immutability
    if (!runArtifact.immutable) {
      throw new PipelineError(
        "IMMUTABILITY_VIOLATION",
        `RunArtifact for runId=${runArtifact.runId} has immutable=false; tampered artifact`,
      );
    }

    // Create or get gate
    const gateId = `SYN-GATE-${runArtifact.runId}`;
    let gate: SYNGate;

    const existingGate = this.store.getGate(gateId);
    if (existingGate) {
      gate = existingGate;
    } else {
      gate = {
        gateId,
        requiredPassRate: REQUIRED_PASS_RATE,
        passRateTarget: REQUIRED_PASS_RATE,
        upstreamStage: "INT",
        upstreamRunId: runArtifact.runId,
        observedPassRate: null,
        selfResolved: false,
        intStageRunId: runArtifact.runId,
        state: "PENDING",
      };
      this.assertGateInvariants(gate);
      this.store.putGate(gate);
    }

    // Load resolved bindings for validation
    const bindings = this.loadResolvedBindingsForValidation(runArtifact);

    if (bindings.length === 0) {
      gate.state = "BLOCKED";
      this.store.putGate(gate);
      throw new PipelineError(
        "NO_BINDINGS_RETAINED",
        "totalBindingCount is 0; cannot evaluate SYN gate",
      );
    }

    // Execute SYN validation pass
    const result = this.executeSYNValidationPass(
      bindings,
      runArtifact.runId,
      gateId,
    );

    // Store result
    this.store.putValidationResult(result);

    // Update gate observed pass rate
    gate.observedPassRate = result.passRate;
    this.store.putGate(gate);

    return result;
  }

  evaluateGateOutcome(validationResult: SYNValidationResult): string {
    if (validationResult.status === "ABORTED") {
      // Hold in PENDING; do not open or block
      console.warn(
        `[SYNGateEvaluator] Validation result is ABORTED for runId=${validationResult.runId}; holding gate in PENDING`,
      );
      return "PENDING";
    }

    const gate = this.store.getGate(validationResult.gateId);
    if (gate === undefined) {
      throw new PipelineError(
        "NOT_FOUND",
        `SYNGate not found: gateId=${validationResult.gateId}`,
      );
    }

    // Consistency check: passed flag must be derived from passRate
    const expectedPassed = validationResult.passRate >= REQUIRED_PASS_RATE;
    if (validationResult.passed !== expectedPassed) {
      // INCONSISTENT result — flag and recompute
      validationResult.status = "INCONSISTENT";
      console.error(
        `[SYNGateEvaluator] SYNValidationResult is INCONSISTENT: passed=${validationResult.passed} but passRate=${validationResult.passRate}; escalating`,
      );
      throw new PipelineError(
        "INCONSISTENT_RESULT",
        "SYNValidationResult.passed is inconsistent with passRate; escalating and blocking",
      );
    }

    if (validationResult.passed) {
      gate.state = "OPEN";
      gate.selfResolved = true;
      this.store.putGate(gate);

      // Emit SYN_PASS event with retry
      this.emitEvent(
        {
          type: "SYN_PASS",
          runId: validationResult.runId,
          passRate: validationResult.passRate,
        },
        gate,
      );

      console.log(
        `[SYNGateEvaluator] SYN_PASS: gateId=${gate.gateId}, passRate=${validationResult.passRate.toFixed(4)}`,
      );

      // Post-condition audit: ensure gate opened correctly
      const reopenedGate = this.store.getGate(gate.gateId);
      if (reopenedGate && reopenedGate.state === "OPEN") {
        // Verify passRate was indeed >= 0.83
        if (validationResult.passRate < REQUIRED_PASS_RATE) {
          reopenedGate.state = "BLOCKED";
          this.store.putGate(reopenedGate);
          throw new PipelineError(
            "GATE_OPEN_VIOLATION",
            `Gate opened incorrectly: passRate=${validationResult.passRate} < 0.83; rolling back to BLOCKED`,
          );
        }
      }

      return "OPEN";
    } else {
      gate.state = "BLOCKED";
      this.store.putGate(gate);

      this.emitEvent(
        {
          type: "SYN_FAIL",
          runId: validationResult.runId,
          passRate: validationResult.passRate,
        },
        gate,
      );

      console.log(
        `[SYNGateEvaluator] SYN_FAIL: gateId=${gate.gateId}, passRate=${validationResult.passRate.toFixed(4)}`,
      );

      return "BLOCKED";
    }
  }

  getGateState(gateId: string): string {
    const gate = this.store.getGate(gateId);
    if (gate === undefined) {
      throw new PipelineError("NOT_FOUND", `SYNGate not found: ${gateId}`);
    }
    return gate.state;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private loadResolvedBindingsForValidation(
    runArtifact: RunArtifact,
  ): EntityBinding[] {
    const bindings: EntityBinding[] = [];
    let danglingCount = 0;

    for (const bindingId of runArtifact.resolvedBindingIds) {
      const binding = this.store.getBinding(bindingId);
      if (binding === undefined) {
        danglingCount++;
        console.warn(
          `[SYNGateEvaluator] DANGLING_BINDING_REF: bindingId=${bindingId} not found; excluding from validation`,
        );
        continue;
      }
      bindings.push(binding);
    }

    if (danglingCount > 0) {
      console.warn(
        `[SYNGateEvaluator] ${danglingCount} dangling binding references excluded; totalBindingCount reduced`,
      );
    }

    return bindings;
  }

  private executeSYNValidationPass(
    bindings: EntityBinding[],
    runId: string,
    gateId: string,
  ): SYNValidationResult {
    const totalBindingCount = bindings.length;
    let passedBindingCount = 0;

    for (const binding of bindings) {
      // SYN pass criterion: canonicalTargetId reachable in entity graph AND perBindingEntropy < 0.30
      const reachable = this.isCanonicalTargetReachable(
        binding.canonicalTargetId,
      );

      if (!reachable) {
        binding.state = "SYN_FAILED";
        console.warn(
          `[SYNGateEvaluator] SYN_FAIL on bindingId=${binding.bindingId}: canonicalTargetId=${binding.canonicalTargetId} not reachable`,
        );
        continue;
      }

      if (binding.perBindingEntropy >= 0.3) {
        binding.state = "SYN_FAILED";
        continue;
      }

      binding.state = "SYN_VALIDATED";
      passedBindingCount++;
    }

    const passRate =
      totalBindingCount === 0 ? 0 : passedBindingCount / totalBindingCount;
    const passed = passRate >= REQUIRED_PASS_RATE;

    const result: SYNValidationResult = {
      runId,
      passRate,
      passedBindingCount,
      totalBindingCount,
      passed,
      gateId,
      status: "OK",
    };

    this.assertValidationResultInvariants(result);
    return result;
  }

  private isCanonicalTargetReachable(canonicalTargetId: string): boolean {
    // Entity graph reachability: all entities in CanonicalEntityRegistry are reachable
    // (the registry IS the entity graph for this implementation)
    return this.store.getCanonicalEntity(canonicalTargetId) !== undefined;
  }

  private emitEvent(event: SYNEvent, gate: SYNGate): void {
    let attempt = 0;
    while (attempt < EVENT_RETRY_LIMIT) {
      try {
        this.emittedEvents.push(event);
        return;
      } catch {
        attempt++;
        console.warn(
          `[SYNGateEvaluator] Event emission failed attempt ${attempt}/${EVENT_RETRY_LIMIT}`,
        );
      }
    }
    // All retries exhausted
    gate.state = "EVENT_DELIVERY_FAILED";
    this.store.putGate(gate);
    throw new PipelineError(
      "EVENT_DELIVERY_FAILED",
      `Failed to emit ${event.type} after ${EVENT_RETRY_LIMIT} attempts; halting pipeline`,
    );
  }

  private assertGateInvariants(gate: SYNGate): void {
    if (!gate.gateId || gate.gateId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "SYNGate.gateId must be non-empty",
      );
    }
    if (gate.requiredPassRate !== REQUIRED_PASS_RATE) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `SYNGate.requiredPassRate must be 0.83; got ${gate.requiredPassRate}`,
      );
    }
    if (!gate.upstreamStage || gate.upstreamStage.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "SYNGate.upstreamStage must be non-empty",
      );
    }
  }

  private assertValidationResultInvariants(result: SYNValidationResult): void {
    if (!result.runId || result.runId.length === 0) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        "SYNValidationResult.runId must be non-empty",
      );
    }
    if (result.passRate < 0 || result.passRate > 1) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `SYNValidationResult.passRate=${result.passRate} out of [0,1]`,
      );
    }
    if (result.passedBindingCount > result.totalBindingCount) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `SYNValidationResult.passedBindingCount (${result.passedBindingCount}) > totalBindingCount (${result.totalBindingCount})`,
      );
    }
    const expectedRate =
      result.totalBindingCount === 0
        ? 0
        : result.passedBindingCount / result.totalBindingCount;
    if (Math.abs(result.passRate - expectedRate) > 1e-10) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `SYNValidationResult.passRate=${result.passRate} != passedBindingCount/totalBindingCount=${expectedRate}`,
      );
    }
    if (result.passed !== result.passRate >= REQUIRED_PASS_RATE) {
      throw new PipelineError(
        "INVARIANT_VIOLATION",
        `SYNValidationResult.passed=${result.passed} inconsistent with passRate=${result.passRate}`,
      );
    }
  }

  getEmittedEvents(): readonly SYNEvent[] {
    return this.emittedEvents;
  }
}

// Suppress unused import warning
void randomUUID;
