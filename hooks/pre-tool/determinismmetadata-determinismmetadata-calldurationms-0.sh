#!/bin/bash
# Invariant: determinismMetadata.callDurationMs >= 0
# Entity: DeterminismMetadata
# Description: call duration must be non-negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: determinismMetadata.callDurationMs >= 0
exit 0
