#!/bin/bash
# Invariant: result.passed === true ? result.gateState === 'PASS' : result.gateState !== 'PASS'
# Entity: ENTStageResult
# Description: the result's passed flag and gateState must be consistent — a passing result with a non-PASS gate state is an invalid terminal
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: result.passed === true ? result.gateState === 'PASS' : result.gateState !== 'PASS'
exit 0
