#!/bin/bash
# Invariant: stageExecutionRecord.metadata.temperature >= 0 && stageExecutionRecord.metadata.temperature <= 1
# Entity: StageExecutionRecord
# Description: temperature must be in [0,1] for determinism metadata to be valid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.metadata.temperature >= 0 && stageExecutionRecord.metadata.temperature <= 1
exit 0
