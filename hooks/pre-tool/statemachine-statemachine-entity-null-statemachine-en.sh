#!/bin/bash
# Invariant: stateMachine.entity !== null && stateMachine.entity.length > 0
# Entity: StateMachine
# Description: state machine must be bound to a named entity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stateMachine.entity !== null && stateMachine.entity.length > 0
exit 0
