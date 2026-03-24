#!/bin/bash
# Invariant: iterationRecord.gatePassRate >= 0 && iterationRecord.gatePassRate <= 1
# Entity: IterationRecord
# Description: Gate pass rate must be in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.gatePassRate >= 0 && iterationRecord.gatePassRate <= 1
exit 0
