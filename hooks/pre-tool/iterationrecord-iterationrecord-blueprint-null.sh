#!/bin/bash
# Invariant: iterationRecord.blueprint !== null
# Entity: IterationRecord
# Description: every iteration must produce a blueprint — an iteration without a blueprint has no content to re-evaluate
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.blueprint !== null
exit 0
