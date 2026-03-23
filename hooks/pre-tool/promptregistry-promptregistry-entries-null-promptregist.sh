#!/bin/bash
# Invariant: promptRegistry.entries !== null && promptRegistry.entries.length > 0
# Entity: PromptRegistry
# Description: registry must contain at least one prompt
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: promptRegistry.entries !== null && promptRegistry.entries.length > 0
exit 0
