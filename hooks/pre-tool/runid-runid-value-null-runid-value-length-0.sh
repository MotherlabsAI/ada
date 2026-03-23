#!/bin/bash
# Invariant: runId.value !== null && runId.value.length > 0
# Entity: RunID
# Description: run ID must be a non-empty opaque string
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runId.value !== null && runId.value.length > 0
exit 0
