#!/bin/bash
# Invariant: entGateRecord.passed === (entGateRecord.state === 'PASS')
# Entity: ENTGateRecord
# Description: the boolean passed and the typed ENTGateState must agree; a disagreement means the gate record is internally inconsistent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.passed === (entGateRecord.state === 'PASS')
exit 0
