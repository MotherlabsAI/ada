#!/bin/bash
# Invariant: iterationRecord.blueprint !== null
# Entity: IterationRecord
# Description: Each iteration must produce a blueprint — an iteration without output cannot be selected as best
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.blueprint !== null
exit 0
