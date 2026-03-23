#!/bin/bash
# Invariant: adaCLI.activePromptRegistry !== null
# Entity: AdaCLI
# Description: prompt registry must be bound at startup
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaCLI.activePromptRegistry !== null
exit 0
