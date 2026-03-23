#!/bin/bash
# Invariant: runId.value === 'ML.INT.01d32819/v1'
# Entity: RunID
# Description: canonical run ID is a fixed traceability reference
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runId.value === 'ML.INT.01d32819/v1'
exit 0
