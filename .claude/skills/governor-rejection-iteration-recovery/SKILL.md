---
name: governor-rejection-iteration-recovery
description: "Use when GovernorDecision = REJECT emitted for a CompilationRun pattern detected."
---

# governor-rejection-iteration-recovery

Trigger: GovernorDecision = REJECT emitted for a CompilationRun

## Steps
1. **record-iteration-state**
   - Pre: `GovernorDecision(REJECT) exists with valid GOV postcode; CompilationRun is in state 'awaiting_governance'; IterationRecord counter is below policy maximum`
   - Action: `create IterationRecord with rejection rationale, current iteration number, and postcode of each stage artifact; transition CompilationRun to state 'iterating'; persist SessionCheckpoint with full pipeline state snapshot`
   - Post: `IterationRecord exists and references all stage postcodes from rejected run; SessionCheckpoint stored; CompilationRun.iterationCount incremented; previous artifacts marked as SUPERSEDED in provenance store`

2. **identify-reentry-stage**
   - Pre: `IterationRecord exists with rejection rationale; REJECT rationale contains at least one stage-level failure attribution`
   - Action: `parse rejection rationale to identify the earliest pipeline stage implicated by Governor findings; determine re-entry stage as the minimum stage index in the implication set; validate that all stages from re-entry forward can be legally re-executed given the current SessionCheckpoint`
   - Post: `re-entry stage is set to one of: INT, PER, ENT, PRO, SYN, AUD; all artifacts from re-entry stage forward are invalidated; artifacts before re-entry stage are preserved and their postcodes remain valid for the next iteration`

3. **apply-governor-directives**
   - Pre: `re-entry stage is set; IterationRecord contains Governor directives (PolicyViolation details, suggested constraint additions, scope adjustments); IntentGraph is accessible for modification if re-entry is INT`
   - Action: `translate Governor directives into concrete adjustments: add constraints to IntentGraph if applicable, flag specific entities for re-extraction, annotate ProcessFlow with Governor-mandated boundaries; stamp each adjustment with GOV postcode as directive provenance; create new CompilationRun iteration targeting re-entry stage`
   - Post: `all Governor directives are encoded as pipeline-consumable inputs at the appropriate stage; each directive is traceable to the GovernorDecision postcode; new CompilationRun iteration initialized in state 'running' at re-entry stage`

4. **resume-pipeline-from-reentry**
   - Pre: `new CompilationRun iteration is in state 'running'; re-entry stage artifacts are invalidated; Governor directives encoded; all pre-reentry artifacts have valid postcodes in provenance store`
   - Action: `execute pipeline stages from re-entry stage through GOV sequentially; each stage reads pre-reentry artifacts from provenance store where applicable (stages before re-entry are not re-executed); all new artifacts receive fresh postcodes chained to both their upstream stage postcodes and the GOV directive postcode`
   - Post: `pipeline completes through GOV; new GovernorDecision issued; if ACCEPT, CompileResult references complete provenance chain including iteration history; if REJECT again, IterationRecord counter incremented and recovery workflow re-triggers from step 1`
