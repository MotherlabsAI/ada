#!/bin/bash
# Invariant: intStage.version !== null
# Entity: INTStage
# Description: version component of run ID must be present
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.version !== null
exit 0
