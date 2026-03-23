#!/bin/bash
# Invariant: integrationMapping.candidateTargetIds.length >= 1
# Entity: IntegrationMapping
# Description: a mapping must reference at least one candidate target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: integrationMapping.candidateTargetIds.length >= 1
exit 0
