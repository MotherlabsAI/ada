#!/bin/bash
# Invariant: entStageResult.passed === true
# Entity: ENTStageResult
# Description: G1 and G6 require a PASSING ENTStageResult; a failing ENTStageResult does not satisfy either goal
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entStageResult.passed === true
exit 0
