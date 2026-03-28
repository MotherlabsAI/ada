#!/bin/bash
# Invariant: entGateRecord.passed === true ? entGateRecord.entityCount > 0 : true
# Entity: ENTGateRecord
# Description: a gate cannot pass against zero entities; the EntityMap must be populated for G5 to be satisfied
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.passed === true ? entGateRecord.entityCount > 0 : true
exit 0
