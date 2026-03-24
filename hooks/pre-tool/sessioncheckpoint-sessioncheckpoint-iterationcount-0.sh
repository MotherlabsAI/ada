#!/bin/bash
# Invariant: sessionCheckpoint.iterationCount >= 0
# Entity: SessionCheckpoint
# Description: Iteration count must be non-negative — negative counts are structurally invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: sessionCheckpoint.iterationCount >= 0
exit 0
