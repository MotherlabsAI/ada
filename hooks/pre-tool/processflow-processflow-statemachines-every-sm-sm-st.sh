#!/bin/bash
# Invariant: processFlow.stateMachines.every(sm => sm.states.length >= 2)
# Entity: ProcessFlow
# Description: every state machine must have at least two states — a single-state machine has no transitions
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.stateMachines.every(sm => sm.states.length >= 2)
exit 0
