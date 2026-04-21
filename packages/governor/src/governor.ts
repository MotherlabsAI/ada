import { ManifoldStore, ManifoldState } from "@ada/provenance";
import type { Blueprint } from "@ada/compiler";
import { ManifoldChecker, ValidationResult } from "./manifold-checker.js";
import {
  evaluateSemanticGate,
  type GateVerdict,
  type SemanticGateInput,
  type SemanticGateResult,
} from "./semantic-gate.js";
import type {
  DriftScore,
  DriftScoreCalculator,
  GovernorActivationEvent,
} from "./types.js";
import type { GovernorSignal } from "./signals.js";

export interface GovernorOptions {
  readonly blueprint?: Blueprint | null;
  readonly gateMode?: "off" | "advisory" | "semantic";
}

/**
 * Governor: The central authority for semantic state transitions.
 * Enforces axioms and invariants by intercepting execution-layer permutations.
 *
 * Two validation paths, layered:
 *   1. ManifoldChecker — formal, path/context-based invariant check (always on)
 *   2. Semantic gate — LLM-evaluated action-time gate (opt-in via gateMode)
 *
 * A violation on either path produces a DENY. ALLOW requires both to allow.
 */
export class Governor {
  private readonly store: ManifoldStore;
  private readonly checker: ManifoldChecker;
  private currentState: ManifoldState | null = null;
  private readonly blueprint: Blueprint | null;
  private readonly gateMode: "off" | "advisory" | "semantic";

  constructor(projectDir: string, options: GovernorOptions = {}) {
    this.store = new ManifoldStore(projectDir);
    this.checker = new ManifoldChecker();
    this.blueprint = options.blueprint ?? null;
    this.gateMode =
      options.gateMode ??
      (readEnvGateMode() as "off" | "advisory" | "semantic");
  }

  /**
   * Validates a tool call against the current world model + semantic gate.
   */
  async validate(
    toolName: string,
    input: unknown,
  ): Promise<ValidationResult & { semantic?: SemanticGateResult }> {
    const manifoldResult = await this.runManifoldCheck(toolName, input);
    if (!manifoldResult.result) {
      return manifoldResult;
    }

    if (this.gateMode === "off" || !this.blueprint) {
      return manifoldResult;
    }

    const gateResult = await evaluateSemanticGate(
      this.blueprint,
      coerceGateInput(toolName, input),
    );

    if (this.gateMode === "advisory") {
      // Advisory mode: emit the verdict but do not block.
      return { ...manifoldResult, semantic: gateResult };
    }

    // Semantic mode: verdict is binding.
    if (gateResult.verdict === "ALLOW") {
      return { ...manifoldResult, semantic: gateResult };
    }

    return {
      result: false,
      message: denyMessageFor(gateResult),
      violatedInvariants: [...gateResult.violated],
      semantic: gateResult,
    };
  }

  private async runManifoldCheck(
    toolName: string,
    input: unknown,
  ): Promise<ValidationResult> {
    const state = await this.ensureState();
    if (!state) {
      // No world model — manifold check cannot run. Fall through to semantic.
      return { result: true };
    }
    return this.checker.checkToolCall(state, toolName, input);
  }

  async ensureState(): Promise<ManifoldState | null> {
    if (this.currentState) return this.currentState;

    const ref = this.store.loadRef();
    if (!ref) return null;

    try {
      this.currentState = this.store.loadManifold(ref);
      return this.currentState;
    } catch (e) {
      console.error("Failed to load manifold state from ref:", ref, e);
      return null;
    }
  }

  refresh(): void {
    this.currentState = null;
  }
}

function readEnvGateMode(): string {
  const mode = (process.env["ADA_GATE_MODE"] ?? "off").toLowerCase();
  if (mode === "semantic" || mode === "advisory" || mode === "off") return mode;
  return "off";
}

function coerceGateInput(toolName: string, input: unknown): SemanticGateInput {
  const inp = (input as Record<string, unknown>) ?? {};
  const filePath =
    typeof inp["file_path"] === "string"
      ? (inp["file_path"] as string)
      : typeof inp["path"] === "string"
        ? (inp["path"] as string)
        : undefined;
  const content =
    typeof inp["content"] === "string"
      ? (inp["content"] as string)
      : typeof inp["new_string"] === "string"
        ? (inp["new_string"] as string)
        : undefined;
  const command =
    typeof inp["command"] === "string" ? (inp["command"] as string) : undefined;

  const base: SemanticGateInput = {
    toolName,
    ...(filePath !== undefined ? { filePath } : {}),
    ...(content !== undefined ? { content } : {}),
    ...(command !== undefined ? { command } : {}),
  };
  return base;
}

