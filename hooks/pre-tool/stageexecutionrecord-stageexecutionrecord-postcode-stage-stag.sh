#!/bin/bash
# Invariant: stageExecutionRecord.postcode.stage === stageExecutionRecord.stageCode
# Entity: StageExecutionRecord
# Description: postcode stage tag must match the recorded stage code
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.postcode.stage === stageExecutionRecord.stageCode
exit 0
