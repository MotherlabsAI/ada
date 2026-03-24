#!/bin/bash
# Invariant: determinismMetadata.retryCount >= 0
# Entity: DeterminismMetadata
# Description: Retry count must be non-negative — it is a cardinality
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: determinismMetadata.retryCount >= 0
exit 0
