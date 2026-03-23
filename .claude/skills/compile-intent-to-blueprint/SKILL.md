---
name: compile-intent-to-blueprint
description: "Use when user executes `ada compile "<natural language intent>"` pattern detected."
---

# compile-intent-to-blueprint

Trigger: user executes `ada compile "<natural language intent>"`

## Steps
1. **ingest-raw-intent**
   - Pre: `rawText is non-empty string AND apiKeyConfig.keyValue is present AND apiKeyConfig.provider is reachable`
   - Action: `create Intent record with submittedAt timestamp, compute fingerprint hash of rawText, initialize ambiguityScore to null`
   - Post: `Intent exists with fingerprint assigned AND submittedAt recorded AND ambiguityScore is null (pending analysis)`

2. **tokenize-and-span**
   - Pre: `Intent record exists with non-null rawText AND fingerprint is assigned`
   - Action: `segment rawText into TextSpan array by sentence and clause boundaries, assign startIndex and endIndex to each span`
   - Post: `one or more TextSpan records exist referencing the Intent AND every character of rawText is covered by at least one span`

3. **extract-semantic-fragments**
   - Pre: `TextSpan array is non-empty AND CompilationRun is in state PARSING AND PinnedPrompt for stage FRAGMENT_EXTRACTION is loaded from PromptRegistry`
   - Action: `invoke LLM with pinned prompt at temperature=0.0 and structured-output schema, map each TextSpan to one or more SemanticFragment records with role (ENTITY_HINT | PROCESS_HINT | CONSTRAINT_HINT | AMBIGUOUS) and normalizedValue`
   - Post: `every TextSpan has at least one SemanticFragment AND each SemanticFragment has a role AND ambiguous flag is set on fragments with role=AMBIGUOUS`

4. **evaluate-ambiguity**
   - Pre: `all SemanticFragments are assigned AND Intent.ambiguityScore is computable from fragment count where ambiguous=true`
   - Action: `compute ambiguityScore as ratio of ambiguous fragments to total fragments, compare against configured AMBIGUITY_THRESHOLD; if score exceeds threshold transition to ClarificationLoop, else mark Intent as UNAMBIGUOUS`
   - Post: `Intent.ambiguityScore is a decimal in [0.0, 1.0] AND Intent is in state UNAMBIGUOUS or AWAITING_CLARIFICATION`

5. **run-clarification-loop**
   - Pre: `Intent is in state AWAITING_CLARIFICATION AND at least one SemanticFragment has ambiguous=true AND stdin is a TTY`
   - Action: `for each ambiguous SemanticFragment in priority order: render clarification prompt to stdout, read ClarificationAnswer from stdin, update fragment normalizedValue and set ambiguous=false, record ClarificationAnswer linked to fragment`
   - Post: `all previously ambiguous SemanticFragments have ambiguous=false OR user has explicitly skipped them AND Intent transitions to UNAMBIGUOUS or PARTIALLY_RESOLVED`

6. **emit-entity-models**
   - Pre: `SemanticFragments with role=ENTITY_HINT exist AND Intent is UNAMBIGUOUS or PARTIALLY_RESOLVED AND CompilationRun is in state SEMANTIC_ANALYSIS AND PinnedPrompt for ENTITY_EMISSION is loaded`
   - Action: `invoke LLM with pinned entity-emission prompt at temperature=0.0; for each ENTITY_HINT fragment generate EntityModel with domainType, AttributeDefinitions, RelationshipDefinitions, ConstraintDefinitions; attach provenanceRef linking to source SemanticFragment and TextSpan`
   - Post: `one EntityModel exists per distinct ENTITY_HINT fragment AND each EntityModel.provenanceRef is non-null AND each EntityModel has at least one AttributeDefinition`

7. **emit-process-flows**
   - Pre: `SemanticFragments with role=PROCESS_HINT exist AND Intent is UNAMBIGUOUS or PARTIALLY_RESOLVED AND CompilationRun is in state SEMANTIC_ANALYSIS AND PinnedPrompt for PROCESS_EMISSION is loaded`
   - Action: `invoke LLM with pinned process-emission prompt at temperature=0.0; generate ProcessFlow with ordered ProcessSteps, DecisionNodes, and Transitions; assign ordinalPosition to each step; attach provenanceRef per step and decision node`
   - Post: `one ProcessFlow exists per coherent PROCESS_HINT cluster AND each ProcessStep has ordinalPosition >= 1 AND no two steps share the same ordinalPosition within a flow AND all provenanceRefs are non-null`

8. **assemble-blueprint**
   - Pre: `EntityModel list and ProcessFlow list are both produced (may be empty) AND all ProvenanceRecords are written AND CompilationRun is in state EMITTING`
   - Action: `instantiate Blueprint record linking EntityModels, ProcessFlows, ProvenanceRecords, and DeterminismMetadata; assign blueprintId; set GovernanceStatus to PENDING; serialize to BlueprintSchema-validated JSON`
   - Post: `Blueprint record exists with non-null blueprintId AND all linked entity and process artefacts are reachable from Blueprint AND GovernanceStatus is PENDING AND serialized JSON conforms to BlueprintSchema`

9. **validate-governance**
   - Pre: `Blueprint exists with GovernanceStatus=PENDING AND BlueprintSchema is loaded AND ValidationRules are loaded from SchemaGovernance context`
   - Action: `evaluate each ValidationRule against Blueprint; collect PolicyViolations; if zero violations set GovernanceStatus=COMPLIANT; if violations exist set GovernanceStatus=VIOLATED and attach PolicyViolation list to Blueprint`
   - Post: `GovernanceStatus is COMPLIANT or VIOLATED (never PENDING) AND PolicyViolation list is empty iff GovernanceStatus=COMPLIANT AND CompilationRun transitions to COMPLETE or GOVERNANCE_FAILED`

10. **write-blueprint-output**
   - Pre: `Blueprint GovernanceStatus is COMPLIANT or UNVALIDATED or (VIOLATED and --strict is NOT set) AND CompilationRun is in state COMPLETE or GOVERNANCE_FAILED with non-strict mode`
   - Action: `write serialized Blueprint JSON to stdout or to --output file path; write ProvenanceRecord manifest to sidecar file if --provenance flag set; print compilation summary to stderr`
   - Post: `Blueprint JSON is written to destination without truncation AND if --provenance flag set then ProvenanceRecord sidecar file exists AND CompilationRun transitions to WRITTEN`
