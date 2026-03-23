#!/bin/bash
# Invariant: typeof runId.value === 'string'
# Entity: RunID
# Description: run ID is always a string, never a numeric or structured type
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeof runId.value === 'string'
exit 0
