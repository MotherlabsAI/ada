#!/bin/bash
# Invariant: integrationMapping.conflicting === (integrationMapping.candidateTargetIds.length > 1)
# Entity: IntegrationMapping
# Description: conflict flag is true if and only if multiple candidate targets exist
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: integrationMapping.conflicting === (integrationMapping.candidateTargetIds.length > 1)
exit 0
