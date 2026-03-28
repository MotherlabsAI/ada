#!/bin/bash
# Invariant: entGateRecord.gateId !== null && entGateRecord.gateId.length > 0
# Entity: ENTGateRecord
# Description: without a gateId the gate cannot be referenced in the stalled pipeline run or governor decision
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.gateId !== null && entGateRecord.gateId.length > 0
exit 0
