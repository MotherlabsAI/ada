#!/bin/bash
# Invariant: promptRegistry.activeVersion !== null
# Entity: PromptRegistry
# Description: registry must declare an active version
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: promptRegistry.activeVersion !== null
exit 0
