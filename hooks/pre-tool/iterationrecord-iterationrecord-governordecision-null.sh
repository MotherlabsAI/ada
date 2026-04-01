#!/bin/bash
# Invariant: iterationRecord.governorDecision !== null
# Entity: IterationRecord
# Description: every iteration record must capture the governor decision that triggered or concluded it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.governorDecision !== null
exit 0
