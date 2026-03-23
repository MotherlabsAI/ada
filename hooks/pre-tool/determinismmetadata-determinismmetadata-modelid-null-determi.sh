#!/bin/bash
# Invariant: determinismMetadata.modelId !== null && determinismMetadata.modelId.length > 0
# Entity: DeterminismMetadata
# Description: model id must be recorded to make a run reproducible
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: determinismMetadata.modelId !== null && determinismMetadata.modelId.length > 0
exit 0
