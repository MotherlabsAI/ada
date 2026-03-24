#!/bin/bash
# Invariant: elicitationTurn.clarificationRequestId !== null
# Entity: ElicitationTurn
# Description: Turn must always have a ClarificationRequest — a turn without a question has no structural meaning
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationTurn.clarificationRequestId !== null
exit 0
