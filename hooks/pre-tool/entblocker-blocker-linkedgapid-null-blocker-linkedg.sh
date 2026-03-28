#!/bin/bash
# Invariant: blocker.linkedGapId !== null && blocker.linkedGapId.length > 0
# Entity: ENTBlocker
# Description: every blocker must be linked to a gap — a blocker with no gap link has no resolution path
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.linkedGapId !== null && blocker.linkedGapId.length > 0
exit 0
