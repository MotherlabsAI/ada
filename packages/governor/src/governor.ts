import { ManifoldStore, ManifoldState } from "@ada/provenance";
import type { Blueprint } from "@ada/compiler";
import { ManifoldChecker, ValidationResult } from "./manifold-checker.js";
import {
  evaluateSemanticGate,
  type GateVerdict,
  type SemanticGateInput,
  type SemanticGateResult,
} from "./semantic-gate.js";

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
