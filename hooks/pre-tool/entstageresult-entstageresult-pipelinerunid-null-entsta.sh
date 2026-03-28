#!/bin/bash
# Invariant: entStageResult.pipelineRunId !== null && entStageResult.pipelineRunId.length > 0
# Entity: ENTStageResult
# Description: without a runId the result cannot be matched to the stalled run ML.ENT.e80e3c97/v1
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entStageResult.pipelineRunId !== null && entStageResult.pipelineRunId.length > 0
exit 0
