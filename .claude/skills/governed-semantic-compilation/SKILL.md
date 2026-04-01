---
name: governed-semantic-compilation
description: "Use when user invokes 'ada compile' with raw intent string pattern detected."
---

# governed-semantic-compilation

Trigger: user invokes 'ada compile' with raw intent string

## Steps
1. **create-compilation-run**
   - Pre: `rawIntent is non-empty string AND ~/.ada/ directory is writable AND no active CompilationRun exists for this session`
   - Action: `instantiate CompilationRun record with runId=uuid(), set startedAt=now(), set decision=PENDING, write initial WorldState version 0 to .ada/state.json, open provenance.db transaction`
   - Post: `CompilationRun row exists in storage with runId, startedAt, decision=PENDING; WorldState persisted with version=0; provenance.db transaction is open and associated with runId`

2. **run-intent-analysis-stage**
   - Pre: `CompilationRun.decision=PENDING AND PipelineStage(INT) status=PENDING AND LLM endpoint reachable AND rawIntent loaded into context`
   - Action: `invoke LLM with INT-stage prompt carrying rawIntent; extract goals[], constraints[], unknowns[], challenges[]; construct IntentGraph; compute postcode PostcodeAddress(prefix=INT, stage=1, hash=sha256(IntentGraph content)); write ProvenanceRecord(stage=INT) to provenance.db; stamp PipelineStage(INT).postcode`
   - Post: `IntentGraph entity populated with non-empty goals and constraints; PipelineStage(INT).status=COMPLETED; PostcodeAddress(INT) written to provenance.db and manifest.json; no unknowns remain unacknowledged`

3. **run-domain-context-stage**
   - Pre: `PipelineStage(INT).status=COMPLETED AND IntentGraph.postcode is valid AND PipelineStage(DOM) status=PENDING`
   - Action: `invoke LLM with DOM-stage prompt carrying IntentGraph; identify bounded contexts, entities, relationships, ubiquitous language; construct DomainContext; compute PostcodeAddress(prefix=DOM, stage=2, hash=sha256(DomainContext), upstreamPostcodes=[INT.postcode]); write ProvenanceChain(INT→DOM) to provenance.db`
   - Post: `DomainContext populated with bounded contexts and entity vocabulary; ProvenanceChain(INT→DOM) written; PipelineStage(DOM).status=COMPLETED; PostcodeAddress(DOM) in manifest.json`

4. **run-entity-and-process-modeling-stages**
   - Pre: `PipelineStage(DOM).status=COMPLETED AND DomainContext.postcode valid AND all 12 canonical entities pre-declared in domain model`
   - Action: `invoke LLM sequentially for ENT stage (entity model with invariants) then PROC stage (process model with Hoare triples); for ENT: verify all 12 pre-declared entities appear with invariants intact, compute PostcodeAddress(ENT); for PROC: extract workflows, state transitions, temporal relations, compute PostcodeAddress(PROC); write ProvenanceChain(DOM→ENT) and ProvenanceChain(ENT→PROC); update manifest.json with both postcodes`
   - Post: `all 12 canonical entities present in entity model with invariants; process model contains at least 2 workflows with Hoare triples; PipelineStage(ENT).status=COMPLETED AND PipelineStage(PROC).status=COMPLETED; provenance chain unbroken DOM→ENT→PROC`

5. **run-governor-decision-stage**
   - Pre: `PipelineStage(INT,DOM,ENT,PROC,NFR,RISK,AUDIT,BUILD) all status=COMPLETED AND all postcodes present in manifest.json AND provenance chain is contiguous from INT through BUILD`
   - Action: `invoke LLM GOV-stage with full accumulated blueprint; compute coverageScore (entities covered / total required), coherenceScore (inter-stage consistency), gatePassRate (stages passed / total); evaluate ACCEPT/REJECT/AMEND decision; write GovernorDecision with confidence score; stamp blueprint with blueprintPostcode; update CompilationRun.decision`
   - Post: `CompilationRun.decision ∈ {ACCEPTED, REJECTED, AMENDED}; blueprintPostcode written to manifest.json; GovernorDecision record persisted with confidence and score breakdown; if ACCEPTED then all output artifact generation is unblocked`

6. **emit-output-artifacts**
   - Pre: `CompilationRun.decision=ACCEPTED AND blueprintPostcode present AND GOV stage postcode in manifest.json AND target output paths writable`
   - Action: `generate CLAUDE.md from blueprint summary and scope with Ada-ISO exclusions; generate 11 agent files (.claude/agents/*.md) for 8 bounded contexts plus 3 orchestration agents, each with MCP tool directives and prohibited actions; generate .mcp.json with 22 tools wired to .ada/state.json; generate hooks (PostToolUse, PreCompact, SessionEnd); generate .ada/state.json initial WorldState; generate BUILD.md with stack preset, file tree, and acceptance criteria from Hoare triples; stamp each artifact with blueprintPostcode in header comment`
   - Post: `all 6 artifact classes exist on disk: CLAUDE.md, .claude/agents/*.md (11 files), .mcp.json, hook scripts (3), .ada/state.json, BUILD.md; each artifact contains blueprintPostcode header; no artifact references Ada ISO language constructs; .ada/manifest.json updated with artifact SHAs`
