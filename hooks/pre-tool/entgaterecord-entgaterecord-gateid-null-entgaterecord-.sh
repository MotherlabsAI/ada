#!/bin/bash
# Invariant: entGateRecord.gateId !== null && entGateRecord.gateId.length > 0
# Entity: ENTGateRecord
# Description: gate records must be uniquely identifiable for cross-referencing with provenance records
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entGateRecord.gateId !== null && entGateRecord.gateId.length > 0
exit 0
