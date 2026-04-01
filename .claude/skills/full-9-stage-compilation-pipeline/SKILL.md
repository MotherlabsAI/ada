---
name: full-9-stage-compilation-pipeline
description: "Use when CompilationRun initiated with valid IntentGraph and CodebaseContext available for Ada's TypeScript monorepo pattern detected."
---

# full-9-stage-compilation-pipeline

Trigger: CompilationRun initiated with valid IntentGraph and CodebaseContext available for Ada's TypeScript monorepo

## Steps
1. **initialize-compilation-run**
   - Pre: `runId is unique and not present in storage; IntentGraph has been parsed and postcoded; WorldState is stable (uncertaintyScore < 0.4); no active CompilationRun exists for same intent hash`
   - Action: `create CompilationRun record with status=running, record startedAt timestamp, write PipelineState to storage with stageCode=INIT, emit ProvenanceRecord anchoring runId to IntentGraph postcode, initialize MacroPlan with 9 tasks one per pipeline stage`
   - Post: `CompilationRun record exists in storage with status=running; PipelineState has stageCode=INIT; MacroPlan has totalTasks=9 and completedTasks=0; ProvenanceRecord linking runId to IntentGraph postcode is written`

2. **execute-int-stage-intent-parsing**
   - Pre: `CompilationRun status=running; PipelineStage INT is in idle state; raw intent text is non-empty; WorldState.uncertaintyScore < 0.5`
   - Action: `invoke LLM to parse raw intent into structured IntentGraph with goals, constraints, unknowns, challenges fields; validate all G1-G9 goals are represented; assign postcode to IntentGraph; write ProvenanceRecord for INT stage output`
   - Post: `IntentGraph is written to storage with valid postcode; PipelineStage INT transitions to passed; ProvenanceRecord for INT stage references runId as upstream; MacroPlan marks INT task as completed`

3. **execute-ent-stage-entity-extraction**
   - Pre: `PipelineStage INT has status=passed; IntentGraph postcode is recorded; BlueprintComponentRegistry is loaded with 10 components; C3AssignmentGap is resolved`
   - Action: `run entity extraction across 8 bounded contexts, produce EntityMap, verify ENT gate criteria, write ENTGateRecord, verify 3-hop provenance chains for all ENT outputs`
   - Post: `ENTGateRecord has status=passed; EntityMap covers all 8 bounded contexts; all 3-hop provenance chains verified; PipelineStage ENT transitions to passed; StalledPipelineRun cleared if previously stalled`

4. **execute-blueprint-stage**
   - Pre: `PipelineStage ENT has status=passed; EntityMap postcode is recorded; IntentGraph postcode is recorded; all 8 bounded contexts have entity coverage`
   - Action: `invoke LLM to synthesize Blueprint from EntityMap and IntentGraph, populating summary, scope, architecture, dataModel, processModel, nonFunctional, openQuestions, resolvedConflicts, challenges, audit, and build sections; assign Blueprint postcode; write ProvenanceRecord with ENT and INT postcodes as upstream`
   - Post: `Blueprint written to storage with valid postcode; Blueprint.dataModel references all entities from EntityMap; Blueprint.processModel references all bounded contexts; ProvenanceRecord has exactly 2 upstream postcodes (ENT EntityMap, INT IntentGraph)`

5. **execute-remaining-stages-through-provenanceaudit**
   - Pre: `PipelineStage BLUEPRINT has status=passed; Blueprint postcode is recorded; all upstream stage postcodes form a valid directed acyclic provenance graph from IntentGraph root`
   - Action: `sequentially execute stages: componentpackagebinding (bind packages to components), ordinalassignment (assign execution ordinals), workspacepackages (resolve monorepo workspace packages), pipelineexecution (execute bound pipeline), provenanceaudit (verify full provenance chain from all outputs to IntentGraph); each stage writes ProvenanceRecord and updates MacroPlan`
   - Post: `all 9 PipelineStages have status=passed; MacroPlan has completedTasks=9; CompilationRun has status=completed with completedAt timestamp; provenanceaudit stage has verified all output artifacts have traceable chains to IntentGraph; gatePassRate equals 1.0`

6. **emit-compiled-governing-artifacts**
   - Pre: `CompilationRun has status=completed; all 9 stages have status=passed; provenanceaudit has passed; gatePassRate=1.0; Blueprint.build section is non-empty`
   - Action: `generate CLAUDE.md encoding Ada identity as semantic operating system, generate 8 agent files one per bounded context with correct frontmatter and MCP directives, generate hook scripts, generate .mcp.json, update .ada/state.json with new runId and blueprintPostcode, write BUILD.md from Blueprint.build section; assign postcode to each artifact; write ProvenanceRecord for each artifact linking to CompilationRun postcode`
   - Post: `all governing artifacts exist on filesystem with correct postcodes; each artifact ProvenanceRecord links to CompilationRun; CLAUDE.md contains Ada-as-semantic-OS identity constraint; each agent file scoped to exactly 1 of the 8 bounded contexts; .ada/state.json reflects completed runId`
