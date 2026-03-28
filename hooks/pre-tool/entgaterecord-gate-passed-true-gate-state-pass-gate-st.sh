#!/bin/bash
# Invariant: gate.passed === true ? gate.state === 'PASS' : gate.state !== 'PASS'
# Entity: ENTGateRecord
# Description: the ENTGateState enumeration must agree with the passed boolean — contradictory state is structurally invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === true ? gate.state === 'PASS' : gate.state !== 'PASS'
exit 0
