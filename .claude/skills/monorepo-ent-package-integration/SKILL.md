---
name: monorepo-ent-package-integration
description: "Use when Developer initiates pnpm integration task to merge isolated ENT-stage packages into main compiler pipeline pattern detected."
---

# monorepo-ent-package-integration

Trigger: Developer initiates pnpm integration task to merge isolated ENT-stage packages into main compiler pipeline

## Steps
1. **type-check-isolated-ent-packages**
   - Pre: `Five isolated packages exist: entgate, entityextraction, ordinalassignment, blueprintregistry, provenanceaudit; each has its own tsconfig.json and package.json; no cross-package imports exist yet`
   - Action: `Run tsc --noEmit for each package independently in dependency order; collect all TypeScript diagnostic errors per package; record zero-error state per package before proceeding to workspace linking`
   - Post: `All 5 packages report zero TypeScript errors in isolation; diagnostic output is stored per package; packages are confirmed individually compilable`

2. **link-packages-into-pnpm-workspace**
   - Pre: `All 5 ENT packages are individually type-clean; pnpm-workspace.yaml exists at monorepo root; each package has a unique name field in package.json`
   - Action: `Add each ENT package path to pnpm-workspace.yaml packages array; run pnpm install to resolve workspace symlinks; verify each package appears in pnpm list --recursive output; update root tsconfig.json paths to include ENT package aliases`
   - Post: `All 5 ENT packages are symlinked in node_modules; pnpm list shows them as workspace packages; root tsconfig paths resolve each package by alias; no duplicate package name conflicts exist`

3. **wire-ent-packages-into-compiler-pipeline**
   - Pre: `ENT packages are workspace-linked; main compiler pipeline PipelineStage registry exists; ENT stage is defined in pipeline config as stageCode ENT at correct position`
   - Action: `Import ENTGateRecord evaluator from entgate package into pipeline orchestrator; import BlueprintComponentRegistry loader from blueprintregistry; import EntityMap extractor from entityextraction; import ordinal assignment from ordinalassignment; import ProvenanceChain verifier from provenanceaudit; register each as the implementation for the ENT PipelineStage; wire stage output postcode propagation`
   - Post: `Pipeline orchestrator resolves all ENT stage implementations without import errors; ENT PipelineStage has a non-null implementation reference; stage output type matches CompileResult input contract; no circular imports exist between ENT packages and core pipeline`

4. **run-full-monorepo-test-suite**
   - Pre: `All ENT packages are wired into pipeline; zero TypeScript errors across monorepo; all existing tests were passing before ENT integration began`
   - Action: `Execute pnpm test --recursive; collect test results per package; identify any regressions in existing packages caused by ENT integration; run ENT-specific test suites including ordinal gap collapse tests, entity extraction tests, provenance chain verification tests, and ENT gate evaluation tests`
   - Post: `Zero test regressions in pre-existing packages; all ENT-specific tests pass; test coverage for ENT stage meets minimum threshold; no flaky tests introduced by async provenance registration paths`

5. **validate-ada-self-blueprint-in-compiled-output**
   - Pre: `CompileResult for ML.ENT.e80e3c97/v1 has been emitted with decision passed; Blueprint artifact is accessible by blueprintPostcode on CompilationRun; domain model specifies 5 stable bounded contexts`
   - Action: `Load Blueprint by blueprintPostcode; traverse architecture section to enumerate bounded contexts; verify exactly 5 bounded contexts are present matching the canonical names from domain model; for each bounded context traverse dataModel to enumerate entities; verify all specified domain entities are present; verify Blueprint processModel references ENT-stage workflows; assert DelegationContract blueprintPostcode matches this Blueprint`
   - Post: `Blueprint contains exactly 5 bounded contexts; all domain entities are enumerated in Blueprint dataModel; Blueprint processModel includes ENT gate evaluation workflow; DelegationContract for Ada references this Blueprint postcode; Blueprint is self-consistent for governing Ada's own execution`
