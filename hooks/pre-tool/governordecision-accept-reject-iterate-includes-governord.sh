#!/bin/bash
# Invariant: ['ACCEPT','REJECT','ITERATE'].includes(governorDecision.decision)
# Entity: GovernorDecision
# Description: decision must be one of the three canonical outcomes — no other terminal states exist
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['ACCEPT','REJECT','ITERATE'].includes(governorDecision.decision)
exit 0
