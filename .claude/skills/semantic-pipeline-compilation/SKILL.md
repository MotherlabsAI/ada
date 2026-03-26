---
name: semantic-pipeline-compilation
description: "Use when user submits raw natural language intent via CLI REPL or MCP session pattern detected."
---

# semantic-pipeline-compilation

Trigger: user submits raw natural language intent via CLI REPL or MCP session

## Steps
1. **INT-ingest-intent**
   - Pre: `rawIntent string is non-empty AND session has no active CompilationRun in state running`
   - Action: `parse rawIntent into IntentGraph nodes (goals, constraints, unknowns), stamp PostcodeAddress with prefix INT, register ProvenanceRecord with upstream=[] and content=IntentGraph`
   - Post: `IntentGraph exists with postcode INT-{hash}-v1, ProvenanceRecord stored, AggregateEntropy computed, CompilationRun transitions to stage INT-complete`

2. **PER-build-domain-context**
   - Pre: `IntentGraph with valid postcode exists AND AggregateEntropy below threshold AND all ClarificationRequests resolved`
   - Action: `derive DomainContext from IntentGraph: identify domain, enumerate Stakeholders with roles and vocabulary, build ubiquitousLanguage glossary, flag excludedConcerns; stamp PostcodeAddress PER-{hash}-v1; register ProvenanceRecord with upstream=[INT postcode]`
   - Post: `DomainContext persisted with postcode, ubiquitousLanguage has at least one entry per IntentGoal, Stakeholder blind spots recorded, ProvenanceRecord links PER artifact to INT artifact`

3. **ENT-build-entity-model**
   - Pre: `DomainContext with valid PER postcode exists AND ubiquitousLanguage non-empty`
   - Action: `extract Entity list from DomainContext and IntentGraph, assign categories, define EntityInvariants, group into BoundedContexts, stamp PostcodeAddress ENT-{hash}-v1, register ProvenanceRecord upstream=[INT postcode, PER postcode]`
   - Post: `EntityMap persisted with postcode, every Entity has at least one invariant, every BoundedContext has a rootEntity, no entity name collides across bounded contexts without explicit alias`

4. **PRO-define-process-flows**
   - Pre: `EntityMap with valid ENT postcode exists AND all BoundedContexts have rootEntity`
   - Action: `derive ProcessFlow and Workflow instances from IntentGoals, assign WorkflowSteps with HoareTriples referencing EntityMap entities, build StateMachine per lifecycle entity, stamp PostcodeAddress PRO-{hash}-v1, register ProvenanceRecord upstream=[INT, PER, ENT postcodes]`
   - Post: `ProcessFlow persisted with postcode, every Workflow references at least one Entity from EntityMap, every WorkflowStep has precondition+action+postcondition populated, StateMachines cover all entities flagged as lifecycle-bearing`

5. **SYN-synthesize-blueprint**
   - Pre: `ProcessFlow with valid PRO postcode exists AND SYNGate checks pass (no open Challenges, no unresolved UncertaintyMarkers)`
   - Action: `merge IntentGraph, DomainContext, EntityMap, ProcessFlow into unified Blueprint with BlueprintArchitecture and BlueprintComponents, stamp PostcodeAddress SYN-{hash}-v1, register ProvenanceRecord upstream=[INT, PER, ENT, PRO postcodes], write SessionCheckpoint`
   - Post: `Blueprint artifact persisted and addressable by SYN postcode, BlueprintArchitecture lists all components, each BlueprintComponent traces back to at least one EntityMap or ProcessFlow node, SessionCheckpoint saved to disk`

6. **AUD-audit-blueprint**
   - Pre: `Blueprint with valid SYN postcode exists AND Blueprint state is draft`
   - Action: `run AuditReport generation: check invariant coverage, verify all EntityInvariants referenced in Blueprint, validate HoareTriple logical consistency across WorkflowSteps, stamp PostcodeAddress AUD-{hash}-v1, register ProvenanceRecord upstream=[SYN postcode]`
   - Post: `AuditReport persisted with postcode, every PolicyViolation found is listed with severity, Blueprint transitions to audited state, AuditReport linked bidirectionally to Blueprint`

7. **GOV-govern-and-promote**
   - Pre: `AuditReport exists with AUD postcode AND Blueprint is in audited state AND no unresolved critical PolicyViolations`
   - Action: `run GovernorDecision evaluation: assess prompt safety constraints, verify context grounding (no hallucinated entity references remain), stamp PostcodeAddress GOV-{hash}-v1, register ProvenanceRecord upstream=[AUD postcode], transition Blueprint to governed then live, expose artifact via MCP server context graph`
   - Post: `Blueprint is in live state, GovernorDecision recorded with outcome=approved or outcome=conditional, context graph updated with all new postcode nodes and their edges, MCP server can serve Blueprint to AI coding agents`
