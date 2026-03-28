#!/bin/bash
# Invariant: result.gateId !== null && result.gateId.length > 0
# Entity: ENTStageResult
# Description: the result must reference the gate record that validated it — without this the result is unauditable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: result.gateId !== null && result.gateId.length > 0
exit 0
