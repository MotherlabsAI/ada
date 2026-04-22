export * from "./governor.js";
export * from "./manifold-checker.js";
export * from "./interceptor.js";
export {
  evaluateSemanticGate,
  type SemanticGateInput,
  type SemanticGateResult,
  type SemanticGateOptions,
  type GateVerdict,
} from "./semantic-gate.js";
export { ConfidenceTracker } from "./confidence.js";
export { watch, type WatchOptions } from "./watch.js";
export { evaluateInvariants, type DriftResult } from "./drift.js";
export {
  evaluateSemanticDrift,
  type SemanticDriftOptions,
  type SemanticDriftResult,
} from "./semantic-drift.js";
export {
  callWithExtendedThinking,
  createClient,
  getApiKey,
  type ExtendedThinkingCall,
  type ExtendedThinkingResult,
} from "./llm-client.js";
export type {
  GovernorSignal,
  SuggestedAgent,
  SessionReloadSignal,
} from "./signals.js";
export type {
  GateFailurePayload,
  ActorClass,
  WHOEntity,
  EmbeddingVector,
  EmbeddingProvider,
  DriftScore,
  DriftScoreCalculator,
  GovernorActivationEvent,
  PreToolUseHook,
  BootstrapSeed,
  MetaInvariantEntry,
} from "./types.js";
export {
  watchSessionLog,
  type SessionLogEntry,
  type SessionLogOptions,
} from "./session-log.js";
export {
  generateWorldModelIndex,
  mergeSessionDelta,
  writeWorldModelIndex,
  generateTopicFiles,
  writeTopicFiles,
  archiveSessionLog,
  extractSessionInsights,
  updateSessionPatterns,
  consolidateSessions,
  pruneOldSessions,
  findRelevantTopics,
  buildTopicContext,
  type TopicFile,
  type SessionInsights,
  type SessionPatterns,
  type ConsolidateResult,
  type ConsolidateOptions,
  type RelevantTopic,
} from "./world-model.js";
export {
  computeDriftThresholds,
  createProjectionEngine,
  type DriftThreshold,
  type ProjectionEngine,
} from "./projection.js";
