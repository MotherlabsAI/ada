#!/bin/bash
# Invariant: entGateRecord.passed === true ? entGateRecord.evaluatedAt !== null && entGateRecord.evaluatedAt > 0 : true
# Entity: ENTGateRecord
# Description: a passed gate must record its evaluation timestamp for audit purposes
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.passed === true ? entGateRecord.evaluatedAt !== null && entGateRecord.evaluatedAt > 0 : true
exit 0
