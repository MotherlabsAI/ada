// Background compile runner for the MCP context daemon.
//
// Wraps @ada/compiler's MotherCompiler so the 7-stage pipeline runs
// asynchronously and writes partial state to a StateStore after each
// stage completes. Consumers (MCP server) poll the store and see new
// context land as stages finish.
//
// The engine has no AbortSignal plumbing and runs stages serially via
// awaited LLM calls — we cannot kill a stage mid-call. Abort semantics:
// after abort() we stop writing state, the handle's promise resolves
// immediately, and the underlying compile is left to finish in the
// background with further callbacks gated to no-ops. The last good
// state persisted before abort stays intact in the store.

import { MotherCompiler } from "@ada/compiler";
import type {
  CompilerStageCode,
  StageCompleteEvent,
  PipelineState,
  CompileResult,
} from "@ada/compiler";
import type { StateStore } from "./state-store.js";

export interface RunnerOptions {
  readonly onStageStart?: (stage: string) => void;
  readonly onStageComplete?: (
    stage: string,
    entropy: number,
    elapsedMs: number,
  ) => void;
  readonly onError?: (err: Error) => void;
  readonly onDone?: (decision: "ACCEPT" | "REJECT" | "ITERATE") => void;
  readonly maxIterations?: number;
  readonly signal?: AbortSignal;
}

export interface CompileHandle {
  readonly promise: Promise<void>;
  readonly isRunning: () => boolean;
  readonly currentStage: () => string | null;
  readonly abort: () => void;
}

// PipelineState field that each stage populates. Used on final completion
// to push the full typed slice for every stage — mid-stream the engine
// only surfaces postcode/entropy/challenges via onStageComplete; the
// structured slice is not exposed until compile() returns.
const STAGE_SLICE: Record<CompilerStageCode, keyof PipelineState | null> = {
  CTX: null,
  INT: "intent",
  PER: "persona",
  ENT: "entity",
  PRO: "process",
  SYN: "synthesis",
  VER: "verify",
  GOV: "governor",
};

export function runCompileInBackground(
  intent: string,
  store: StateStore,
  options: RunnerOptions,
): CompileHandle {
  let compiler: MotherCompiler | null = null;
  let constructionError: Error | null = null;
  try {
    compiler = new MotherCompiler();
  } catch (err) {
    constructionError = err instanceof Error ? err : new Error(String(err));
  }

  let running = true;
  let stage: string | null = null;
  let aborted = false;
  const stageStarts = new Map<string, number>();

  let resolveHandle!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolveHandle = resolve;
  });

  const settle = (): void => {
    if (!running) return;
    running = false;
    resolveHandle();
  };

  const abort = (): void => {
    if (aborted) return;
    aborted = true;
    settle();
  };

  if (options.signal) {
    if (options.signal.aborted) abort();
    else options.signal.addEventListener("abort", abort, { once: true });
  }

  const reportError = (err: unknown): void => {
    const e = err instanceof Error ? err : new Error(String(err));
    try {
      options.onError?.(e);
    } catch {
      /* daemon must survive misbehaving callbacks */
    }
  };

  if (constructionError) {
    queueMicrotask(() => {
      reportError(constructionError);
      settle();
    });
    return { promise, isRunning: () => running, currentStage: () => stage, abort };
  }

  const handleStageStart = (code: CompilerStageCode): void => {
    if (aborted) return;
    stage = code;
    stageStarts.set(code, Date.now());
    try {
      options.onStageStart?.(code);
    } catch {
      /* swallow */
    }
  };

  const handleStageComplete = (event: StageCompleteEvent): void => {
    if (aborted) return;
    const started = stageStarts.get(event.stage) ?? Date.now();
    const elapsedMs = Date.now() - started;
    // Mid-stream: mark the stage complete with entropy, challenges, and
    // postcode in the `data` blob. The typed structured slice (IntentGraph
    // etc.) lands in a second pass below when compile() returns.
    try {
      store.mergeStage(event.stage, {
        status: "complete",
        data: {
          postcode: event.postcode,
          challenges: event.challenges,
          elapsedMs,
        },
        completedAt: Date.now(),
        entropy: event.entropyEstimate,
      });
    } catch (err) {
      reportError(err);
    }
    try {
      options.onStageComplete?.(event.stage, event.entropyEstimate, elapsedMs);
    } catch {
      /* swallow */
    }
  };

  void (async () => {
    try {
      const result: CompileResult = await compiler!.compile(intent, {
        onStageStart: handleStageStart,
        onStageComplete: handleStageComplete,
      });
      if (aborted) return;

      // Final pass: push the full typed slice for every stage.
      const ps = result.pipelineState;
      for (const [code, key] of Object.entries(STAGE_SLICE) as Array<
        [CompilerStageCode, keyof PipelineState | null]
      >) {
        if (!key) continue;
        const slice = ps[key];
        if (slice == null) continue;
        try {
          store.mergeStage(code, {
            status: "complete",
            data: slice,
            completedAt: Date.now(),
          });
        } catch (err) {
          reportError(err);
        }
      }

      try {
        options.onDone?.(result.governorDecision.decision);
      } catch {
        /* swallow */
      }
    } catch (err) {
      // stage stays set to the failed one for currentStage() diagnostics.
      reportError(err);
    } finally {
      settle();
    }
  })();

  return { promise, isRunning: () => running, currentStage: () => stage, abort };
}
