#!/bin/bash
# Invariant: pinnedPrompt.structuredOutputSchema !== null
# Entity: PinnedPrompt
# Description: prompt must declare its expected output schema
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pinnedPrompt.structuredOutputSchema !== null
exit 0
