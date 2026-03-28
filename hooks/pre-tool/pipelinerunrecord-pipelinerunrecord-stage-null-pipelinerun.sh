#!/bin/bash
# Invariant: pipelineRunRecord.stage !== null && pipelineRunRecord.stage.length > 0
# Entity: PipelineRunRecord
# Description: the record must name the current stage; stageless run records cannot be used to route artifacts to the correct stage handlers
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRunRecord.stage !== null && pipelineRunRecord.stage.length > 0
exit 0
