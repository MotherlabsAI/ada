#!/bin/bash
# Invariant: conflictingIntegrationMapping.entityMentionId !== null
# Entity: ConflictingIntegrationMapping
# Description: conflict must be anchored to a specific entity mention
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: conflictingIntegrationMapping.entityMentionId !== null
exit 0
