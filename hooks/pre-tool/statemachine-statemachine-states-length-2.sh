#!/bin/bash
# Invariant: stateMachine.states.length >= 2
# Entity: StateMachine
# Description: state machine must define at least two states
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stateMachine.states.length >= 2
exit 0
