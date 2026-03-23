---
name: int-stage-second-disambiguation-pass
description: "Use when G1 invoked: re-execute INT stage for run ML.INT.01d32819/v1 with ordinal-2 disambiguation pass pattern detected."
---

# int-stage-second-disambiguation-pass

Trigger: G1 invoked: re-execute INT stage for run ML.INT.01d32819/v1 with ordinal-2 disambiguation pass

## Steps
1. **resolve-prior-run-by-id**
   - Pre: `runId 'ML.INT.01d32819/v1' is registered in PipelineExecution context; no direct artifact reference held by caller`
   - Action: `look up PipelineRun where runId == 'ML.INT.01d32819/v1'; read aggregateEntropy, passOrdinal, stage from run record only`
   - Post: `prior run metadata loaded into execution context; stage == INT; passOrdinal == 1; aggregateEntropy == 0.72; no artifact bytes fetched`

2. **hydrate-ambiguity-set**
   - Pre: `AmbiguitySet with sourceRunId == 'ML.INT.01d32819/v1' exists; entityCount == 26; prior run metadata loaded`
   - Action: `load AmbiguitySet record by sourceRunId; materialise memberEntityIds list of 26 CanonicalEntity references; verify each entityId resolves and ambiguous == true`
   - Post: `ambiguitySet in memory contains exactly 26 entity references; all members have ambiguous == true; setId bound to execution context`

3. **instantiate-stateless-int-stage**
   - Pre: `INTStage config available with stateless == true; entropyThreshold == 0.30; ambiguitySetSize == 26; no prior session state present`
   - Action: `construct fresh INTStage execution context; bind entropyThreshold = 0.30; bind ambiguitySetSize from hydrated set; assert no mutable state carried from prior run`
   - Post: `INTStage instance is live; stateless == true confirmed; entropyThreshold bound; no session references to ML.INT.01d32819/v1 exist in new context`

4. **create-disambiguation-pass-record**
   - Pre: `INTStage instance is live and stateless; ambiguitySet hydrated; passOrdinal for new pass == 2`
   - Action: `create DisambiguationPass with passId = new UUID; ordinal = 2; sourceRunId = 'ML.INT.01d32819/v1'; targetAmbiguitySetId = setId from context; producedRunId = null (pending)`
   - Post: `DisambiguationPass record persisted in PipelineExecution context with status PENDING; producedRunId still null`

5. **execute-integration-mapping-resolution**
   - Pre: `DisambiguationPass PENDING; 26 ambiguous EntityBindings loaded; each IntegrationMapping has conflicting == true for targeted entities`
   - Action: `for each of 26 entities: score candidateTargetIds via disambiguation model; select highest-confidence candidateTargetId as selectedTargetId; update IntegrationMapping.conflicting = false; compute perBindingEntropy for each resulting EntityBinding`
   - Post: `all 26 IntegrationMappings have selectedTargetId assigned and conflicting == false; 26 EntityBindings each have perBindingEntropy computed and resolved == true`

6. **filter-bindings-by-entropy-threshold**
   - Pre: `all targeted EntityBindings have perBindingEntropy computed; EntropyThreshold.value == 0.30`
   - Action: `iterate EntityBindings; retain bindings where perBindingEntropy < 0.30; mark bindings where perBindingEntropy >= 0.30 as FILTERED_OUT; update resolvedBindingIds list to contain only retained binding IDs`
   - Post: `resolvedBindingIds contains only bindings with perBindingEntropy < 0.30; FILTERED_OUT bindings excluded from downstream artifact; count of retained bindings recorded`

7. **compute-aggregate-entropy**
   - Pre: `resolvedBindingIds non-empty list available; all retained bindings have perBindingEntropy < 0.30`
   - Action: `compute AggregateEntropy.value = mean(perBindingEntropy) over retained bindings; set AggregateEntropy.bindingCount = count(resolvedBindingIds); associate AggregateEntropy.runId = new run ID (pending assignment)`
   - Post: `AggregateEntropy.value computed and <= 0.30; bindingCount matches retained set size`

8. **produce-versioned-run-artifact**
   - Pre: `aggregateEntropy <= 0.30; resolvedBindingIds non-empty; DisambiguationPass in PENDING state; INTStage stateless confirmed`
   - Action: `create new PipelineRun with new runId; set version = derived from parent + '.2'; stage = INT; aggregateEntropy = computed value; passOrdinal = 2; create RunArtifact with runId = new runId; parentRunId = 'ML.INT.01d32819/v1'; stageLabel = 'INT'; immutable = true; resolvedBindingIds = retained list; update DisambiguationPass.producedRunId = new runId; transition DisambiguationPass to COMPLETED`
   - Post: `new PipelineRun persisted with aggregateEntropy <= 0.30 and passOrdinal == 2; RunArtifact immutable == true with parentRunId linked; DisambiguationPass.producedRunId set and status == COMPLETED; prior run ML.INT.01d32819/v1 unchanged`
