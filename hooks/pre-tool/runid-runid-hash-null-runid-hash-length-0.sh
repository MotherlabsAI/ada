#!/bin/bash
# Invariant: runId.hash !== null && runId.hash.length > 0
# Entity: RunID
# Description: hash segment must be non-empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runId.hash !== null && runId.hash.length > 0
exit 0
