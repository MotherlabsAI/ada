#!/bin/bash
# Invariant: conflictingIntegrationMapping.candidateBindings.length === conflictingIntegrationMapping.candidateCount
# Entity: ConflictingIntegrationMapping
# Description: candidate bindings array length matches declared candidate count
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: conflictingIntegrationMapping.candidateBindings.length === conflictingIntegrationMapping.candidateCount
exit 0
