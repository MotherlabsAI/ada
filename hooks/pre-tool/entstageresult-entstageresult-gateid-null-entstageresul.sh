#!/bin/bash
# Invariant: entStageResult.gateId !== null && entStageResult.gateId.length > 0
# Entity: ENTStageResult
# Description: without a gateId the result is unanchored to its gate record and cannot be used to confirm gate passage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entStageResult.gateId !== null && entStageResult.gateId.length > 0
exit 0
