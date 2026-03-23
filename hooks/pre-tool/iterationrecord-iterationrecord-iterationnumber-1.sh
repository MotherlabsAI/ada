#!/bin/bash
# Invariant: iterationRecord.iterationNumber >= 1
# Entity: IterationRecord
# Description: iteration number must be positive — there is no zeroth iteration
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.iterationNumber >= 1
exit 0
