#!/bin/bash
# Invariant: determinismMetadata.temperature >= 0 && determinismMetadata.temperature <= 1
# Entity: DeterminismMetadata
# Description: Temperature must be in [0,1] — values outside this range are not valid LLM sampling parameters
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: determinismMetadata.temperature >= 0 && determinismMetadata.temperature <= 1
exit 0
