import { PipelineStore } from "./store.js";
import { CanonicalEntityRegistry } from "./entity-model/CanonicalEntityRegistry.js";
import { AmbiguitySetLoader } from "./int-resolution/AmbiguitySetLoader.js";
import { IntegrationMappingResolver } from "./int-resolution/IntegrationMappingResolver.js";
import { BindingEntropyFilter } from "./int-resolution/BindingEntropyFilter.js";
import { AggregateEntropyCalculator } from "./int-resolution/AggregateEntropyCalculator.js";
import { INTStageController } from "./int-resolution/INTStageController.js";
import { DisambiguationPassExecutor } from "./pipeline-execution/DisambiguationPassExecutor.js";
import { RunArtifactProducer } from "./pipeline-execution/RunArtifactProducer.js";
import { PipelineRunManager } from "./pipeline-execution/PipelineRunManager.js";
import { SYNGateEvaluator } from "./syn-validation/SYNGateEvaluator.js";

export type { RunArtifact, SYNValidationResult, PipelineRun } from "./types.js";
export { PipelineError } from "./types.js";

// ─── Build order factory ─────────────────────────────────────────────────────
// Components wired in dependency order per CLAUDE.md build order:
//   1. CanonicalEntityRegistry
//   2. AmbiguitySetLoader
//   3. IntegrationMappingResolver
//   4. BindingEntropyFilter
//   5. AggregateEntropyCalculator
//   6. INTStageController
//   7. DisambiguationPassExecutor
//   8. RunArtifactProducer
//   9. PipelineRunManager
//  10. SYNGateEvaluator

export interface INTRerunPipeline {
  pipelineRunManager: PipelineRunManager;
  synGateEvaluator: SYNGateEvaluator;
  store: PipelineStore;
}

export function createINTRerunPipeline(): INTRerunPipeline {
  // 1. Infrastructure
  const store = new PipelineStore();

  // 2. EntityModel
  const canonicalEntityRegistry = new CanonicalEntityRegistry(store);

  // 3. INTResolution
  const ambiguitySetLoader = new AmbiguitySetLoader(
    store,
    canonicalEntityRegistry,
  );
  const integrationMappingResolver = new IntegrationMappingResolver(
    store,
    canonicalEntityRegistry,
  );
  const bindingEntropyFilter = new BindingEntropyFilter();
  const aggregateEntropyCalculator = new AggregateEntropyCalculator();
  const intStageController = new INTStageController(
    store,
    ambiguitySetLoader,
    integrationMappingResolver,
    bindingEntropyFilter,
    aggregateEntropyCalculator,
  );

  // 4. PipelineExecution
  const disambiguationPassExecutor = new DisambiguationPassExecutor(
    store,
    intStageController,
  );
  const runArtifactProducer = new RunArtifactProducer(store);
  const pipelineRunManager = new PipelineRunManager(
    store,
    disambiguationPassExecutor,
    runArtifactProducer,
    ambiguitySetLoader,
    aggregateEntropyCalculator,
  );

  // 5. SYNValidation
  const synGateEvaluator = new SYNGateEvaluator(store);

  return { pipelineRunManager, synGateEvaluator, store };
}

// ─── Primary entry point ─────────────────────────────────────────────────────

const PRIOR_RUN_ID = "ML.INT.01d32819/v1";

/**
 * Execute the INT disambiguation rerun and downstream SYN gate evaluation.
 * Stateless and idempotent — reads from prior run, writes new artifact.
 */
export async function executeINTRerun(): Promise<{
  runId: string;
  aggregateEntropy: number;
  resolvedBindingCount: number;
  synPassRate: number;
  synPassed: boolean;
  gateState: string;
}> {
  const { pipelineRunManager, synGateEvaluator, store } =
    createINTRerunPipeline();

  // Execute disambiguation workflow (workflows: int-stage-second-disambiguation-pass)
  const artifact =
    pipelineRunManager.executeDisambiguationWorkflow(PRIOR_RUN_ID);

  // Trigger SYN gate re-evaluation (workflow: syn-gate-re-evaluation)
  const upstreamCompleted = synGateEvaluator.detectUpstreamCompletion(artifact);
  if (!upstreamCompleted) {
    throw new Error("SYN gate: upstream INT completion not detected");
  }

  const validationResult = synGateEvaluator.triggerValidation(artifact);
  const gateState = synGateEvaluator.evaluateGateOutcome(validationResult);

  const newRun = store.getRun(artifact.runId);

  return {
    runId: artifact.runId,
    aggregateEntropy: newRun?.aggregateEntropy ?? 0,
    resolvedBindingCount: artifact.resolvedBindingIds.length,
    synPassRate: validationResult.passRate,
    synPassed: validationResult.passed,
    gateState,
  };
}
