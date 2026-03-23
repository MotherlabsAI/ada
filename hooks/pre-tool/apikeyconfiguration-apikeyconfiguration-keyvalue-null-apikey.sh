#!/bin/bash
# Invariant: apiKeyConfiguration.keyValue !== null && apiKeyConfiguration.keyValue.length > 0
# Entity: APIKeyConfiguration
# Description: key value must be non-empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: apiKeyConfiguration.keyValue !== null && apiKeyConfiguration.keyValue.length > 0
exit 0
