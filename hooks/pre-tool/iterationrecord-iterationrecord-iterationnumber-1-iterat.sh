#!/bin/bash
# Invariant: iterationRecord.iterationNumber >= 1 && iterationRecord.iterationNumber <= 3
# Entity: IterationRecord
# Description: iteration number must be between 1 and 3 — iterations outside this range violate the max-3 GOV constraint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.iterationNumber >= 1 && iterationRecord.iterationNumber <= 3
exit 0
