export type {
  TsConfig,
  ProjectReference,
  CompositeBuild,
  BuildError,
  BuildResult,
  TsBuildInfo,
} from "./types.js";
export {
  deriveBuildContract,
  validateBuildContracts,
  type ContractViolation,
} from "./derive-build-contract.js";
export {
  cleanStaleArtifacts,
  invokeCompositeBuild,
  getBuildStatus,
  resolveTsc,
} from "./composite-build-executor.js";
