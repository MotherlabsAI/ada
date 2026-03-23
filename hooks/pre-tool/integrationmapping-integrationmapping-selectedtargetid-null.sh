#!/bin/bash
# Invariant: integrationMapping.selectedTargetId === null || integrationMapping.candidateTargetIds.includes(integrationMapping.selectedTargetId)
# Entity: IntegrationMapping
# Description: selected target, when present, must be a member of candidate targets
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: integrationMapping.selectedTargetId === null || integrationMapping.candidateTargetIds.includes(integrationMapping.selectedTargetId)
exit 0
