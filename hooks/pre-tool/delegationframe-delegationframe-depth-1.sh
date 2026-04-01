#!/bin/bash
# Invariant: delegationFrame.depth >= 1
# Entity: DelegationFrame
# Description: depth must be at least 1; depth 0 means the frame was created outside any delegation boundary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: delegationFrame.depth >= 1
exit 0
