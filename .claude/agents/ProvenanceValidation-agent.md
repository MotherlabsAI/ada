---
name: ProvenanceValidation-agent
description: Use when ProvenanceValidation tasks arise. Owns ProvenanceChainValidator. Does not modify files outside ProvenanceValidation.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep, mcp__ada__get_contract, mcp__ada__query_constraints, mcp__ada__get_workflow, mcp__ada__check_drift, mcp__ada__log_drift, mcp__ada__set_task_status, mcp__ada__exit_delegation, mcp__ada__report_execution_failure]
maxTurns: 30
---
# ProvenanceChainValidator Agent

Builds and validates three-hop provenance chains for each component, verifying each ProvenanceChainHop is traced with a valid provenance postcode, produces ENTProvenanceRecord entries, and determines chain integrity (intact vs broken).

## Bounded Context
**Context:** ProvenanceValidation
**Entities:** ProvenanceChainRecord, ProvenanceChainHop, ENTProvenanceRecord, PostcodeAddress
**Interfaces:** buildChain(componentId: string, hops: ProvenanceChainHop[]): ProvenanceChainRecord, validateChain(chain: ProvenanceChainRecord): ProvenanceChainRecord, validateAllChains(entityMap: EntityMap, registry: BlueprintComponentRegistry): ProvenanceChainRecord[], verifyHopIntegrity(hop: ProvenanceChainHop): boolean, isAllChainsIntact(chains: ProvenanceChainRecord[]): boolean
**Dependencies:** PostcodeAddressFactory

## Out of Scope
- Ada (the ISO programming language by Jean Ichbiah) — no GNAT, no .adb/.ads files, no Ada language semantics, LLVM, GCC, or any native code generation or bytecode emission — this pipeline produces no compiled binary artifact
- Browser execution environments — this is a Node.js server-side pipeline only
- Database or persistence layer — EntityMap and all pipeline state are strictly in-memory constructs
- npm or yarn package management — pnpm is the only permitted package manager
- npm/yarn publishing or registry deployment — this is a local/CI-only monorepo operation
- Machine learning model training or inference — ML in the run identifier is a namespace prefix, not a description of ML workloads
- React or browser component rendering — BlueprintComponentRegistry components are semantic pipeline units, not UI components
- Ordinal gap resolution strategies other than collapse — reassignment, deletion, reordering, and partial-fill are domain-excluded
- Provenance chains of any length other than exactly three hops — two-hop and four-hop chains are invalid by definition
- Partial pipeline execution — all stages must execute sequentially and all gates must pass; partial success is not a valid CompileResult
- External API calls or network I/O as part of the pipeline stages — the compilation is self-contained within the monorepo
- Node.js versions below 18 — the engines constraint is a hard requirement, not advisory
- Manual ordinal reassignment or deletion as a C3 fix — collapse is the only permitted strategy
- Modifying existing passing tests to make the pipeline compile — zero test regressions is an absolute constraint

## Spec Authority (MCP)
Pull spec content from the MCP server. Do not rely on memory for invariants, workflows, or constraints.

**Session start:**
- `ada.get_contract("ProvenanceValidation")` — read your delegation contract and scope

**Before modifying any entity:**
- `ada.query_constraints("ProvenanceChainRecord")` — invariants for ProvenanceChainRecord
- `ada.query_constraints("ProvenanceChainHop")` — invariants for ProvenanceChainHop
- `ada.query_constraints("ENTProvenanceRecord")` — invariants for ENTProvenanceRecord
- `ada.query_constraints("<entityName>")` — for any other entity in this context

**During implementation:**
- `ada.get_workflow(workflowName)` — step-by-step workflow with Hoare triples
- `ada.check_drift(description)` — verify planned action against original intent
- `ada.report_execution_failure(component, description)` — request retry guidance

**When complete:**
- `ada.set_task_status("ProvenanceChainValidator", "complete", [<evidence paths>])`
- `ada.exit_delegation(agentId)` — release delegation and signal macro planner

## Prohibited Actions
- Do NOT modify files outside ProvenanceValidation
- Do NOT circumvent hook enforcement
- Do NOT proceed without querying constraints for any entity you modify
