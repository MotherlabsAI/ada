#!/bin/bash
# Invariant: conflictingIntegrationMapping.candidateCount >= 2
# Entity: ConflictingIntegrationMapping
# Description: a conflict requires at least two competing candidate bindings
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: conflictingIntegrationMapping.candidateCount >= 2
exit 0
