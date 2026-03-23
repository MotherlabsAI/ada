#!/bin/bash
# Invariant: apiKeyConfiguration.source !== null
# Entity: APIKeyConfiguration
# Description: key source must be declared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: apiKeyConfiguration.source !== null
exit 0
