#!/bin/bash
# Invariant: entGateRecord.state !== null
# Entity: ENTGateRecord
# Description: ENTGateState must be a typed value; null state means the gate has not resolved and cannot signal pipeline continuation per G9
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.state !== null
exit 0
