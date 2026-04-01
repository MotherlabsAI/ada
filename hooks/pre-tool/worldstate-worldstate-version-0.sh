#!/bin/bash
# Invariant: worldState.version >= 0
# Entity: WorldState
# Description: version is a monotonically increasing counter — negative versions indicate state corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: worldState.version >= 0
exit 0
