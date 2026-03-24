#!/bin/bash
# Invariant: iterationRecord.iterationNumber > 0
# Entity: IterationRecord
# Description: Iteration number must be positive — iteration zero is indistinguishable from an uninitialized record
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.iterationNumber > 0
exit 0
