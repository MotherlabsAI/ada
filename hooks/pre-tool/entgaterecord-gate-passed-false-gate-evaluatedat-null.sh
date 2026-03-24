#!/bin/bash
# Invariant: gate.passed === false || gate.evaluatedAt !== null
# Entity: ENTGateRecord
# Description: a passing gate must record when it was evaluated — null evaluatedAt on a passed gate breaks temporal ordering in the audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === false || gate.evaluatedAt !== null
exit 0