function denyMessageFor(result: SemanticGateResult): string {
  const header =
    result.verdict === "AMEND_FIRST"
      ? "Ada gate: amendment required before this action"
      : "Ada gate: action blocked";
  const violated =
    result.violated.length > 0
      ? `\nViolated: ${result.violated.join("; ")}`
      : "";
  const suggestion = result.suggested ? `\nSuggested: ${result.suggested}` : "";
  return `${header}\n${result.reasoning}${violated}${suggestion}`;
}

export type { SemanticGateResult, GateVerdict } from "./semantic-gate.js";

// ─── G13: ContinuousGovernor ──────────────────────────────────────────────────
// Runtime wrapper over Governor. Activates on PreToolUse events (G7), every 50
// tokens of assistant output, and explicit drift score > 0.3. Does not replicate
// pipeline Governor logic — delegates to Governor.validate() for gate checks.

export class ContinuousGovernor {
  private readonly inner: Governor;
  private readonly driftCalculator: DriftScoreCalculator | null;
  private tokenCount = 0;

  private static readonly TOKEN_CHECKPOINT = 50;
  private static readonly DRIFT_THRESHOLD = 0.3;
  private static readonly PRE_TOOL_TIMEOUT_MS = 30_000;

  constructor(inner: Governor, driftCalculator?: DriftScoreCalculator) {
    this.inner = inner;
    this.driftCalculator = driftCalculator ?? null;
  }

  // Called on every PreToolUse hook event (G7, G13a).
  // Times out at 30s and degrades to advisory — never fully blocks on timeout.
  async onPreToolUse(
    toolName: string,
    input: unknown,
    emit: (signal: GovernorSignal) => void,
  ): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("timeout")),
        ContinuousGovernor.PRE_TOOL_TIMEOUT_MS,
      ),
    );

    try {
      const result = await Promise.race([
        this.inner.validate(toolName, input),
        timeoutPromise,
      ]);

      if (!result.result) {
        emit({
          type: "DRIFT",
          severity: "major",
          location: toolName,
          detail: result.message ?? `PreToolUse gate blocked: ${toolName}`,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === "timeout") {
        // G7: ceiling exceeded — degrade to advisory, do not block
        emit({
          type: "DRIFT",
          severity: "minor",
          location: toolName,
          detail: `PreToolUse gate timed out after ${ContinuousGovernor.PRE_TOOL_TIMEOUT_MS}ms — advisory mode`,
        });
      }
    }
  }

  // Called every 50 tokens of assistant output (G13b).
  // Fires async drift check without blocking the token stream.
  onTokenCheckpoint(
    currentOutput: string,
    baselineOutput: string,
    emit: (signal: GovernorSignal) => void,
  ): void {
    this.tokenCount += ContinuousGovernor.TOKEN_CHECKPOINT;
    void this.checkDrift(
      "token-checkpoint",
      currentOutput,
      baselineOutput,
      emit,
    );
  }

  // Called when caller has already computed a drift score (G13c).
  async onExplicitDrift(
    score: DriftScore,
    location: string,
    emit: (signal: GovernorSignal) => void,
  ): Promise<void> {
    if (score.exceeded) {
      emit({
        type: "DRIFT",
        severity: score.value > 0.7 ? "critical" : "major",
        location,
        detail: `Drift score ${score.value.toFixed(2)} exceeds threshold ${score.threshold}`,
      });
    }
  }

  private async checkDrift(
    activation: GovernorActivationEvent,
    current: string,
    baseline: string,
    emit: (signal: GovernorSignal) => void,
  ): Promise<void> {
    if (!this.driftCalculator) return;
    try {
      const score = await this.driftCalculator.calculate(current, baseline);
      if (score.exceeded) {
        emit({
          type: "DRIFT",
          severity: score.value > 0.7 ? "critical" : "major",
          location: `continuous-governor:${activation}`,
          detail: `Drift score ${score.value.toFixed(2)} exceeds threshold ${score.threshold} at token ${this.tokenCount}`,
        });
      } else {
        emit({ type: "CONFIDENCE", value: 1 - score.value });
      }
    } catch {
      // drift check failure is non-fatal
    }
  }
}
