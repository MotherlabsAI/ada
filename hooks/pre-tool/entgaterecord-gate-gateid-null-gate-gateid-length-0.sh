#!/bin/bash
# Invariant: gate.gateId !== null && gate.gateId.length > 0
# Entity: ENTGateRecord
# Description: a gate without an ID cannot be referenced in the ENTStageResult
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.gateId !== null && gate.gateId.length > 0
exit 0
