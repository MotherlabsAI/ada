#!/bin/bash
# Invariant: determinismMetadata.temperature >= 0
# Entity: DeterminismMetadata
# Description: Temperature must be non-negative — negative temperature is not a valid model parameter
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: determinismMetadata.temperature >= 0
exit 0
