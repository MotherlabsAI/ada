#!/bin/bash
# Invariant: determinismMetadata.maxTokens > 0
# Entity: DeterminismMetadata
# Description: Max tokens must be positive — a zero or negative token budget makes the LLM call impossible
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: determinismMetadata.maxTokens > 0
exit 0
