#!/bin/bash
# Invariant: transition.fromStepId !== null
# Entity: Transition
# Description: transition must have a source step
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: transition.fromStepId !== null
exit 0
