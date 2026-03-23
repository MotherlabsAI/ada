---
name: syn-gate-re-evaluation
description: "Use when G5 invoked: new RunArtifact from INT pass-2 produced; SYNGate re-evaluation triggered downstream pattern detected."
---

# syn-gate-re-evaluation

Trigger: G5 invoked: new RunArtifact from INT pass-2 produced; SYNGate re-evaluation triggered downstream

## Steps
1. **detect-upstream-int-completion**
   - Pre: `new PipelineRun exists with stage == INT; aggregateEntropy <= 0.30; passOrdinal == 2; RunArtifact immutable == true`
   - Action: `SYNGate polls or receives event from PipelineExecution context that INT stage run with passOrdinal == 2 is COMPLETED; bind new runId as upstreamRunId in SYNGate context`
   - Post: `SYNGate.upstreamStage == INT confirmed; upstreamRunId bound; SYNGate ready to initiate validation`

2. **load-resolved-bindings-for-validation**
   - Pre: `upstreamRunId bound in SYNGate context; RunArtifact for upstreamRunId exists with immutable == true and non-empty resolvedBindingIds`
   - Action: `read RunArtifact.resolvedBindingIds list; load each EntityBinding by bindingId; confirm each has resolved == true and perBindingEntropy < 0.30`
   - Post: `full list of resolved EntityBindings available to SYN validation process; totalBindingCount recorded; no unresolved or high-entropy bindings present in set`

3. **execute-syn-validation-pass**
   - Pre: `resolved EntityBindings loaded; totalBindingCount > 0; SYNGate.requiredPassRate == 0.83`
   - Action: `run SYN validation logic over each EntityBinding; a binding passes SYN if canonicalTargetId is reachable in entity graph and perBindingEntropy < 0.30; count passedBindingCount; compute passRate = passedBindingCount / totalBindingCount`
   - Post: `SYNValidationResult created with runId = upstreamRunId; passRate computed; passedBindingCount and totalBindingCount set; passed = (passRate >= 0.83)`

4. **evaluate-syn-gate-outcome**
   - Pre: `SYNValidationResult exists with passRate and passed fields set; not ABORTED`
   - Action: `read SYNValidationResult.passed; if true, transition SYNGate to OPEN and emit SYN_PASS event; if false, transition SYNGate to BLOCKED and emit SYN_FAIL event with passRate value`
   - Post: `SYNGate state is either OPEN (passRate >= 0.83) or BLOCKED (passRate < 0.83); event emitted to downstream pipeline stages; G5 success criterion evaluated`
