# A gated sequential semantic compilation pipeline that loads a 10-component blueprint registry, collapses a C3 ordinal assignment gap, extracts canonical entities into an entity map, validates three-hop provenance chains, and evaluates the ENT gate to produce a passing CompileResult that unblocks pipeline run ML

A gated sequential semantic compilation pipeline that loads a 10-component blueprint registry, collapses a C3 ordinal assignment gap, extracts canonical entities into an entity map, validates three-hop provenance chains, and evaluates the ENT gate to produce a passing CompileResult that unblocks pipeline run ML.ENT.e80e3c97/v1 — all within a pnpm monorepo of TypeScript packages with zero compilation errors and zero test regressions.

## Out of Scope
Ada explicitly excluded these. Do not build them:
- Ada programming language (ISO/IEC 8652): this system has no relation to the Ada language used in aerospace/defense/embedded systems
- Native or machine code compilation: no LLVM, GCC, assembly, or bytecode emission occurs anywhere in this pipeline
- Runtime execution environment: the compiler produces a CompileResult data structure, not executable artifacts that are subsequently run
- npm/yarn registry publishing: no package is published to a registry as part of this compilation workflow
- Database schema migrations or persistence layer modifications: entity maps are in-memory pipeline constructs, not database records
- Frontend UI rendering or browser-targeted output: the ada compiler is a server-side/Node.js pipeline tool
- Container orchestration, Kubernetes, or deployment infrastructure: compilation is a local/CI monorepo operation
- Gap resolution strategies other than collapse: reassignment, deletion, reordering, and partial-fill are explicitly excluded by C5
- Provenance chains of any hop count other than three: two-hop, four-hop, or variable-length chains are invalid by definition in this domain
- Component counts other than exactly 10 in the BlueprintComponentRegistry: over- or under-population is a hard invariant violation
- Cross-language interop or FFI: the entire pipeline is TypeScript/Node.js with no foreign function interface
- Manual ordinal reassignment as an alternative to collapse: the C3 gap must be resolved exclusively via the collapse strategy

## Build Order
1. **BlueprintRegistryLoader** `BlueprintRegistry`
2. **WorkspacePackageScanner** `WorkspacePackages`
3. **C3GapCollapseResolver** `ComponentPackageBinding`
4. **ProvenanceChainValidator** `ProvenanceAudit`
5. **EntityExtractor** `EntityExtraction`
6. **ENTGateEvaluator** `ENTGate`
7. **PipelineOrchestrator** `PipelineExecution`

## Ada MCP
The MCP server is the spec authority. Pull context on demand — never assume from memory.

**Start of every task:** call `ada.advance_execution(agentId)` — returns your task brief, bounded context contract, and execution instructions.

**Before modifying any entity:**
- `ada.query_constraints(entityName)` — get invariants and constraints
- `ada.check_drift(description)` — verify a planned action against original intent

**During execution:**
- `ada.get_contract(boundedContext)` — read your delegation contract
- `ada.get_workflow(workflowName)` — get step-by-step workflow with Hoare triples
- `ada.report_execution_failure(component, description)` — request retry guidance
- `ada.set_task_status(component, 'complete', [evidence])` — mark complete

## Compilation Health
**Decision:** ACCEPT  **Confidence:** 88%  **Gates:** 100%

## This Session
You are the lead agent. Call `ada.advance_execution(agentId)` to get your first task. Follow the execution brief. Verify postconditions before marking complete.
