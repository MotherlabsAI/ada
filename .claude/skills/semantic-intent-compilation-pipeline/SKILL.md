---
name: semantic-intent-compilation-pipeline
description: "Use when ElicitationSession transitions to HANDED_OFF with draftIntentGraph postcode recorded in HandoffRecord pattern detected."
---

# semantic-intent-compilation-pipeline

Trigger: ElicitationSession transitions to HANDED_OFF with draftIntentGraph postcode recorded in HandoffRecord

## Steps
1. **parse-raw-intent**
   - Pre: `HandoffRecord exists with resolvedGapCount == totalGapCount AND draftIntentGraph.postcode is valid AND CompilationRun.status == PENDING`
   - Action: `LLM parses draftIntentGraph into structured goals[], constraints[], unknowns[], challenges[]; assigns PARSE-stage postcode to output IntentGraph; records ProvenanceRecord with upstreamPostcodes=[draftIntentGraph.postcode]`
   - Post: `IntentGraph entity persists with postcode of form PARSE-<hash>-v<n>; ProvenanceRecord written; PipelineStage[PARSE].status == GATE_PENDING; CompilationRun.stages includes PARSE entry`

2. **enrich-intent-with-domain-context**
   - Pre: `PipelineStage[PARSE].status == PASSED AND IntentGraph.postcode is recorded in ProvenanceChain AND IntentGraph.unknowns is non-null (may be empty)`
   - Action: `agent loads DomainContext and CodebaseContext; resolves any remaining soft unknowns via inference; augments IntentGraph with domain-specific constraints and terminology normalization; assigns ENRICH-stage postcode; appends ProvenanceRecord linking from PARSE postcode`
   - Post: `enriched IntentGraph persists with postcode ENRICH-<hash>-v<n>; ProvenanceChain.hopCount incremented; all previously soft unknowns are either resolved or promoted to hard constraints; PipelineStage[ENRICH].status == GATE_PENDING`

3. **model-bounded-contexts-and-entities**
   - Pre: `PipelineStage[ENRICH].status == PASSED AND enriched IntentGraph.postcode is linked in ProvenanceChain AND IntentGraph.constraints is non-empty`
   - Action: `agent derives bounded context map from enriched IntentGraph; instantiates canonical entities per context with properties and invariants; detects cross-context coupling violations; assigns MODEL-stage postcode; records ProvenanceRecord`
   - Post: `Blueprint.dataModel populated with all 5 bounded contexts (compilation-pipeline, provenance, runtime-governance, self-improvement, elicitation); each bounded context has at least one canonical entity with at least one invariant; PipelineStage[MODEL].status == GATE_PENDING; ProvenanceChain hop recorded`

4. **constrain-scope-and-prohibitions**
   - Pre: `PipelineStage[MODEL].status == PASSED AND Blueprint.dataModel is populated AND IntentGraph.constraints includes out-of-scope entries`
   - Action: `agent extracts all 14 explicit out-of-scope constraints from IntentGraph; encodes each as enforced prohibition with scope boundary, justification, and enforcement mechanism; maps prohibitions to agent hook scripts and CLAUDE.md sections; assigns CONSTRAIN-stage postcode`
   - Post: `Blueprint.scope.outOfScope contains exactly the 14 canonical prohibitions including: ISO Ada language exclusion, browser exclusion, npm/yarn exclusion, in-pipeline database write exclusion; each prohibition has enforcement mechanism specified; PipelineStage[CONSTRAIN].status == GATE_PENDING`

5. **challenge-assumptions-and-conflicts**
   - Pre: `PipelineStage[CONSTRAIN].status == PASSED AND Blueprint.dataModel and Blueprint.scope are populated AND CompilationRun.iterationCount <= 3`
   - Action: `agent generates structured challenges for each assumption, conflict, and ambiguity detected in prior stages; each challenge specifies the claim being challenged, the evidence basis, and the consequence of the claim being wrong; records ENT dual-implementation ambiguity as explicit challenge; assigns CHALLENGE-stage postcode`
   - Post: `Blueprint.challenges is non-empty; ENT canonical path challenge is present and resolved (LLM-backed for semantic judgment, rule-based for deterministic structure); all cross-context entity leaks from MODEL stage have corresponding challenge entries; PipelineStage[CHALLENGE].status == GATE_PENDING`

