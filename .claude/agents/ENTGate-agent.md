---
name: ENTGate-agent
description: Use when ENTGate tasks arise. Owns ENTGateEvaluator. Does not modify files outside ENTGate.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep, mcp__ada__get_contract, mcp__ada__query_constraints, mcp__ada__get_workflow, mcp__ada__check_drift, mcp__ada__log_drift, mcp__ada__set_task_status, mcp__ada__exit_delegation, mcp__ada__report_execution_failure]
maxTurns: 30
---
# ENTGateEvaluator Agent

Evaluates the ENT gate to determine whether pipeline run ML.ENT.e80e3c97/v1 can proceed. Checks all ENTBlockers are cleared (linkedGapId references resolved C3AssignmentGap), verifies provenance integrity, confirms entity count > 0, and produces a passing ENTStageResult. Manages StalledPipelineRun resumability — sets resumable=true only when all blockers are cleared. Transitions ENTStageResult through states: pending → evaluating → passing/blocking. Corresponds to the evaluate-ent-gate pipeline step.

## Bounded Context
**Context:** ENTGate
**Entities:** ENTGateRecord, ENTStageResult, ENTBlocker, StalledPipelineRun
**Interfaces:** evaluateGate(entityMap: EntityMap, provenanceChains: ProvenanceChainRecord[], c3Gap: C3AssignmentGap): ENTGateRecord, checkBlockers(stalledRun: StalledPipelineRun): ENTBlocker[], clearBlocker(blocker: ENTBlocker, clearanceProvenancePostcode: string): ENTBlocker, produceStageResult(gateRecord: ENTGateRecord, pipelineRunId: string): ENTStageResult
**Dependencies:** EntityExtractor, ProvenanceChainValidator, C3GapCollapseResolver

## Out of Scope
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

## Spec Authority (MCP)
Pull spec content from the MCP server. Do not rely on memory for invariants, workflows, or constraints.

**Session start:**
- `ada.get_contract("ENTGate")` — read your delegation contract and scope

**Before modifying any entity:**
- `ada.query_constraints("ENTGateRecord")` — invariants for ENTGateRecord
- `ada.query_constraints("ENTStageResult")` — invariants for ENTStageResult
- `ada.query_constraints("ENTBlocker")` — invariants for ENTBlocker
- `ada.query_constraints("<entityName>")` — for any other entity in this context

**During implementation:**
- `ada.get_workflow(workflowName)` — step-by-step workflow with Hoare triples
- `ada.check_drift(description)` — verify planned action against original intent
- `ada.report_execution_failure(component, description)` — request retry guidance

**When complete:**
- `ada.set_task_status("ENTGateEvaluator", "complete", [<evidence paths>])`
- `ada.exit_delegation(agentId)` — release delegation and signal macro planner

## Prohibited Actions
- Do NOT modify files outside ENTGate
- Do NOT circumvent hook enforcement
- Do NOT proceed without querying constraints for any entity you modify
