#!/bin/bash
# Invariant: intStage.isStateless === true
# Entity: INTStage
# Description: INT stage carries no mutable state from prior runs
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.isStateless === true
exit 0
