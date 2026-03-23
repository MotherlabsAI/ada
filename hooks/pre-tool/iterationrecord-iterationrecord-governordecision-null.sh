#!/bin/bash
# Invariant: iterationRecord.governorDecision !== null
# Entity: IterationRecord
# Description: every iteration must record the governor decision that closed it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.governorDecision !== null
exit 0
