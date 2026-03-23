#!/bin/bash
# Invariant: conflictingIntegrationMapping.isResolved === false || conflictingIntegrationMapping.candidateCount >= 2
# Entity: ConflictingIntegrationMapping
# Description: resolved state may only transition from a genuine multi-candidate conflict
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: conflictingIntegrationMapping.isResolved === false || conflictingIntegrationMapping.candidateCount >= 2
exit 0
