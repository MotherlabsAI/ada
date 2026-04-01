#!/bin/bash
# Invariant: worldState.uncertaintyScore >= 0 && worldState.uncertaintyScore <= 1
# Entity: WorldState
# Description: uncertainty is a normalized score; values outside [0,1] are semantically invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: worldState.uncertaintyScore >= 0 && worldState.uncertaintyScore <= 1
exit 0
