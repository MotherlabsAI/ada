#!/bin/bash
# Invariant: entGateRecord.entityCount >= 1
# Entity: ENTGateRecord
# Description: a gate record with zero entities indicates ENT extracted nothing — this is a gate failure condition
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.entityCount >= 1
exit 0
