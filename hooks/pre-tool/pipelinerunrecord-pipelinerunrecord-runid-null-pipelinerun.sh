#!/bin/bash
# Invariant: pipelineRunRecord.runId !== null && pipelineRunRecord.runId.length > 0
# Entity: PipelineRunRecord
# Description: the run must have a stable ID; all ENT artifacts reference the runId and a null ID makes the entire artifact graph unanchored
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRunRecord.runId !== null && pipelineRunRecord.runId.length > 0
exit 0
