#!/bin/bash
# Invariant: adaCLI.apiKeyConfig !== null
# Entity: AdaCLI
# Description: API key configuration must be present
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaCLI.apiKeyConfig !== null
exit 0
