#!/bin/bash
# Invariant: stageExecutionRecord.metadata.retryCount >= 0
# Entity: StageExecutionRecord
# Description: retry count must be non-negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageExecutionRecord.metadata.retryCount >= 0
exit 0
