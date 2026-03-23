#!/bin/bash
# Invariant: transition.transitionId !== null
# Entity: Transition
# Description: transition must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: transition.transitionId !== null
exit 0
