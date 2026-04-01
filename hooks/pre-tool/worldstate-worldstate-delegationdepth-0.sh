#!/bin/bash
# Invariant: worldState.delegationDepth >= 0
# Entity: WorldState
# Description: delegation depth cannot be negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: worldState.delegationDepth >= 0
exit 0
