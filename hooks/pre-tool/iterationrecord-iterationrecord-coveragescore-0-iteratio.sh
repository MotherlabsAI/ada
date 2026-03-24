#!/bin/bash
# Invariant: iterationRecord.coverageScore >= 0 && iterationRecord.coverageScore <= 1
# Entity: IterationRecord
# Description: Coverage score must be bounded — unbounded scores corrupt iteration comparison logic
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: iterationRecord.coverageScore >= 0 && iterationRecord.coverageScore <= 1
exit 0
