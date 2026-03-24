#!/bin/bash
# Invariant: stateMachine.transitions.length > 0
# Entity: StateMachine
# Description: state machine must define at least one transition
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stateMachine.transitions.length > 0
exit 0
