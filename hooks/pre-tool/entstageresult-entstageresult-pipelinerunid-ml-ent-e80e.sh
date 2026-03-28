#!/bin/bash
# Invariant: entStageResult.pipelineRunId === 'ML.ENT.e80e3c97/v1'
# Entity: ENTStageResult
# Description: the result must belong to the specific stalled run; a result for a different run does not unblock G1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entStageResult.pipelineRunId === 'ML.ENT.e80e3c97/v1'
exit 0
