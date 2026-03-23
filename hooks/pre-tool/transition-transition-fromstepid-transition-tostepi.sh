#!/bin/bash
# Invariant: transition.fromStepId !== transition.toStepId
# Entity: Transition
# Description: transitions must not loop to same step without explicit cycle marker
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: transition.fromStepId !== transition.toStepId
exit 0
