---
name: targeted-partial-recompilation
description: "Use when scope change event detected OR PolicyViolation in GOV stage requests re-run OR operator issues partial-recompile command with stage target pattern detected."
---

# targeted-partial-recompilation

Trigger: scope change event detected OR PolicyViolation in GOV stage requests re-run OR operator issues partial-recompile command with stage target

## Steps
1. **identify-recompilation-scope**
   - Pre: `active CompilationRun exists with a valid SessionCheckpoint AND target stage name is a valid pipeline stage identifier (PER, ENT, PRO, SYN, AUD, or GOV)`
   - Action: `load SessionCheckpoint, identify target stage and all downstream dependent stages, mark those PipelineState nodes as stale in context graph, preserve upstream stage artifacts and their postcodes unchanged`
   - Post: `stale PipelineState nodes identified and marked, upstream artifacts remain valid with original postcodes, recompilation scope recorded in IterationRecord with rationale`

2. **re-execute-stale-stages**
   - Pre: `IterationRecord with valid scope exists AND all stale PipelineState nodes are unlocked AND upstream artifacts postcodes are confirmed valid`
   - Action: `execute each stale stage in topological order from target stage through GOV, reusing upstream artifacts by postcode reference, generating new postcodes only for re-executed stages, updating ProvenanceRecords with new upstream links where postcode versions changed`
   - Post: `all previously-stale stages now have fresh PipelineState with new postcodes, new ProvenanceRecords reference both old upstream postcodes and new re-executed postcodes, Blueprint updated with SYN re-run, context graph reflects new artifact versions`
