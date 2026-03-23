---
name: semantic-compilation-pipeline
description: "Use when user submits raw intent string via CLI pattern detected."
---

# semantic-compilation-pipeline

Trigger: user submits raw intent string via CLI

## Steps
1. **parse-intent-graph**
   - Pre: `rawIntent is non-empty string and DeterminismMetadata is initialised with frozen modelId and temperature=0`
   - Action: `LLM parses rawIntent into IntentGraph with goals, constraints, unknowns, and assigns postcode`
   - Post: `IntentGraph.postcode is set, IntentGraph.goals is non-empty, all IntentUnknowns have impact classification`

2. **evaluate-ambiguity-gate**
   - Pre: `IntentGraph is present and postcode is set`
   - Action: `inspect IntentGraph.unknowns; for each unknown with impact=blocking generate a ClarificationRequest with suggestedDefault`
   - Post: `all blocking unknowns have a ClarificationRequest assigned, or zero blocking unknowns exist`

3. **model-domain**
   - Pre: `IntentGraph.postcode is set and zero blocking unknowns remain unresolved`
   - Action: `derive DomainContext from IntentGraph: identify domain, stakeholders, ubiquitousLanguage, and excludedConcerns; open ProvenanceGate from IntentGraph.postcode`
   - Post: `DomainContext.postcode is set and references IntentGraph.postcode as parent; ProvenanceGate PASSED with entropyEstimate < threshold`

4. **map-entities**
   - Pre: `DomainContext.postcode is set and ProvenanceGate from model-domain has PASSED`
   - Action: `derive EntityMap from DomainContext: enumerate entities with properties, classify boundedContexts, open ProvenanceGate from DomainContext.postcode`
   - Post: `EntityMap.entities is non-empty, each entity belongs to exactly one boundedContext, EntityMap.postcode set, ProvenanceGate PASSED`

5. **define-process**
   - Pre: `EntityMap.postcode is set, EntityMap is not degraded, ProvenanceGate from map-entities has PASSED`
   - Action: `derive ProcessFlow from EntityMap: define workflows, state machines, temporal relations, and failure modes for all entities with lifecycle states; open ProvenanceGate from EntityMap.postcode`
   - Post: `ProcessFlow covers every entity in EntityMap, all stateful entities have at least one state machine, ProvenanceGate PASSED`

6. **synthesize-blueprint**
   - Pre: `DomainContext, EntityMap, and ProcessFlow all have postcodes set and all their ProvenanceGates have PASSED`
   - Action: `merge DomainContext, EntityMap, and ProcessFlow into a unified Blueprint; assign Blueprint.postcode derived from all three parent postcodes; record DeterminismMetadata snapshot`
   - Post: `Blueprint is internally consistent, all cross-references between entities and workflows resolve, Blueprint.postcode encodes all parent postcodes`

7. **audit-blueprint**
   - Pre: `Blueprint is present with valid postcode and all cross-references resolved`
   - Action: `run policy checks against Blueprint: verify provenance chain is unbroken, cumulativeEntropy is below ceiling, no unchallenged DeadlockRisk or ContextConflict exists; produce AuditReport with all PolicyViolations`
   - Post: `AuditReport is complete with PASS or FAIL verdict; every PolicyViolation has a severity (blocking | advisory) and a reference to the Blueprint element that triggered it`

8. **govern-blueprint**
   - Pre: `AuditReport is present with verdict PASS or FAIL and all blocking violations are resolved or explicitly accepted by policy`
   - Action: `Governor evaluates AuditReport and emits GovernorDecision: ACCEPT if no blocking violations, REJECT if violations are unresolvable, ITERATE if violations are resolvable by re-running from a specific stage`
   - Post: `GovernorDecision is one of {ACCEPT, REJECT, ITERATE}; if ITERATE, decision includes reentryStage and violationIds; if ACCEPT, Blueprint is emitted as final output with CompilationRun sealed`
