#!/bin/bash
# Invariant: session.decision !== null
# Entity: Session
# Description: every session must end with an explicit ACCEPT, DRIFT, or HALT — an undecided session is an illegal terminal state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.decision !== null
exit 0
