#!/bin/bash
# Invariant: intStage.entityCount === 26
# Entity: INTStage
# Description: INT stage operates on exactly the 26 identified entities
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.entityCount === 26
exit 0