6. **propose-blueprint-draft**
   - Pre: `PipelineStage[CHALLENGE].status == PASSED AND all BLOCKING challenges have resolution recorded AND Blueprint.resolvedConflicts includes ENT canonical path decision`
   - Action: `agent assembles full Blueprint draft from all prior stage outputs: summary, scope, architecture, dataModel, processModel, nonFunctional, openQuestions, resolvedConflicts, challenges, audit, build; computes coverageScore and coherenceScore; assigns PROPOSE-stage postcode; records ProvenanceRecord linking all upstream stage postcodes`
   - Post: `Blueprint entity persists with all required sections populated; Blueprint.postcode is of form PROPOSE-<hash>-v<n>; coverageScore and coherenceScore recorded on CompilationRun; ProvenanceChain.hopCount does not exceed 3 for ENT artifacts; PipelineStage[PROPOSE].status == GATE_PENDING`

7. **govern-blueprint-decision**
   - Pre: `PipelineStage[PROPOSE].status == PASSED AND CompilationRun.iterationCount <= 3 AND Blueprint.postcode is valid AND gatePassRate is computable from prior stages`
   - Action: `GOV agent evaluates Blueprint against: all invariants from all bounded contexts, gatePassRate of prior stages, coverage and coherence scores, presence of all 14 prohibitions, ENT resolution, provenance chain integrity; emits GovernorDecision of ACCEPT, REJECT, or ITERATE; if ITERATE, produces augmented-intent feedback targeting specific failed sections; increments iterationCount`
   - Post: `GovernorDecision is recorded on CompilationRun; if ACCEPT: CompilationRun.decision=ACCEPTED, gatePassRate >= threshold, proceed to ENT; if ITERATE and iterationCount < 3: augmented-intent fed back to PARSE stage, CompilationRun.status=ITERATING; if REJECT or iterationCount == 3 after ITERATE: CompilationRun.decision=REJECTED, emit FallbackBlueprintResult`

8. **execute-ent-artifact-generation**
   - Pre: `CompilationRun.decision == ACCEPTED AND PipelineStage[GOV].status == PASSED AND Blueprint.resolvedConflicts contains ENT canonical path entry AND ProvenanceChain.hopCount <= 3 for all ENT inputs`
   - Action: `ENT stage routes artifact generation by type: LLM-backed agent path for semantic artifacts (CLAUDE.md, agent files, process model sections); rule-based isolated package path for deterministic structure artifacts (hook scripts, .mcp.json, .ada/state.json schema); each artifact is content-addressed via PostcodeAddress; ENT records ProvenanceRecord per artifact with upstreamPostcodes from Blueprint`
   - Post: `all 6 output artifacts exist: CLAUDE.md, agent files, hook scripts, .mcp.json, .ada/state.json, BUILD.md; each artifact has valid PostcodeAddress; ProvenanceChain for each artifact has hopCount <= 3; PipelineStage[ENT].status == GATE_PENDING; no database writes performed during ENT execution`

9. **emit-compiled-blueprint**
   - Pre: `PipelineStage[ENT].status == PASSED AND all 6 artifacts have valid PostcodeAddresses AND ProvenanceChain is complete from draftIntentGraph to all output artifacts AND CompilationRun.decision == ACCEPTED`
   - Action: `EMIT stage writes all artifacts to their canonical locations; records final Manifest with all artifact postcodes; computes blueprintPostcode as content hash of full artifact set; records final ProvenanceRecord for CompilationRun; sets CompilationRun.completedAt and totalDurationMs; writes .ada/state.json with final WorldState snapshot`
   - Post: `CompilationRun.status == COMPLETE; blueprintPostcode recorded; Manifest persists with all 6 artifact postcodes; .ada/state.json reflects completed run; all ProvenanceRecords form an unbroken chain from draftIntentGraph.postcode to blueprintPostcode; CompilationRun.completedAt is set`
