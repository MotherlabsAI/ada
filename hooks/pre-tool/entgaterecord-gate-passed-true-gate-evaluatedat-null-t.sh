#!/bin/bash
# Invariant: gate.passed === true ? gate.evaluatedAt !== null : true
# Entity: ENTGateRecord
# Description: a passing gate must record when it was evaluated — an unevaluated gate cannot have passed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === true ? gate.evaluatedAt !== null : true
exit 0
